mod config;
mod handler;
mod server;
mod ui;

use anyhow::Result;
use russh::server::Server as _;
use tokio::net::TcpListener;

use crate::config::ServerConfig;
use crate::server::Server;

#[tokio::main]
async fn main() -> Result<()> {
    // Load configuration
    let config = ServerConfig::default();
    let russh_config = config.to_russh_config()?;

    // Create server instance
    let mut server = Server::new();

    // Bind to the configured address
    let bind_addr = config.bind_address();
    let socket = TcpListener::bind(&bind_addr).await?;
    println!("SSH server listening on {}", bind_addr);

    // Run the server
    server.run_on_socket(russh_config, &socket).await?;

    Ok(())
}
