//! SSH Server that manages client connections
//!
//! Includes shared services for database and email functionality

use std::net::SocketAddr;
use std::sync::Arc;
use std::sync::atomic::{AtomicUsize, Ordering};

use crate::handler::{ClientHandler, SharedServices};

/// SSH Server that hands each connection its own handler
pub struct Server {
    services: SharedServices,
    next_id: usize,
    /// Connections currently holding a `SessionPermit`
    active: Arc<AtomicUsize>,
    max_sessions: usize,
}

impl Server {
    /// Create a new SSH server instance with shared services
    pub fn new(services: SharedServices, max_sessions: usize) -> Self {
        Self {
            services,
            next_id: 0,
            active: Arc::new(AtomicUsize::new(0)),
            max_sessions,
        }
    }
}

impl russh::server::Server for Server {
    type Handler = ClientHandler;

    fn new_client(&mut self, addr: Option<SocketAddr>) -> Self::Handler {
        self.next_id += 1;
        let client_id = self.next_id;

        println!("[{}] New client connected from {:?}", client_id, addr);

        // russh offers no way to refuse here, so a client over the cap still
        // gets a handler; it just has no permit and is rejected at auth.
        let permit = SessionPermit::try_acquire(&self.active, self.max_sessions);
        if permit.is_none() {
            println!(
                "[{}] Session limit ({}) reached, will reject",
                client_id, self.max_sessions
            );
        }

        ClientHandler::new(client_id, self.services.clone(), addr, permit)
    }
}

/// One slot under the concurrent-session cap. Released on `Drop`, so a
/// connection that ends any way at all (clean exit, reset, timeout, error)
/// gives its slot back.
#[derive(Debug)]
pub struct SessionPermit {
    active: Arc<AtomicUsize>,
}

impl SessionPermit {
    /// Take a slot if fewer than `max` are in use.
    fn try_acquire(active: &Arc<AtomicUsize>, max: usize) -> Option<Self> {
        active
            .try_update(Ordering::AcqRel, Ordering::Acquire, |n| {
                (n < max).then_some(n + 1)
            })
            .ok()
            .map(|_| Self {
                active: Arc::clone(active),
            })
    }
}

impl Drop for SessionPermit {
    fn drop(&mut self) {
        self.active.fetch_sub(1, Ordering::AcqRel);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn session_cap_is_enforced_and_released_on_drop() {
        let active = Arc::new(AtomicUsize::new(0));

        let first = SessionPermit::try_acquire(&active, 2).expect("slot 1");
        let _second = SessionPermit::try_acquire(&active, 2).expect("slot 2");
        assert!(SessionPermit::try_acquire(&active, 2).is_none());

        drop(first);
        assert_eq!(active.load(Ordering::Acquire), 1);
        assert!(SessionPermit::try_acquire(&active, 2).is_some());
    }
}
