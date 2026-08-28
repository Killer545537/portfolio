//! SSH Portfolio Server
//!
//! A terminal-based portfolio accessible via SSH with analytics and email support

mod config;
mod data;
mod db;
mod email;
mod handler;
mod server;
mod ui;

use anyhow::Result;
use russh::server::Server as _;
use tokio::net::TcpListener;

use crate::config::ServerConfig;
use crate::db::OptionalDatabase;
use crate::email::OptionalEmailClient;
use crate::handler::SharedServices;
use crate::server::Server;

#[tokio::main]
async fn main() -> Result<()> {
    println!("Starting SSH Portfolio Server...");
    println!();

    dotenvy::dotenv().ok();

    // Initialize shared services
    let db = OptionalDatabase::try_connect().await;
    let email = OptionalEmailClient::from_env();

    let services = SharedServices { db, email };

    println!();

    // Load configuration
    let config = ServerConfig::from_env();
    let russh_config = config.to_russh_config()?;

    // Create server instance with services
    let mut server = Server::new(services);

    // Bind to the configured address
    let bind_addr = config.bind_address();
    let socket = TcpListener::bind(&bind_addr).await?;
    println!("SSH server listening on {}", bind_addr);
    println!("  Connect with: ssh -p {} user@<host>", config.port);
    println!();

    // Run the server
    server.run_on_socket(russh_config, &socket).await?;

    Ok(())
}
