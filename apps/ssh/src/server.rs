//! SSH Server that manages client connections
//!
//! Includes shared services for database and email functionality

use std::net::SocketAddr;

use crate::handler::{ClientHandler, SharedServices};

/// SSH Server that hands each connection its own handler
pub struct Server {
    services: SharedServices,
    next_id: usize,
}

impl Server {
    /// Create a new SSH server instance with shared services
    pub fn new(services: SharedServices) -> Self {
        Self {
            services,
            next_id: 0,
        }
    }
}

impl russh::server::Server for Server {
    type Handler = ClientHandler;

    fn new_client(&mut self, addr: Option<SocketAddr>) -> Self::Handler {
        self.next_id += 1;
        let client_id = self.next_id;

        println!("[{}] New client connected from {:?}", client_id, addr);

        ClientHandler::new(client_id, self.services.clone(), addr)
    }
}
