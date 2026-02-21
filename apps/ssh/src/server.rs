//! SSH Server that manages client connections
//!
//! Includes shared services for database and email functionality

use std::net::SocketAddr;

use crate::handler::{ClientHandler, ClientMap, SharedServices};

/// SSH Server that manages client connections
#[derive(Clone)]
pub struct Server {
    clients: ClientMap,
    services: SharedServices,
    next_id: usize,
}

impl Server {
    /// Create a new SSH server instance with shared services
    pub fn new(services: SharedServices) -> Self {
        Self {
            clients: ClientMap::default(),
            services,
            next_id: 0,
        }
    }

    /// Get a reference to the client map
    pub fn clients(&self) -> ClientMap {
        ClientMap::clone(&self.clients)
    }

    /// Get a reference to the shared services
    #[allow(dead_code)]
    pub fn services(&self) -> &SharedServices {
        &self.services
    }
}

impl russh::server::Server for Server {
    type Handler = ClientHandler;

    fn new_client(&mut self, addr: Option<SocketAddr>) -> Self::Handler {
        self.next_id += 1;
        let client_id = self.next_id;

        println!("[{}] New client connected from {:?}", client_id, addr);

        ClientHandler::new(client_id, self.clients(), self.services.clone(), addr)
    }
}
