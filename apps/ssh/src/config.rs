use anyhow::Result;
use russh::keys::{Algorithm, PrivateKey};
use std::sync::Arc;
use std::time::Duration;

/// Default SSH server port
pub const DEFAULT_PORT: u16 = 2222;

/// Default bind address
pub const DEFAULT_BIND_ADDR: &str = "0.0.0.0";

/// Server configuration options
#[derive(Debug, Clone)]
pub struct ServerConfig {
    pub bind_addr: String,
    pub port: u16,
    pub inactivity_timeout_secs: u64,
    pub auth_rejection_time_secs: u64,
}

impl Default for ServerConfig {
    fn default() -> Self {
        Self {
            bind_addr: DEFAULT_BIND_ADDR.to_string(),
            port: DEFAULT_PORT,
            inactivity_timeout_secs: 3600,
            auth_rejection_time_secs: 3,
        }
    }
}

impl ServerConfig {
    /// Returns the full bind address string (addr:port)
    pub fn bind_address(&self) -> String {
        format!("{}:{}", self.bind_addr, self.port)
    }

    /// Creates the russh server configuration
    pub fn to_russh_config(&self) -> Result<Arc<russh::server::Config>> {
        let config = russh::server::Config {
            inactivity_timeout: Some(Duration::from_secs(self.inactivity_timeout_secs)),
            auth_rejection_time: Duration::from_secs(self.auth_rejection_time_secs),
            auth_rejection_time_initial: Some(Duration::from_secs(0)),
            keys: vec![PrivateKey::random(&mut rand::rng(), Algorithm::Ed25519)?],
            ..Default::default()
        };

        Ok(Arc::new(config))
    }
}
