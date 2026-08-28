//! Data module for loading and parsing me.toml configuration
//!
//! This mirrors `apps/web/src/lib/types.ts`. Optionality on both sides must
//! match, or one app will refuse data the other happily renders.

use serde::Deserialize;
use std::path::Path;
use std::sync::LazyLock;

/// Root configuration structure matching me.toml
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppData {
    pub profile: Profile,
    pub education: Vec<Education>,
    pub achievements: Vec<Achievement>,
    pub experience: Vec<Experience>,
    pub projects: Vec<Project>,
    pub tech_stack: TechStack,
    pub languages_spoken: Vec<LanguageSpoken>,
    pub interests: Interests,
    pub email: EmailCopy,
}

#[derive(Debug, Deserialize)]
pub struct Profile {
    pub name: String,
    pub phonetic: Option<String>,
    pub title: String,
    pub location: String,
    #[allow(dead_code)]
    pub avatar: Option<String>,
    /// Bare host, e.g. "srijanmahajan.me". Single source for every place the
    /// site is referenced by name.
    pub site: String,
    pub contact: Contact,
    pub bio: Bio,
}

#[derive(Debug, Deserialize)]
pub struct Contact {
    pub phone: Option<String>,
    pub email: String,
    pub linkedin: Option<String>,
    pub github: Option<String>,
    pub twitter: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct Bio {
    pub lines: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct Education {
    pub institution: String,
    pub degree: String,
    pub period: String,
    pub location: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct Achievement {
    pub title: String,
    pub detail: String,
}

#[derive(Debug, Deserialize)]
pub struct Experience {
    pub role: String,
    pub organization: String,
    pub location: Option<String>,
    pub period: String,
    pub link: Option<String>,
    pub description: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct Project {
    pub title: String,
    pub category: Option<String>,
    #[serde(default)]
    pub tech: Vec<String>,
    pub link: Option<String>,
    pub highlights: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TechStack {
    pub languages: Vec<TechItem>,
    pub backend: Vec<TechItem>,
    pub databases: Vec<TechItem>,
    pub cloud_dev_ops: Vec<TechItem>,
    pub frontend: Vec<TechItem>,
}

#[derive(Debug, Deserialize)]
pub struct TechItem {
    pub name: String,
    #[allow(dead_code)]
    pub icon: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct LanguageSpoken {
    pub language: String,
    pub proficiency: String,
}

#[derive(Debug, Deserialize)]
pub struct Interests {
    pub list: Vec<String>,
}

/// Copy for the connection email, shared with the web app's React template.
/// `greeting` contains a `{name}` placeholder, `footer` a `{site}` one.
#[derive(Debug, Deserialize)]
pub struct EmailCopy {
    pub subject: String,
    pub greeting: String,
    pub paragraphs: Vec<String>,
    pub signoff: Vec<String>,
    pub footer: String,
}

/// Parsed `me.toml`, loaded once on first use.
///
/// Every render path used to re-read and re-parse the file from disk on each
/// command; this reads it once for the life of the process.
pub static DATA: LazyLock<Option<AppData>> = LazyLock::new(|| match AppData::load_default() {
    Ok(data) => Some(data),
    Err(e) => {
        eprintln!("⚠ Could not load me.toml: {e}");
        eprintln!("  Portfolio content and connection emails will be unavailable.");
        None
    }
});

impl AppData {
    /// Load configuration from a TOML file
    pub fn load<P: AsRef<Path>>(path: P) -> anyhow::Result<Self> {
        let content = std::fs::read_to_string(path)?;
        let data: AppData = toml::from_str(&content)?;
        Ok(data)
    }

    /// Load from the default me.toml location
    /// Tries multiple paths to find the file
    pub fn load_default() -> anyhow::Result<Self> {
        let paths = [
            "me.toml",
            "/app/me.toml",
            "../../../me.toml",
            "../../me.toml",
        ];

        for path in paths {
            if Path::new(path).exists() {
                return Self::load(path);
            }
        }

        anyhow::bail!("Could not find me.toml in any of the expected locations")
    }
}
