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
}

impl ClientHandler {
    /// Create a new client handler
    pub fn new(id: usize, clients: ClientMap) -> Self {
        Self {
            clients,
            id,
            username: None,
        }
    }

    /// Get the client's unique ID
    pub fn id(&self) -> usize {
        self.id
    }

    /// Send data to the client's channel
    async fn send_welcome(&self, channel: ChannelId, session: &mut Session) -> Result<()> {
        let welcome = ui::render_welcome_message();
        let data = CryptoVec::from(welcome.as_bytes());
        session.data(channel, data)?;
        Ok(())
    }

    /// Send a message to the client
    fn send_message(&self, channel: ChannelId, message: &str, session: &mut Session) -> Result<()> {
        let data = CryptoVec::from(message.as_bytes());
        session.data(channel, data)?;
        Ok(())
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
        let input = String::from_utf8_lossy(data);
        let input_trimmed = input.trim();

        match input_trimmed {
            "q" | "Q" => {
                println!("[{}] Client requested disconnect", self.id);
                self.send_message(channel, &ui::render_goodbye(), session)?;
                session.close(channel)?;
            }
            "h" | "H" | "help" => {
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
            _ if !input_trimmed.is_empty() && !data.contains(&13) && !data.contains(&10) => {
                // Only show unknown command for non-empty, non-newline input
                self.send_message(channel, &ui::render_unknown_command(input_trimmed), session)?;
            }
            _ => {
                // Ignore empty input and newlines
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
