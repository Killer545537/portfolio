use anyhow::{Error, Result};
use russh::{
    Channel, ChannelId, CryptoVec, Pty,
    server::{Auth, Msg, Session},
};
use std::{collections::HashMap, sync::Arc};
use tokio::sync::Mutex;

use crate::ui;

/// Shared map of all connected clients
pub type ClientMap = Arc<Mutex<HashMap<usize, ClientInfo>>>;

/// Information stored for each connected client
pub struct ClientInfo {
    pub channel_id: ChannelId,
    pub handle: russh::server::Handle,
}

/// Represents a connected SSH client session
#[derive(Clone)]
pub struct ClientHandler {
    /// Shared map of all connected clients
    clients: ClientMap,
    /// Unique identifier for this client
    id: usize,
    /// Username of the authenticated client
    username: Option<String>,
    /// Input buffer for accumulating characters until Enter is pressed
    input_buffer: String,
}

impl ClientHandler {
    /// Create a new client handler
    pub fn new(id: usize, clients: ClientMap) -> Self {
        Self {
            clients,
            id,
            username: None,
            input_buffer: String::new(),
        }
    }

    /// Get the client's unique ID
    #[allow(dead_code)]
    pub fn id(&self) -> usize {
        self.id
    }

    /// Send data to the client's channel
    async fn send_welcome(&self, channel: ChannelId, session: &mut Session) -> Result<()> {
        let welcome = ui::render_welcome_message();
        let data = CryptoVec::from(welcome.as_bytes());
        session.data(channel, data)?;
        // Send initial prompt
        self.send_prompt(channel, session)?;
        Ok(())
    }

    /// Send a message to the client
    fn send_message(&self, channel: ChannelId, message: &str, session: &mut Session) -> Result<()> {
        let data = CryptoVec::from(message.as_bytes());
        session.data(channel, data)?;
        Ok(())
    }

    /// Send a prompt to the client
    fn send_prompt(&self, channel: ChannelId, session: &mut Session) -> Result<()> {
        self.send_message(channel, "\r\n> ", session)
    }

    /// Process a complete command (after Enter is pressed)
    fn process_command(
        &mut self,
        channel: ChannelId,
        command: &str,
        session: &mut Session,
    ) -> Result<bool> {
        let cmd = command.trim().to_lowercase();

        match cmd.as_str() {
            "q" | "quit" | "exit" => {
                println!("[{}] Client requested disconnect", self.id);
                self.send_message(channel, &ui::render_goodbye(), session)?;
                return Ok(true); // Signal to close the channel
            }
            "h" | "help" => {
                self.send_message(channel, &ui::render_help(), session)?;
            }
            "about" => {
                self.send_message(channel, &ui::render_about(), session)?;
            }
            "skills" => {
                self.send_message(channel, &ui::render_skills(), session)?;
            }
            "contact" => {
                self.send_message(channel, &ui::render_contact(), session)?;
            }
            "" => {
                // Empty command, just show prompt again
            }
            _ => {
                self.send_message(channel, &ui::render_unknown_command(&cmd), session)?;
            }
        }

        // Send a new prompt
        self.send_prompt(channel, session)?;
        Ok(false) // Don't close the channel
    }
}

impl russh::server::Handler for ClientHandler {
    type Error = Error;

    async fn channel_open_session(
        &mut self,
        channel: Channel<Msg>,
        session: &mut Session,
    ) -> Result<bool, Self::Error> {
        let client_info = ClientInfo {
            channel_id: channel.id(),
            handle: session.handle(),
        };

        {
            let mut clients = self.clients.lock().await;
            clients.insert(self.id, client_info);
        }

        println!("[{}] Session channel opened", self.id);
        Ok(true)
    }

    async fn auth_none(&mut self, user: &str) -> Result<Auth, Self::Error> {
        self.username = Some(user.to_string());
        println!("[{}] User '{}' authenticated (none auth)", self.id, user);
        Ok(Auth::Accept)
    }

    async fn pty_request(
        &mut self,
        channel: ChannelId,
        term: &str,
        col_width: u32,
        row_height: u32,
        _pix_width: u32,
        _pix_height: u32,
        _modes: &[(Pty, u32)],
        session: &mut Session,
    ) -> Result<(), Self::Error> {
        println!(
            "[{}] PTY requested: term={}, size={}x{}",
            self.id, term, col_width, row_height
        );
        session.channel_success(channel)?;
        Ok(())
    }

    async fn shell_request(
        &mut self,
        channel: ChannelId,
        session: &mut Session,
    ) -> Result<(), Self::Error> {
        println!("[{}] Shell requested on channel {:?}", self.id, channel);
        session.channel_success(channel)?;
        self.send_welcome(channel, session).await?;
        Ok(())
    }

    async fn exec_request(
        &mut self,
        channel: ChannelId,
        data: &[u8],
        session: &mut Session,
    ) -> Result<(), Self::Error> {
        let command = String::from_utf8_lossy(data);
        println!(
            "[{}] Exec requested on channel {:?}: {}",
            self.id,
            channel,
            if command.len() > 50 {
                format!("{}...", &command[..50])
            } else {
                command.to_string()
            }
        );
        session.channel_success(channel)?;
        self.send_welcome(channel, session).await?;
        Ok(())
    }

    async fn data(
        &mut self,
        channel: ChannelId,
        data: &[u8],
        session: &mut Session,
    ) -> Result<(), Self::Error> {
        for &byte in data {
            match byte {
                // Enter key (CR or LF)
                13 | 10 => {
                    // Move to new line
                    self.send_message(channel, "\r\n", session)?;

                    // Process the buffered command
                    let command = std::mem::take(&mut self.input_buffer);
                    let should_close = self.process_command(channel, &command, session)?;

                    if should_close {
                        session.close(channel)?;
                        return Ok(());
                    }
                }
                // Backspace or Delete (ASCII 8 or 127)
                8 | 127 => {
                    if !self.input_buffer.is_empty() {
                        self.input_buffer.pop();
                        // Send backspace sequence: move back, overwrite with space, move back again
                        self.send_message(channel, "\x08 \x08", session)?;
                    }
                }
                // Ctrl+C - cancel current input
                3 => {
                    self.input_buffer.clear();
                    self.send_message(channel, "^C\r\n", session)?;
                    self.send_prompt(channel, session)?;
                }
                // Ctrl+D - exit
                4 => {
                    println!("[{}] Client sent Ctrl+D", self.id);
                    self.send_message(channel, &ui::render_goodbye(), session)?;
                    session.close(channel)?;
                    return Ok(());
                }
                // Ctrl+U - clear line
                21 => {
                    // Clear the current line by sending backspaces
                    let clear_len = self.input_buffer.len();
                    self.input_buffer.clear();
                    for _ in 0..clear_len {
                        self.send_message(channel, "\x08 \x08", session)?;
                    }
                }
                // Regular printable characters (ASCII 32-126)
                32..=126 => {
                    self.input_buffer.push(byte as char);
                    // Echo the character back to the client
                    self.send_message(channel, &(byte as char).to_string(), session)?;
                }
                // Escape sequences (arrows, etc.) - ignore for now
                27 => {
                    // Start of escape sequence, we'll ignore it
                }
                // Ignore other control characters
                _ => {}
            }
        }

        Ok(())
    }

    async fn channel_close(
        &mut self,
        channel: ChannelId,
        _session: &mut Session,
    ) -> Result<(), Self::Error> {
        println!("[{}] Channel {:?} closed", self.id, channel);

        // Remove client from the shared map
        let mut clients = self.clients.lock().await;
        clients.remove(&self.id);

        Ok(())
    }
}
