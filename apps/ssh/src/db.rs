//! Database module for PostgreSQL access using sqlx
//!
//! Handles analytics events and contact storage

use serde_json::Value as JsonValue;
use sqlx::PgPool;
use sqlx::postgres::PgPoolOptions;
use uuid::Uuid;

/// Database connection pool wrapper
#[derive(Clone)]
pub struct Database {
    pool: PgPool,
}

/// Event types for analytics. `Display` is the wire format written to
/// `events.event_type`, matching the web app's event names.
#[derive(Debug, Clone, Copy)]
pub enum EventType {
    Connect,
    Disconnect,
    Command,
    Contact,
}

impl std::fmt::Display for EventType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            EventType::Connect => write!(f, "connect"),
            EventType::Disconnect => write!(f, "disconnect"),
            EventType::Command => write!(f, "command"),
            EventType::Contact => write!(f, "contact"),
        }
    }
}

impl Database {
    /// Create a new database connection pool from DATABASE_URL
    pub async fn connect() -> anyhow::Result<Self> {
        let database_url = std::env::var("DATABASE_URL")
            .map_err(|_| anyhow::anyhow!("DATABASE_URL environment variable not set"))?;

        let pool = PgPoolOptions::new()
            .max_connections(5)
            .connect(&database_url)
            .await?;

        Ok(Self { pool })
    }

    /// Track an analytics event
    pub async fn track_event(
        &self,
        event_type: EventType,
        session_id: Option<&str>,
        metadata: Option<JsonValue>,
    ) -> anyhow::Result<()> {
        sqlx::query(
            r#"
            INSERT INTO events (id, source, event_type, session_id, metadata)
            VALUES ($1, $2, $3, $4, $5)
            "#,
        )
        .bind(Uuid::new_v4())
        .bind("ssh")
        .bind(event_type.to_string())
        .bind(session_id)
        .bind(&metadata)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Store a contact email. Re-submitting an existing address is a no-op,
    /// matching `submitContact` on the web side.
    pub async fn store_contact(&self, email: &str) -> anyhow::Result<()> {
        sqlx::query(
            r#"
            INSERT INTO contacts (id, email)
            VALUES ($1, $2)
            ON CONFLICT (email) DO NOTHING
            "#,
        )
        .bind(Uuid::new_v4())
        .bind(email)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Track a command execution
    pub async fn track_command(&self, session_id: &str, command: &str) -> anyhow::Result<()> {
        let metadata = serde_json::json!({ "command": command });
        self.track_event(EventType::Command, Some(session_id), Some(metadata))
            .await
    }

    /// Track a connection event
    pub async fn track_connect(
        &self,
        session_id: &str,
        client_addr: Option<&str>,
    ) -> anyhow::Result<()> {
        let metadata = client_addr.map(|addr| serde_json::json!({ "client_addr": addr }));
        self.track_event(EventType::Connect, Some(session_id), metadata)
            .await
    }

    /// Track a disconnection event
    pub async fn track_disconnect(&self, session_id: &str) -> anyhow::Result<()> {
        self.track_event(EventType::Disconnect, Some(session_id), None)
            .await
    }

    /// Track a contact submission. The address itself lives in `contacts`; the
    /// event only records that one happened.
    pub async fn track_contact(&self, session_id: &str) -> anyhow::Result<()> {
        self.track_event(EventType::Contact, Some(session_id), None)
            .await
    }
}

/// Optional database wrapper for graceful degradation
/// When database is not available, operations silently fail
#[derive(Clone)]
pub struct OptionalDatabase {
    db: Option<Database>,
}

impl OptionalDatabase {
    /// Try to connect to database, return None if fails
    pub async fn try_connect() -> Self {
        match Database::connect().await {
            Ok(db) => {
                println!("✓ Connected to database");
                Self { db: Some(db) }
            }
            Err(e) => {
                println!("⚠ Database not available: {e}");
                println!("  Analytics and contact features will be disabled");
                Self { db: None }
            }
        }
    }

    /// Track command if database is available
    pub async fn track_command(&self, session_id: &str, command: &str) {
        if let Some(db) = &self.db
            && let Err(e) = db.track_command(session_id, command).await
        {
            eprintln!("Failed to track command: {e}");
        }
    }

    /// Track connect if database is available
    pub async fn track_connect(&self, session_id: &str, client_addr: Option<&str>) {
        if let Some(db) = &self.db
            && let Err(e) = db.track_connect(session_id, client_addr).await
        {
            eprintln!("Failed to track connect: {e}");
        }
    }

    /// Track disconnect if database is available
    pub async fn track_disconnect(&self, session_id: &str) {
        if let Some(db) = &self.db
            && let Err(e) = db.track_disconnect(session_id).await
        {
            eprintln!("Failed to track disconnect: {e}");
        }
    }

    /// Store contact if database is available
    pub async fn store_contact(&self, email: &str) -> anyhow::Result<()> {
        if let Some(db) = &self.db {
            db.store_contact(email).await?;
        }
        Ok(())
    }

    /// Track contact event if database is available
    pub async fn track_contact(&self, session_id: &str) {
        if let Some(db) = &self.db
            && let Err(e) = db.track_contact(session_id).await
        {
            eprintln!("Failed to track contact: {e}");
        }
    }
}
