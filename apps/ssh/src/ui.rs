/// UI module for rendering terminal output and display content

/// Welcome banner displayed to users upon connection
const WELCOME_BANNER: &str = r#"
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║   ☕  Welcome to Srijan Mahajan's Portfolio                      ║
║                                                                  ║
║   Software Engineer | Open Source Enthusiast                     ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
"#;

/// Help text displayed to users
const HELP_TEXT: &str = r#"
Commands:
  q, Q    - Quit and disconnect
  h       - Show this help message
  about   - Learn more about me
  skills  - View my technical skills
  contact - Get my contact information
"#;

/// About section content
const ABOUT_TEXT: &str = r#"
About Me
════════
I'm a passionate software engineer who loves building things
with Rust, TypeScript, and other modern technologies.

This SSH server is built with Rust using the russh library.
"#;

/// Skills section content
const SKILLS_TEXT: &str = r#"
Technical Skills
════════════════
Languages:  Rust, TypeScript, Python, Go
Frontend:   React, Next.js, TailwindCSS
Backend:    Node.js, Actix, Axum
Databases:  PostgreSQL, Redis, MongoDB
DevOps:     Docker, Kubernetes, AWS
"#;

/// Contact section content
const CONTACT_TEXT: &str = r#"
Contact Information
═══════════════════
GitHub:   github.com/srijanmahajan
Email:    hello@srijanmahajan.com
LinkedIn: linkedin.com/in/srijanmahajan
"#;

/// Renders the welcome message for new connections
pub fn render_welcome_message() -> String {
    format!(
        "\r\n{}\r\n{}\r\n",
        WELCOME_BANNER.replace('\n', "\r\n"),
        "Press 'h' for help, 'q' to quit".to_string()
    )
}

/// Renders the help text
pub fn render_help() -> String {
    format!("\r\n{}\r\n", HELP_TEXT.replace('\n', "\r\n"))
}

/// Renders the about section
pub fn render_about() -> String {
    format!("\r\n{}\r\n", ABOUT_TEXT.replace('\n', "\r\n"))
}

/// Renders the skills section
pub fn render_skills() -> String {
    format!("\r\n{}\r\n", SKILLS_TEXT.replace('\n', "\r\n"))
}

/// Renders the contact section
pub fn render_contact() -> String {
    format!("\r\n{}\r\n", CONTACT_TEXT.replace('\n', "\r\n"))
}

/// Renders an unknown command message
pub fn render_unknown_command(input: &str) -> String {
    format!(
        "\r\nUnknown command: '{}'. Press 'h' for help.\r\n",
        input.trim()
    )
}

/// Renders a goodbye message
pub fn render_goodbye() -> String {
    "\r\n👋 Goodbye! Thanks for visiting.\r\n".to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_welcome_message_contains_banner() {
        let welcome = render_welcome_message();
        assert!(welcome.contains("Welcome"));
        assert!(welcome.contains("Portfolio"));
    }

    #[test]
    fn test_help_contains_quit_command() {
        let help = render_help();
        assert!(help.contains("Quit"));
    }

    #[test]
    fn test_messages_use_crlf() {
        let welcome = render_welcome_message();
        // Should contain CRLF for proper terminal display
        assert!(welcome.contains("\r\n"));
    }
}
