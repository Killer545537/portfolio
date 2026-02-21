//! Email module for sending emails via Resend API
//!
//! Sends portfolio connection emails to users who submit their contact info

use serde::{Deserialize, Serialize};

/// Resend API client
#[derive(Clone)]
pub struct EmailClient {
    api_key: String,
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

/// Resend API response
#[allow(dead_code)]
#[derive(Debug, Deserialize)]
struct SendEmailResponse {
    #[allow(dead_code)]
    id: Option<String>,
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

        Some(Self {
            api_key,
            client: reqwest::Client::new(),
        })
    }

    /// Create a new email client with a specific API key
    #[allow(dead_code)]
    pub fn new(api_key: String) -> Self {
        Self {
            api_key,
            client: reqwest::Client::new(),
        }
    }

    /// Send a portfolio connection email to the user
    pub async fn send_connection_email(&self, name: &str, email: &str) -> anyhow::Result<()> {
        let html = generate_connection_email_html(name);

        let request = SendEmailRequest {
            from: "Srijan Mahajan <onboarding@resend.dev>".to_string(),
            to: email.to_string(),
            subject: "Thanks for connecting!".to_string(),
            html,
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

/// Generate the HTML email content matching the React email template
fn generate_connection_email_html(name: &str) -> String {
    format!(
        r#"<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thanks for connecting!</title>
</head>
<body style="background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; padding: 40px 0;">
    <div style="background-color: #ffffff; border-radius: 12px; padding: 32px; max-width: 600px; margin: 0 auto;">
        <div>
            <p style="font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 24px; margin-top: 0;">
                Hi {name},
            </p>

            <p style="font-size: 16px; color: #374151; margin-bottom: 16px; margin-top: 0; line-height: 1.5;">
                Thanks for reaching out through my portfolio. I appreciate you taking the time to connect.
            </p>

            <p style="font-size: 16px; color: #374151; margin-bottom: 16px; margin-top: 0; line-height: 1.5;">
                I'm Srijan, a full-stack developer who focuses on systems architecture, backend development, and building performance-oriented software. I enjoy tackling complex technical challenges and creating solutions that scale effectively.
            </p>

            <p style="font-size: 16px; color: #374151; margin-bottom: 24px; margin-top: 0; line-height: 1.5;">
                Feel free to reply if you'd like to discuss potential collaboration, interesting projects, or opportunities. I'd be happy to hear what you're working on.
            </p>

            <p style="font-size: 16px; color: #374151; margin-bottom: 0; margin-top: 0; line-height: 1.5;">
                Best regards,<br>
                Srijan Mahajan
            </p>
        </div>

        <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280; margin: 0; text-align: center;">
                This email was sent because you connected through srijanmahajan.me
            </p>
        </div>
    </div>
</body>
</html>"#,
        name = html_escape(name)
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
