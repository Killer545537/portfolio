//! Database module for PostgreSQL access using sqlx
//!
//! Handles analytics events and contact storage

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use sqlx::postgres::PgPoolOptions;
use sqlx::{FromRow, PgPool, Row};
use uuid::Uuid;

/// Database connection pool wrapper
#[derive(Clone)]
pub struct Database {
    pool: PgPool,
}

/// Event types for analytics
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
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

/// Analytics event record
#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Event {
    pub id: Uuid,
    pub source: String,
    pub event_type: String,
    pub session_id: Option<String>,
    pub metadata: Option<JsonValue>,
    pub created_at: DateTime<Utc>,
}

/// Contact record
#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Contact {
    pub id: Uuid,
    pub email: String,
    pub created_at: DateTime<Utc>,
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

    /// Create a new database connection pool from a specific URL
    #[allow(dead_code)]
    pub async fn connect_with_url(database_url: &str) -> anyhow::Result<Self> {
        let pool = PgPoolOptions::new()
            .max_connections(5)
            .connect(database_url)
            .await?;

        Ok(Self { pool })
    }

    /// Track an analytics event
    pub async fn track_event(
        &self,
        event_type: EventType,
        session_id: Option<&str>,
        metadata: Option<JsonValue>,
    ) -> anyhow::Result<Uuid> {
        let id = Uuid::new_v4();
        let source = "ssh";
        let event_type_str = event_type.to_string();

        sqlx::query(
            r#"
            INSERT INTO events (id, source, event_type, session_id, metadata)
            VALUES ($1, $2, $3, $4, $5)
            "#,
        )
        .bind(id)
        .bind(source)
        .bind(&event_type_str)
        .bind(session_id)
        .bind(&metadata)
        .execute(&self.pool)
        .await?;

        Ok(id)
    }

    /// Store a contact email (upsert - ignore if already exists)
    pub async fn store_contact(&self, email: &str) -> anyhow::Result<Uuid> {
        let id = Uuid::new_v4();

        // Use ON CONFLICT DO NOTHING, then try to get the id
        let result = sqlx::query(
            r#"
            INSERT INTO contacts (id, email)
            VALUES ($1, $2)
            ON CONFLICT (email) DO NOTHING
            RETURNING id
            "#,
        )
        .bind(id)
        .bind(email)
        .fetch_optional(&self.pool)
        .await?;

        // If insert succeeded, return new id; otherwise fetch existing
        match result {
            Some(row) => {
                let inserted_id: Uuid = row.get("id");
                Ok(inserted_id)
            }
            None => {
                // Email already exists, fetch existing id
                let row = sqlx::query(r#"SELECT id FROM contacts WHERE email = $1"#)
                    .bind(email)
                    .fetch_one(&self.pool)
                    .await?;
                let existing_id: Uuid = row.get("id");
                Ok(existing_id)
            }
        }
    }

    /// Track a command execution
    pub async fn track_command(&self, session_id: &str, command: &str) -> anyhow::Result<()> {
        let metadata = serde_json::json!({
            "command": command
        });

        self.track_event(EventType::Command, Some(session_id), Some(metadata))
            .await?;

        Ok(())
    }

    /// Track a connection event
    pub async fn track_connect(
        &self,
        session_id: &str,
        client_addr: Option<&str>,
    ) -> anyhow::Result<()> {
        let metadata = client_addr.map(|addr| {
            serde_json::json!({
                "client_addr": addr
            })
        });

        self.track_event(EventType::Connect, Some(session_id), metadata)
            .await?;

        Ok(())
    }

    /// Track a disconnection event
    pub async fn track_disconnect(&self, session_id: &str) -> anyhow::Result<()> {
        self.track_event(EventType::Disconnect, Some(session_id), None)
            .await?;

        Ok(())
    }

    /// Track a contact submission
    pub async fn track_contact(&self, session_id: &str, email: &str) -> anyhow::Result<()> {
        let metadata = serde_json::json!({
            "email": email
        });

        self.track_event(EventType::Contact, Some(session_id), Some(metadata))
            .await?;

        Ok(())
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

    /// Check if database is available
    #[allow(dead_code)]
    pub fn is_available(&self) -> bool {
        self.db.is_some()
    }

    /// Get the inner database if available
    #[allow(dead_code)]
    pub fn inner(&self) -> Option<&Database> {
        self.db.as_ref()
    }

    /// Track event if database is available
    #[allow(dead_code)]
    pub async fn track_event(
        &self,
        event_type: EventType,
        session_id: Option<&str>,
        metadata: Option<JsonValue>,
    ) {
        if let Some(db) = &self.db {
            if let Err(e) = db.track_event(event_type, session_id, metadata).await {
                eprintln!("Failed to track event: {e}");
            }
        }
    }

    /// Track command if database is available
    pub async fn track_command(&self, session_id: &str, command: &str) {
        if let Some(db) = &self.db {
            if let Err(e) = db.track_command(session_id, command).await {
                eprintln!("Failed to track command: {e}");
            }
        }
    }

    /// Track connect if database is available
    pub async fn track_connect(&self, session_id: &str, client_addr: Option<&str>) {
        if let Some(db) = &self.db {
            if let Err(e) = db.track_connect(session_id, client_addr).await {
                eprintln!("Failed to track connect: {e}");
            }
        }
    }

    /// Track disconnect if database is available
    pub async fn track_disconnect(&self, session_id: &str) {
        if let Some(db) = &self.db {
            if let Err(e) = db.track_disconnect(session_id).await {
                eprintln!("Failed to track disconnect: {e}");
            }
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
    pub async fn track_contact(&self, session_id: &str, email: &str) {
        if let Some(db) = &self.db {
            if let Err(e) = db.track_contact(session_id, email).await {
                eprintln!("Failed to track contact: {e}");
            }
        }
    }
}
