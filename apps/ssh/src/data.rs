//! Data module for loading and parsing me.toml configuration

use serde::Deserialize;
use std::path::Path;

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
}

#[derive(Debug, Deserialize)]
pub struct Profile {
    pub name: String,
    pub phonetic: Option<String>,
    pub title: String,
    pub location: String,
    #[allow(dead_code)]
    pub avatar: Option<String>,
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
