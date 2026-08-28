//! Email module for sending emails via Resend API
//!
//! Sends portfolio connection emails to users who submit their contact info.
//! The wording lives in `me.toml` under `[email]`, shared with the web app's
//! React Email template so the two cannot drift apart.

use serde::{Deserialize, Serialize};

use crate::data::{DATA, EmailCopy};

/// Fallback sender. Resend's sandbox domain only delivers to the account
/// owner's own address, so a real deployment must set RESEND_FROM to an
/// address on a verified domain.
const DEFAULT_FROM: &str = "Srijan Mahajan <onboarding@resend.dev>";

/// Resend API client
#[derive(Clone)]
pub struct EmailClient {
    api_key: String,
    from: String,
    client: reqwest::Client,
}

/// Email send request payload
#[derive(Debug, Serialize)]
struct SendEmailRequest {
    from: String,
    to: String,
    subject: String,
    html: String,
}

/// Resend API error response
#[derive(Debug, Deserialize)]
struct ResendError {
    message: String,
}

impl EmailClient {
    /// Create a new email client from RESEND_API_KEY environment variable
    pub fn from_env() -> Option<Self> {
        let api_key = std::env::var("RESEND_API_KEY").ok()?;

        if api_key.is_empty() {
            return None;
        }

        let from = std::env::var("RESEND_FROM")
            .ok()
            .filter(|f| !f.is_empty())
            .unwrap_or_else(|| {
                eprintln!("⚠ RESEND_FROM not set, falling back to the Resend sandbox sender.");
                eprintln!("  Mail to anyone but the account owner will be rejected.");
                DEFAULT_FROM.to_string()
            });

        Some(Self {
            api_key,
            from,
            client: reqwest::Client::new(),
        })
    }

    /// Send a portfolio connection email to the user
    pub async fn send_connection_email(&self, name: &str, email: &str) -> anyhow::Result<()> {
        let data = DATA
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("me.toml unavailable, cannot compose the email"))?;

        let request = SendEmailRequest {
            from: self.from.clone(),
            to: email.to_string(),
            subject: data.email.subject.clone(),
            html: generate_connection_email_html(&data.email, &data.profile.site, name),
        };

        let response = self
            .client
            .post("https://api.resend.com/emails")
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await?;

        if response.status().is_success() {
            Ok(())
        } else {
            let error: ResendError = response.json().await.unwrap_or(ResendError {
                message: "Unknown error".to_string(),
            });
            Err(anyhow::anyhow!("Failed to send email: {}", error.message))
        }
    }
}

/// Body paragraph style, shared by the copy paragraphs and the sign-off.
const P_STYLE: &str =
    "font-size: 16px; color: #374151; margin-bottom: 16px; margin-top: 0; line-height: 1.5;";

/// Render the connection email, mirroring the React template's layout with the
/// same copy. Every interpolated value is escaped: `name` is visitor input.
fn generate_connection_email_html(copy: &EmailCopy, site: &str, name: &str) -> String {
    let greeting = copy.greeting.replace("{name}", &html_escape(name));

    let paragraphs: String = copy
        .paragraphs
        .iter()
        .map(|p| {
            format!(
                "            <p style=\"{P_STYLE}\">\n                {}\n            </p>\n",
                html_escape(p)
            )
        })
        .collect();

    let signoff = copy
        .signoff
        .iter()
        .map(|line| html_escape(line))
        .collect::<Vec<_>>()
        .join("<br>\n                ");

    let footer = html_escape(&copy.footer.replace("{site}", site));
    let subject = html_escape(&copy.subject);

    format!(
        r#"<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{subject}</title>
</head>
<body style="background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; padding: 40px 0;">
    <div style="background-color: #ffffff; border-radius: 12px; padding: 32px; max-width: 600px; margin: 0 auto;">
        <div>
            <p style="font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 24px; margin-top: 0;">
                {greeting}
            </p>

{paragraphs}
            <p style="{P_STYLE}">
                {signoff}
            </p>
        </div>

        <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280; margin: 0; text-align: center;">
                {footer}
            </p>
        </div>
    </div>
</body>
</html>"#
    )
}

/// Escape HTML special characters to prevent XSS
fn html_escape(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#x27;")
}

/// Optional email client wrapper for graceful degradation
#[derive(Clone)]
pub struct OptionalEmailClient {
    client: Option<EmailClient>,
}

impl OptionalEmailClient {
    /// Try to create email client from environment
    pub fn from_env() -> Self {
        match EmailClient::from_env() {
            Some(client) => {
                println!("✓ Email client configured");
                Self {
                    client: Some(client),
                }
            }
            None => {
                println!("⚠ RESEND_API_KEY not set, email features disabled");
                Self { client: None }
            }
        }
    }

    /// Check if email client is available
    pub fn is_available(&self) -> bool {
        self.client.is_some()
    }

    /// Send connection email if client is available
    pub async fn send_connection_email(&self, name: &str, email: &str) -> anyhow::Result<()> {
        match &self.client {
            Some(client) => client.send_connection_email(name, email).await,
            None => Err(anyhow::anyhow!("Email client not configured")),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn render(name: &str) -> String {
        let data = DATA
            .as_ref()
            .expect("me.toml should be loadable from the workspace root");
        generate_connection_email_html(&data.email, "example.test", name)
    }

    #[test]
    fn renders_the_shared_copy_and_site() {
        let html = render("Ada");

        assert!(html.contains("Hi Ada,"), "greeting should interpolate the name");
        assert!(
            html.contains("example.test"),
            "footer should interpolate the site"
        );
        assert!(!html.contains("{name}"), "no placeholder should survive");
        assert!(!html.contains("{site}"), "no placeholder should survive");
    }

    #[test]
    fn escapes_visitor_supplied_names() {
        let html = render("<script>alert(1)</script>");

        assert!(!html.contains("<script>"), "name must not inject markup");
        assert!(html.contains("&lt;script&gt;"));
    }
}
