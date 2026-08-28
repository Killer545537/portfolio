use anyhow::{Context, Result};
use russh::keys::ssh_key::LineEnding;
use russh::keys::{Algorithm, PrivateKey};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::Duration;

/// Default SSH server port
pub const DEFAULT_PORT: u16 = 2222;

/// Default bind address
pub const DEFAULT_BIND_ADDR: &str = "0.0.0.0";

/// Default host key location, relative to the working directory
pub const DEFAULT_HOST_KEY_FILE: &str = "ssh_host_key";

/// Server configuration options
#[derive(Debug, Clone)]
pub struct ServerConfig {
    pub bind_addr: String,
    pub port: u16,
    pub host_key_file: PathBuf,
    pub inactivity_timeout_secs: u64,
    pub auth_rejection_time_secs: u64,
}

impl Default for ServerConfig {
    fn default() -> Self {
        Self {
            bind_addr: DEFAULT_BIND_ADDR.to_string(),
            port: DEFAULT_PORT,
            host_key_file: PathBuf::from(DEFAULT_HOST_KEY_FILE),
            inactivity_timeout_secs: 3600,
            auth_rejection_time_secs: 3,
        }
    }
}

impl ServerConfig {
    /// Build the configuration, letting the environment override the defaults.
    pub fn from_env() -> Self {
        let defaults = Self::default();

        let port = match std::env::var("SSH_PORT") {
            Ok(raw) => raw.parse().unwrap_or_else(|_| {
                eprintln!("⚠ SSH_PORT='{raw}' is not a valid port, using {DEFAULT_PORT}");
                defaults.port
            }),
            Err(_) => defaults.port,
        };

        Self {
            bind_addr: std::env::var("SSH_BIND_ADDR").unwrap_or(defaults.bind_addr),
            port,
            host_key_file: std::env::var("SSH_HOST_KEY_FILE")
                .map(PathBuf::from)
                .unwrap_or(defaults.host_key_file),
            ..defaults
        }
    }

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
            keys: vec![load_or_create_host_key(&self.host_key_file)],
            ..Default::default()
        };

        Ok(Arc::new(config))
    }
}

/// Load the persistent host key, creating it on first run.
///
/// A fresh key on every boot makes every returning visitor see
/// "REMOTE HOST IDENTIFICATION HAS CHANGED", which trains them to ignore the
/// one warning that matters. If the path is unreadable or unwritable we still
/// start — an ephemeral key beats refusing connections — but we say so loudly.
fn load_or_create_host_key(path: &Path) -> PrivateKey {
    match read_host_key(path) {
        Ok(Some(key)) => {
            println!("✓ Loaded SSH host key from {}", path.display());
            return key;
        }
        Ok(None) => {}
        Err(e) => eprintln!("⚠ Could not read host key at {}: {e}", path.display()),
    }

    let key = generate_host_key();

    match write_host_key(path, &key) {
        Ok(()) => println!("✓ Generated new SSH host key at {}", path.display()),
        Err(e) => {
            eprintln!("⚠ Could not persist host key to {}: {e}", path.display());
            eprintln!("  Using an ephemeral key: returning clients will see a host-key");
            eprintln!("  change warning after every restart. Set SSH_HOST_KEY_FILE to a");
            eprintln!("  writable path on a persistent volume to fix this.");
        }
    }

    key
}

fn read_host_key(path: &Path) -> Result<Option<PrivateKey>> {
    if !path.exists() {
        return Ok(None);
    }

    let pem = std::fs::read_to_string(path).context("reading host key file")?;
    let key = PrivateKey::from_openssh(&pem).context("parsing host key")?;
    Ok(Some(key))
}

fn write_host_key(path: &Path, key: &PrivateKey) -> Result<()> {
    if let Some(parent) = path.parent().filter(|p| !p.as_os_str().is_empty()) {
        std::fs::create_dir_all(parent).context("creating host key directory")?;
    }

    let pem = key.to_openssh(LineEnding::LF).context("encoding host key")?;
    std::fs::write(path, pem.as_bytes()).context("writing host key file")?;

    // A host private key readable by anyone else on the box is not a host key.
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(path, std::fs::Permissions::from_mode(0o600))
            .context("restricting host key permissions")?;
    }

    Ok(())
}

fn generate_host_key() -> PrivateKey {
    // Ed25519 generation from a CSPRNG does not fail in practice; if it ever
    // did there would be nothing sensible to fall back to.
    PrivateKey::random(&mut rand::rng(), Algorithm::Ed25519)
        .expect("generating an Ed25519 host key")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn host_key_is_stable_across_restarts() {
        let dir = std::env::temp_dir().join(format!("ssh-key-test-{}", std::process::id()));
        let path = dir.join("ssh_host_key");

        let first = load_or_create_host_key(&path);
        let second = load_or_create_host_key(&path);

        assert_eq!(
            first.public_key(),
            second.public_key(),
            "a restart must reuse the persisted host key"
        );

        std::fs::remove_dir_all(&dir).ok();
    }
}
