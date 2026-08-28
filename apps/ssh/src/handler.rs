//! SSH Client Handler with analytics, database, and email support

use anyhow::{Error, Result};
use russh::{
    Channel, ChannelId, Pty,
    server::{Auth, ChannelOpenHandle, Msg, Session},
};
use std::net::SocketAddr;

use crate::db::OptionalDatabase;
use crate::email::OptionalEmailClient;
use crate::ui;

/// Shared services for all handlers
#[derive(Clone)]
pub struct SharedServices {
    pub db: OptionalDatabase,
    pub email: OptionalEmailClient,
}

/// Input state for multi-step forms
#[derive(Clone, Debug)]
pub enum InputState {
    /// Normal command input
    Command,
    /// Waiting for name in connect form
    ConnectName,
    /// Waiting for email in connect form (name already provided)
    ConnectEmail { name: String },
}

/// What actually happened when a visitor submitted the connect form.
#[derive(Debug, PartialEq, Eq)]
enum ContactOutcome {
    /// Stored and the confirmation email went out.
    Emailed,
    /// Stored, but no email was sent (no RESEND_API_KEY, or Resend rejected it).
    StoredOnly,
    /// Nothing was recorded.
    Failed,
}

/// Represents a connected SSH client session
#[derive(Clone)]
pub struct ClientHandler {
    /// Shared services (database, email)
    services: SharedServices,
    /// Unique identifier for this client
    id: usize,
    /// Session ID for analytics
    session_id: String,
    /// Client address
    client_addr: Option<SocketAddr>,
    /// Username of the authenticated client
    username: Option<String>,
    /// Input buffer for accumulating characters until Enter is pressed
    input_buffer: String,
    /// Current input state
    input_state: InputState,
}

impl ClientHandler {
    /// Create a new client handler
    pub fn new(id: usize, services: SharedServices, client_addr: Option<SocketAddr>) -> Self {
        let session_id = format!("ssh-{}-{}", id, chrono::Utc::now().timestamp());

        Self {
            services,
            id,
            session_id,
            client_addr,
            username: None,
            input_buffer: String::new(),
            input_state: InputState::Command,
        }
    }

    /// Send data to the client's channel
    async fn send_welcome(&self, channel: ChannelId, session: &mut Session) -> Result<()> {
        // Track connection
        let addr_str = self.client_addr.map(|a| a.to_string());
        self.services
            .db
            .track_connect(&self.session_id, addr_str.as_deref())
            .await;

        let welcome = ui::render_welcome_message();
        session.data(channel, welcome.into_bytes())?;
        // Send initial prompt
        self.send_prompt(channel, session)?;
        Ok(())
    }

    /// Send a message to the client
    fn send_message(&self, channel: ChannelId, message: &str, session: &mut Session) -> Result<()> {
        session.data(channel, message.as_bytes().to_vec())?;
        Ok(())
    }

    /// Send a prompt to the client based on current state
    fn send_prompt(&self, channel: ChannelId, session: &mut Session) -> Result<()> {
        let prompt = match &self.input_state {
            InputState::Command => "\r\n> ",
            InputState::ConnectName => "  Your name: ",
            InputState::ConnectEmail { .. } => "  Your email: ",
        };
        self.send_message(channel, prompt, session)
    }

    /// Process input based on current state
    async fn process_input(
        &mut self,
        channel: ChannelId,
        input: &str,
        session: &mut Session,
    ) -> Result<bool> {
        match self.input_state.clone() {
            InputState::Command => self.process_command(channel, input, session).await,
            InputState::ConnectName => self.process_connect_name(channel, input, session).await,
            InputState::ConnectEmail { name } => {
                self.process_connect_email(channel, input, &name, session)
                    .await
            }
        }
    }

    /// Process a complete command (after Enter is pressed)
    async fn process_command(
        &mut self,
        channel: ChannelId,
        command: &str,
        session: &mut Session,
    ) -> Result<bool> {
        let cmd = command.trim().to_lowercase();

        // Track command analytics (non-empty commands)
        if !cmd.is_empty() {
            self.services.db.track_command(&self.session_id, &cmd).await;
        }

        match cmd.as_str() {
            "q" | "quit" | "exit" => {
                println!("[{}] Client requested disconnect", self.id);
                // `channel_close` records the disconnect; doing it here too
                // would write the event twice for every clean exit.
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
            "experience" | "exp" => {
                self.send_message(channel, &ui::render_experience(), session)?;
            }
            "projects" | "proj" => {
                self.send_message(channel, &ui::render_projects(), session)?;
            }
            "education" | "edu" => {
                self.send_message(channel, &ui::render_education(), session)?;
            }
            "contact" => {
                self.send_message(channel, &ui::render_contact(), session)?;
            }
            "connect" => {
                // Start the connect flow
                self.send_message(channel, &ui::render_connect_prompt(), session)?;
                self.input_state = InputState::ConnectName;
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

    /// Process name input for connect form
    async fn process_connect_name(
        &mut self,
        channel: ChannelId,
        name: &str,
        session: &mut Session,
    ) -> Result<bool> {
        let name = name.trim().to_string();

        if name.is_empty() {
            self.send_message(
                channel,
                &ui::render_connect_error("Name cannot be empty"),
                session,
            )?;
            self.send_prompt(channel, session)?;
            return Ok(false);
        }

        // Move to email state
        self.input_state = InputState::ConnectEmail { name };
        self.send_prompt(channel, session)?;
        Ok(false)
    }

    /// Process email input for connect form
    async fn process_connect_email(
        &mut self,
        channel: ChannelId,
        email: &str,
        name: &str,
        session: &mut Session,
    ) -> Result<bool> {
        let email = email.trim().to_string();

        // Basic email validation
        if !is_valid_email(&email) {
            self.send_message(
                channel,
                &ui::render_connect_error("Please enter a valid email address"),
                session,
            )?;
            self.send_prompt(channel, session)?;
            return Ok(false);
        }

        // Show processing message
        self.send_message(channel, &ui::render_connect_processing(), session)?;

        // Store contact and send email
        let message = match self.submit_contact(name, &email).await {
            ContactOutcome::Emailed => ui::render_connect_success(name),
            ContactOutcome::StoredOnly => ui::render_connect_stored(name),
            ContactOutcome::Failed => {
                ui::render_connect_error("Something went wrong. Please try again later.")
            }
        };
        self.send_message(channel, &message, session)?;

        // Reset to command state
        self.input_state = InputState::Command;
        self.send_prompt(channel, session)?;
        Ok(false)
    }

    /// Store the contact and send the confirmation email, reporting what
    /// actually happened. Claiming an email was sent when it was not is worse
    /// than admitting the address was only recorded.
    async fn submit_contact(&self, name: &str, email: &str) -> ContactOutcome {
        self.services.db.track_contact(&self.session_id).await;

        if let Err(e) = self.services.db.store_contact(email).await {
            eprintln!("[{}] Failed to store contact: {}", self.id, e);
            return ContactOutcome::Failed;
        }

        if !self.services.email.is_available() {
            return ContactOutcome::StoredOnly;
        }

        match self.services.email.send_connection_email(name, email).await {
            Ok(()) => {
                println!("[{}] Sent connection email to {}", self.id, email);
                ContactOutcome::Emailed
            }
            Err(e) => {
                eprintln!("[{}] Failed to send email to {}: {}", self.id, email, e);
                ContactOutcome::StoredOnly
            }
        }
    }

    /// Cancel current form and return to command mode
    fn cancel_form(&mut self, channel: ChannelId, session: &mut Session) -> Result<()> {
        if !matches!(self.input_state, InputState::Command) {
            self.input_state = InputState::Command;
            self.send_message(channel, &ui::render_connect_cancelled(), session)?;
        }
        Ok(())
    }
}

impl russh::server::Handler for ClientHandler {
    type Error = Error;

    async fn channel_open_session(
        &mut self,
        _channel: Channel<Msg>,
        reply: ChannelOpenHandle,
        _session: &mut Session,
    ) -> Result<(), Self::Error> {
        println!("[{}] Session channel opened", self.id);
        // russh 0.63: the open request is rejected if this handle is dropped
        // without accepting, so this replaces the old `Ok(true)` return.
        reply.accept().await;
        Ok(())
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
        // Truncate by characters, not bytes: slicing `&command[..50]` panics
        // when byte 50 lands inside a multi-byte character.
        let preview: String = command.chars().take(50).collect();
        println!(
            "[{}] Exec requested on channel {:?}: {}",
            self.id, channel, preview
        );
        session.channel_success(channel)?;

        // Non-interactive `ssh host <cmd>`: print the banner and hang up.
        // Leaving the channel open stranded these sessions until the inactivity
        // timeout fired an hour later.
        let addr_str = self.client_addr.map(|a| a.to_string());
        self.services
            .db
            .track_connect(&self.session_id, addr_str.as_deref())
            .await;
        self.send_message(channel, &ui::render_welcome_message(), session)?;
        self.send_message(channel, &ui::render_help(), session)?;
        session.exit_status_request(channel, 0)?;
        session.close(channel)?;
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

                    // Process the buffered input
                    let input = std::mem::take(&mut self.input_buffer);
                    let should_close = self.process_input(channel, &input, session).await?;

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
                // Ctrl+C - cancel current input/form
                3 => {
                    self.input_buffer.clear();
                    self.cancel_form(channel, session)?;
                    self.send_message(channel, "^C\r\n", session)?;
                    self.send_prompt(channel, session)?;
                }
                // Ctrl+D - exit. `channel_close` records the disconnect.
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
                // ponytail: ASCII-only input. Non-ASCII names arrive as UTF-8
                // continuation bytes and are dropped rather than mangled;
                // buffer the bytes and decode on Enter if that ever matters.
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

        // The single place a disconnect is recorded: it runs for clean exits
        // and dropped connections alike.
        self.services.db.track_disconnect(&self.session_id).await;

        Ok(())
    }
}

/// Basic email validation
fn is_valid_email(email: &str) -> bool {
    // Simple validation: contains @ with text on both sides
    let parts: Vec<&str> = email.split('@').collect();
    if parts.len() != 2 {
        return false;
    }

    let local = parts[0];
    let domain = parts[1];

    // Local part and domain must not be empty
    if local.is_empty() || domain.is_empty() {
        return false;
    }

    // Domain must contain at least one dot
    if !domain.contains('.') {
        return false;
    }

    // Domain must not start or end with a dot
    if domain.starts_with('.') || domain.ends_with('.') {
        return false;
    }

    true
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_emails() {
        assert!(is_valid_email("test@example.com"));
        assert!(is_valid_email("user.name@domain.co.uk"));
        assert!(is_valid_email("user+tag@gmail.com"));
    }

    #[test]
    fn test_invalid_emails() {
        assert!(!is_valid_email("invalid"));
        assert!(!is_valid_email("@domain.com"));
        assert!(!is_valid_email("user@"));
        assert!(!is_valid_email("user@domain"));
        assert!(!is_valid_email("user@.com"));
        assert!(!is_valid_email("user@domain."));
    }

    /// The bug this replaced: `&command[..50]` panicked whenever byte 50 fell
    /// inside a multi-byte character.
    #[test]
    fn exec_preview_does_not_split_multibyte_chars() {
        let command = "é".repeat(60);
        let preview: String = command.chars().take(50).collect();
        assert_eq!(preview.chars().count(), 50);
    }
}
