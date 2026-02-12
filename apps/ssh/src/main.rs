use anyhow::{Error, Result};
use std::{collections::HashMap, sync::Arc};

use russh::{
    Channel, ChannelId, CryptoVec, Pty,
    keys::{Algorithm, PrivateKey, ssh_key::rand_core::OsRng},
    server::{self, Auth, Msg, Server as _, Session},
};
use tokio::{net::TcpListener, sync::Mutex};

#[derive(Clone)]
struct Server {
    clients: Arc<Mutex<HashMap<usize, (ChannelId, server::Handle)>>>,
    id: usize,
}

impl server::Server for Server {
    type Handler = Self;

    fn new_client(&mut self, addr: Option<std::net::SocketAddr>) -> Self::Handler {
        let s = self.clone();
        self.id += 1;
        println!("[{}] New client connected from {:?}", self.id, addr);
        s
    }
}

impl server::Handler for Server {
    type Error = Error;

    async fn channel_open_session(
        &mut self,
        channel: Channel<Msg>,
        session: &mut server::Session,
    ) -> Result<bool, Self::Error> {
        {
            let mut clients = self.clients.lock().await;
            clients.insert(self.id, (channel.id(), session.handle()));
        }
        Ok(true)
    }

    async fn auth_none(&mut self, user: &str) -> Result<Auth, Self::Error> {
        println!("[{}] User '{}' authenticated (none auth)", self.id, user);
        Ok(Auth::Accept)
    }

    async fn pty_request(
        &mut self,
        channel: ChannelId,
        _term: &str,
        _col_width: u32,
        _row_height: u32,
        _pix_width: u32,
        _pix_height: u32,
        _modes: &[(Pty, u32)],
        session: &mut Session,
    ) -> Result<(), Self::Error> {
        session.channel_success(channel)?;
        Ok(())
    }

    async fn shell_request(
        &mut self,
        channel: ChannelId,
        session: &mut Session,
    ) -> Result<(), Self::Error> {
        println!("[{}] Shell requested on channel {:?}", self.id, channel);
        // Acknowledge the shell request
        session.channel_success(channel)?;

        // Send welcome message when shell is requested
        let welcome = CryptoVec::from(
            "\r\n\u{2615} Rust SSH Coffee Shop\r\nPress q to quit\r\n\r\n".as_bytes(),
        );
        session.data(channel, welcome)?;
        Ok(())
    }

    async fn exec_request(
        &mut self,
        channel: ChannelId,
        data: &[u8],
        session: &mut Session,
    ) -> Result<(), Self::Error> {
        println!(
            "[{}] Exec requested on channel {:?}: {:?}",
            self.id,
            channel,
            String::from_utf8_lossy(data)
        );
        // Acknowledge the exec request
        session.channel_success(channel)?;

        // Send welcome message (same as shell_request)
        let welcome = CryptoVec::from(
            "\r\n\u{2615} Welcome to Srijan Mahajan's portfolio\r\nPress q to quit\r\n\r\n"
                .as_bytes(),
        );
        session.data(channel, welcome)?;
        Ok(())
    }

    async fn data(
        &mut self,
        channel: ChannelId,
        data: &[u8],
        session: &mut Session,
    ) -> Result<(), Self::Error> {
        if data == b"q" {
            session.close(channel)?;
        }
        Ok(())
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    let config = russh::server::Config {
        inactivity_timeout: Some(std::time::Duration::from_secs(3600)),
        auth_rejection_time: std::time::Duration::from_secs(3),
        auth_rejection_time_initial: Some(std::time::Duration::from_secs(0)),
        keys: vec![PrivateKey::random(&mut OsRng, Algorithm::Ed25519)?],
        ..Default::default()
    };

    let config = Arc::new(config);
    let mut sh = Server {
        clients: Arc::new(Mutex::new(HashMap::new())),
        id: 0,
    };

    let socket = TcpListener::bind("0.0.0.0:2222").await?;
    println!("SSH server listening on 0.0.0.0:2222");

    sh.run_on_socket(config, &socket).await?;

    Ok(())
}
