use std::net::SocketAddr;

use crate::handler::{ClientHandler, ClientMap};

/// SSH Server that manages client connections
#[derive(Clone)]
pub struct Server {
    clients: ClientMap,
    next_id: usize,
}

impl Server {
    /// Create a new SSH server instance
    pub fn new() -> Self {
        Self {
            clients: ClientMap::default(),
            next_id: 0,
        }
    }

    /// Get a reference to the client map
    pub fn clients(&self) -> ClientMap {
        ClientMap::clone(&self.clients)
    }
}

impl Default for Server {
    fn default() -> Self {
        Self::new()
    }
}

impl russh::server::Server for Server {
    type Handler = ClientHandler;

    fn new_client(&mut self, addr: Option<SocketAddr>) -> Self::Handler {
        self.next_id += 1;
        let client_id = self.next_id;

        println!("[{}] New client connected from {:?}", client_id, addr);

        ClientHandler::new(client_id, self.clients())
    }
}
