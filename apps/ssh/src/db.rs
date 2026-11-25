//! Database module for PostgreSQL access using sqlx
//!
//! Handles analytics events and contact storage

use serde_json::Value as JsonValue;
use sqlx::PgPool;
use sqlx::postgres::PgPoolOptions;
use std::sync::Arc;
use std::sync::atomic::{AtomicUsize, Ordering};
use tokio::sync::Semaphore;

/// Most analytics inserts allowed in flight at once. Past this, events are
/// dropped rather than queued: a client spamming Enter must not be able to
/// grow an unbounded backlog behind the 5-connection pool.
const MAX_INFLIGHT_EVENTS: usize = 64;

/// Database connection pool wrapper
#[derive(Clone)]
pub struct Database {
    pool: PgPool,
    /// Permits for in-flight analytics inserts
    inflight: Arc<Semaphore>,
    /// Events dropped because every permit was taken
    dropped: Arc<AtomicUsize>,
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

        Ok(Self {
            pool,
            inflight: Arc::new(Semaphore::new(MAX_INFLIGHT_EVENTS)),
            dropped: Arc::new(AtomicUsize::new(0)),
        })
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
            INSERT INTO events (source, event_type, session_id, metadata)
            VALUES ($1, $2, $3, $4)
            "#,
        )
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
            INSERT INTO contacts (email)
            VALUES ($1)
            ON CONFLICT (email) DO NOTHING
            "#,
        )
        .bind(email)
        .execute(&self.pool)
        .await?;

        Ok(())
    }
}

/// Longest command string recorded in an event's metadata
const MAX_TRACKED_COMMAND_CHARS: usize = 64;

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

    /// Write an analytics event without making the visitor wait for it.
    ///
    /// These are fire-and-forget by design (a failure is only logged), so the
    /// Postgres round trip runs on its own task instead of in front of the
    /// reply. Events from one session can therefore land a few milliseconds
    /// out of order; `created_at` is stamped by the database on insert.
    ///
    /// At most `MAX_INFLIGHT_EVENTS` run at once; beyond that the event is
    /// dropped, and the drop is logged only at powers of two so a flood of
    /// them can't flood the log too.
    fn spawn_event(&self, event_type: EventType, session_id: &str, metadata: Option<JsonValue>) {
        let Some(db) = self.db.clone() else {
            return;
        };
        let Ok(permit) = Arc::clone(&db.inflight).try_acquire_owned() else {
            let dropped = db.dropped.fetch_add(1, Ordering::Relaxed) + 1;
            if dropped.is_power_of_two() {
                eprintln!("Analytics backlog full, dropped {dropped} events so far");
            }
            return;
        };
        let session_id = session_id.to_owned();
        tokio::spawn(async move {
            // Held until the insert finishes.
            let _permit = permit;
            if let Err(e) = db
                .track_event(event_type, Some(&session_id), metadata)
                .await
            {
                eprintln!("Failed to track {event_type}: {e}");
            }
        });
    }

    /// Track command if database is available
    pub fn track_command(&self, session_id: &str, command: &str) {
        // The line editor already caps input; this bounds what one row stores.
        let command: String = command.chars().take(MAX_TRACKED_COMMAND_CHARS).collect();
        let metadata = serde_json::json!({ "command": command });
        self.spawn_event(EventType::Command, session_id, Some(metadata));
    }

    /// Track connect if database is available
    pub fn track_connect(&self, session_id: &str, client_addr: Option<&str>) {
        let metadata = client_addr.map(|addr| serde_json::json!({ "client_addr": addr }));
        self.spawn_event(EventType::Connect, session_id, metadata);
    }

    /// Track disconnect if database is available
    pub fn track_disconnect(&self, session_id: &str) {
        self.spawn_event(EventType::Disconnect, session_id, None);
    }

    /// Store contact if database is available. Awaited, unlike the analytics
    /// events: its result decides what the visitor is told.
    pub async fn store_contact(&self, email: &str) -> anyhow::Result<()> {
        if let Some(db) = &self.db {
            db.store_contact(email).await?;
        }
        Ok(())
    }

    /// Track a contact submission if database is available. The address itself
    /// lives in `contacts`; the event only records that one happened.
    pub fn track_contact(&self, session_id: &str) {
        self.spawn_event(EventType::Contact, session_id, None);
    }
}
