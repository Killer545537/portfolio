//! UI module for rendering terminal output with colors and styling
//!
//! Uses ANSI escape codes for terminal colors and formatting

use crate::data::AppData;

// ═══════════════════════════════════════════════════════════════════════════════
// ANSI Color Codes
// ═══════════════════════════════════════════════════════════════════════════════

mod colors {
    // Reset
    pub const RESET: &str = "\x1b[0m";

    // Styles
    pub const BOLD: &str = "\x1b[1m";
    pub const DIM: &str = "\x1b[2m";
    pub const ITALIC: &str = "\x1b[3m";

    // Foreground colors
    pub const CYAN: &str = "\x1b[36m";
    pub const GREEN: &str = "\x1b[32m";
    pub const YELLOW: &str = "\x1b[33m";
    pub const BLUE: &str = "\x1b[34m";
    pub const MAGENTA: &str = "\x1b[35m";
    pub const WHITE: &str = "\x1b[37m";
    pub const RED: &str = "\x1b[31m";

    // Bright variants
    pub const BRIGHT_CYAN: &str = "\x1b[96m";
    pub const BRIGHT_GREEN: &str = "\x1b[92m";
    pub const BRIGHT_YELLOW: &str = "\x1b[93m";
    pub const BRIGHT_BLUE: &str = "\x1b[94m";
    pub const BRIGHT_MAGENTA: &str = "\x1b[95m";
    pub const BRIGHT_WHITE: &str = "\x1b[97m";
}

use colors::*;

// ═══════════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════════

/// Convert newlines to CRLF for proper terminal display
fn crlf(s: &str) -> String {
    s.replace('\n', "\r\n")
}

/// Create a colored section header
fn section_header(title: &str, emoji: &str) -> String {
    let separator = "═".repeat(60);
    format!("\r\n{BOLD}{BRIGHT_CYAN}{emoji}  {title}{RESET}\r\n{DIM}{CYAN}{separator}{RESET}\r\n")
}

/// Create a subsection title
fn subsection(title: &str) -> String {
    format!("{BOLD}{YELLOW}{title}{RESET}")
}

/// Create a label-value pair
fn label_value(label: &str, value: &str) -> String {
    format!("  {DIM}{WHITE}{label}:{RESET} {BRIGHT_WHITE}{value}{RESET}")
}

/// Create a bullet point
fn bullet(text: &str) -> String {
    format!("  {CYAN}•{RESET} {WHITE}{text}{RESET}")
}

/// Create a tech tag
fn tech_tag(name: &str) -> String {
    format!("{DIM}[{RESET}{BRIGHT_MAGENTA}{name}{RESET}{DIM}]{RESET}")
}

// ═══════════════════════════════════════════════════════════════════════════════
// Static Content (Fallback)
// ═══════════════════════════════════════════════════════════════════════════════

/// Load app data with fallback
fn load_data() -> Option<AppData> {
    AppData::load_default().ok()
}

// ═══════════════════════════════════════════════════════════════════════════════
// Render Functions
// ═══════════════════════════════════════════════════════════════════════════════

/// Renders the welcome banner
pub fn render_welcome_message() -> String {
    let data = load_data();

    let (name, title, location) = match &data {
        Some(d) => (
            d.profile.name.as_str(),
            d.profile.title.as_str(),
            d.profile.location.as_str(),
        ),
        None => ("Srijan Mahajan", "Full-Stack Developer", "India"),
    };

    let banner = format!(
        r#"
{BOLD}{BRIGHT_CYAN}
  ╔══════════════════════════════════════════════════════════════════╗
  ║                                                                  ║
  ║   {BRIGHT_GREEN}☕  Welcome to {name}'s Portfolio{BRIGHT_CYAN}
  ║                                                                  ║
  ║   {BRIGHT_YELLOW}{title}{BRIGHT_CYAN}
  ║   {DIM}{WHITE}📍 {location}{BRIGHT_CYAN}
  ║                                                                  ║
  ╚══════════════════════════════════════════════════════════════════╝
{RESET}
  {DIM}Type {RESET}{BOLD}{GREEN}help{RESET}{DIM} to see available commands, {RESET}{BOLD}{RED}q{RESET}{DIM} to quit{RESET}
"#
    );

    crlf(&banner)
}

/// Renders the help menu
pub fn render_help() -> String {
    let help = format!(
        r#"
{BOLD}{BRIGHT_CYAN}📚  Available Commands{RESET}
{DIM}{CYAN}════════════════════════════════════════════════════════════{RESET}

  {BOLD}{GREEN}about{RESET}       {DIM}→{RESET}  Learn about me and my background
  {BOLD}{GREEN}skills{RESET}      {DIM}→{RESET}  View my technical skills & tech stack
  {BOLD}{GREEN}experience{RESET}  {DIM}→{RESET}  See my work experience
  {BOLD}{GREEN}projects{RESET}    {DIM}→{RESET}  Browse my projects & open source work
  {BOLD}{GREEN}education{RESET}   {DIM}→{RESET}  View my educational background
  {BOLD}{GREEN}contact{RESET}     {DIM}→{RESET}  Get my contact information
  {BOLD}{MAGENTA}connect{RESET}     {DIM}→{RESET}  Send me a message (I'll email you back!)

  {BOLD}{YELLOW}help{RESET}, {BOLD}{YELLOW}h{RESET}     {DIM}→{RESET}  Show this help message
  {BOLD}{RED}quit{RESET}, {BOLD}{RED}q{RESET}     {DIM}→{RESET}  Exit the session

{DIM}Tip: You can also use Ctrl+D to exit, Ctrl+C to cancel input{RESET}
"#
    );

    crlf(&help)
}

/// Renders the about section
pub fn render_about() -> String {
    let data = load_data();

    let mut output = section_header("About Me", "👤");

    match data {
        Some(d) => {
            // Name and title
            output.push_str(&format!(
                "\r\n  {BOLD}{BRIGHT_WHITE}{}{RESET}",
                d.profile.name
            ));
            if let Some(phonetic) = &d.profile.phonetic {
                output.push_str(&format!("  {DIM}{phonetic}{RESET}"));
            }
            output.push_str(&format!(
                "\r\n  {BRIGHT_YELLOW}{}{RESET}\r\n",
                d.profile.title
            ));
            output.push_str(&format!("  {DIM}📍 {}{RESET}\r\n", d.profile.location));

            // Bio
            output.push_str("\r\n");
            for line in &d.profile.bio.lines {
                output.push_str(&format!("  {WHITE}{line}{RESET}\r\n"));
            }

            // Interests
            if !d.interests.list.is_empty() {
                output.push_str(&format!("\r\n  {BOLD}{CYAN}Interests:{RESET} "));
                let interests: Vec<String> = d
                    .interests
                    .list
                    .iter()
                    .map(|i| format!("{MAGENTA}{i}{RESET}"))
                    .collect();
                output.push_str(&interests.join(&format!("{DIM} • {RESET}")));
                output.push_str("\r\n");
            }

            // Languages spoken
            if !d.languages_spoken.is_empty() {
                output.push_str(&format!("\r\n  {BOLD}{CYAN}Languages:{RESET} "));
                let langs: Vec<String> = d
                    .languages_spoken
                    .iter()
                    .map(|l| {
                        format!(
                            "{GREEN}{}{RESET} {DIM}({}){RESET}",
                            l.language, l.proficiency
                        )
                    })
                    .collect();
                output.push_str(&langs.join(", "));
                output.push_str("\r\n");
            }

            // Achievements
            if !d.achievements.is_empty() {
                output.push_str(&format!(
                    "\r\n  {BOLD}{BRIGHT_YELLOW}🏆 Achievements:{RESET}\r\n"
                ));
                for achievement in &d.achievements {
                    output.push_str(&format!(
                        "    {YELLOW}▸{RESET} {BOLD}{WHITE}{}{RESET}: {DIM}{}{RESET}\r\n",
                        achievement.title, achievement.detail
                    ));
                }
            }
        }
        None => {
            output.push_str(&format!(
                "\r\n  {DIM}Unable to load profile data.{RESET}\r\n"
            ));
        }
    }

    output.push_str("\r\n");
    output
}

/// Renders the skills/tech stack section
pub fn render_skills() -> String {
    let data = load_data();

    let mut output = section_header("Technical Skills", "🛠");

    match data {
        Some(d) => {
            let stack = &d.tech_stack;

            // Languages
            output.push_str(&format!("\r\n  {}\r\n", subsection("💻 Languages")));
            let langs: Vec<String> = stack.languages.iter().map(|t| tech_tag(&t.name)).collect();
            output.push_str(&format!("    {}\r\n", langs.join(" ")));

            // Backend
            output.push_str(&format!("\r\n  {}\r\n", subsection("⚙️  Backend")));
            let backend: Vec<String> = stack.backend.iter().map(|t| tech_tag(&t.name)).collect();
            output.push_str(&format!("    {}\r\n", backend.join(" ")));

            // Frontend
            output.push_str(&format!("\r\n  {}\r\n", subsection("🎨 Frontend")));
            let frontend: Vec<String> = stack.frontend.iter().map(|t| tech_tag(&t.name)).collect();
            output.push_str(&format!("    {}\r\n", frontend.join(" ")));

            // Databases
            output.push_str(&format!("\r\n  {}\r\n", subsection("🗄️  Databases")));
            let dbs: Vec<String> = stack.databases.iter().map(|t| tech_tag(&t.name)).collect();
            output.push_str(&format!("    {}\r\n", dbs.join(" ")));

            // Cloud & DevOps
            output.push_str(&format!("\r\n  {}\r\n", subsection("☁️  Cloud & DevOps")));
            let cloud: Vec<String> = stack
                .cloud_dev_ops
                .iter()
                .map(|t| tech_tag(&t.name))
                .collect();
            output.push_str(&format!("    {}\r\n", cloud.join(" ")));
        }
        None => {
            output.push_str(&format!(
                "\r\n  {DIM}Unable to load skills data.{RESET}\r\n"
            ));
        }
    }

    output.push_str("\r\n");
    output
}

/// Renders the experience section
pub fn render_experience() -> String {
    let data = load_data();

    let mut output = section_header("Experience", "💼");

    match data {
        Some(d) => {
            for (i, exp) in d.experience.iter().enumerate() {
                let separator = "─".repeat(50);
                if i > 0 {
                    output.push_str(&format!("\r\n  {DIM}{separator}{RESET}\r\n"));
                }

                // Role and organization
                output.push_str(&format!(
                    "\r\n  {BOLD}{BRIGHT_GREEN}{}{RESET}\r\n",
                    exp.role
                ));
                output.push_str(&format!("  {CYAN}{}{RESET}", exp.organization));
                if let Some(loc) = &exp.location {
                    output.push_str(&format!(" {DIM}• {loc}{RESET}"));
                }
                output.push_str("\r\n");
                output.push_str(&format!("  {DIM}📅 {}{RESET}\r\n", exp.period));

                // Link
                if let Some(link) = &exp.link {
                    output.push_str(&format!("  {DIM}🔗 {BLUE}{link}{RESET}\r\n"));
                }

                // Description
                if !exp.description.is_empty() {
                    output.push_str("\r\n");
                    for desc in &exp.description {
                        output.push_str(&format!("{}\r\n", bullet(desc)));
                    }
                }
            }
        }
        None => {
            output.push_str(&format!(
                "\r\n  {DIM}Unable to load experience data.{RESET}\r\n"
            ));
        }
    }

    output.push_str("\r\n");
    output
}

/// Renders the projects section
pub fn render_projects() -> String {
    let data = load_data();

    let mut output = section_header("Projects", "🚀");

    match data {
        Some(d) => {
            for (i, project) in d.projects.iter().enumerate() {
                let separator = "─".repeat(50);
                if i > 0 {
                    output.push_str(&format!("\r\n  {DIM}{separator}{RESET}\r\n"));
                }

                // Title
                output.push_str(&format!(
                    "\r\n  {BOLD}{BRIGHT_YELLOW}{}{RESET}",
                    project.title
                ));

                // Category
                if let Some(cat) = &project.category {
                    output.push_str(&format!("  {DIM}({cat}){RESET}"));
                }
                output.push_str("\r\n");

                // Tech stack
                if !project.tech.is_empty() {
                    let tech: Vec<String> = project.tech.iter().map(|t| tech_tag(t)).collect();
                    output.push_str(&format!("  {}\r\n", tech.join(" ")));
                }

                // Link
                if let Some(link) = &project.link {
                    output.push_str(&format!("  {DIM}🔗 {BLUE}{link}{RESET}\r\n"));
                }

                // Highlights
                if !project.highlights.is_empty() {
                    output.push_str("\r\n");
                    for highlight in &project.highlights {
                        output.push_str(&format!("{}\r\n", bullet(highlight)));
                    }
                }
            }
        }
        None => {
            output.push_str(&format!(
                "\r\n  {DIM}Unable to load projects data.{RESET}\r\n"
            ));
        }
    }

    output.push_str("\r\n");
    output
}

/// Renders the education section
pub fn render_education() -> String {
    let data = load_data();

    let mut output = section_header("Education", "🎓");

    match data {
        Some(d) => {
            for edu in &d.education {
                output.push_str(&format!(
                    "\r\n  {BOLD}{BRIGHT_BLUE}{}{RESET}\r\n",
                    edu.institution
                ));
                output.push_str(&format!("  {WHITE}{}{RESET}", edu.degree));
                if let Some(loc) = &edu.location {
                    output.push_str(&format!(" {DIM}• {loc}{RESET}"));
                }
                output.push_str("\r\n");
                output.push_str(&format!("  {DIM}📅 {}{RESET}\r\n", edu.period));
            }
        }
        None => {
            output.push_str(&format!(
                "\r\n  {DIM}Unable to load education data.{RESET}\r\n"
            ));
        }
    }

    output.push_str("\r\n");
    output
}

/// Renders the contact section
pub fn render_contact() -> String {
    let data = load_data();

    let mut output = section_header("Contact", "📬");

    match data {
        Some(d) => {
            let contact = &d.profile.contact;

            output.push_str("\r\n");
            output.push_str(&format!("{}\r\n", label_value("📧 Email", &contact.email)));

            if let Some(phone) = &contact.phone {
                output.push_str(&format!("{}\r\n", label_value("📱 Phone", phone)));
            }

            if let Some(github) = &contact.github {
                output.push_str(&format!("{}\r\n", label_value("🐙 GitHub", github)));
            }

            if let Some(linkedin) = &contact.linkedin {
                output.push_str(&format!("{}\r\n", label_value("💼 LinkedIn", linkedin)));
            }

            if let Some(twitter) = &contact.twitter {
                output.push_str(&format!("{}\r\n", label_value("🐦 Twitter", twitter)));
            }

            output.push_str(&format!(
                "\r\n  {DIM}{ITALIC}Feel free to reach out!{RESET}\r\n"
            ));
        }
        None => {
            output.push_str(&format!(
                "\r\n  {DIM}Unable to load contact data.{RESET}\r\n"
            ));
        }
    }

    output.push_str("\r\n");
    output
}

/// Renders an unknown command message
pub fn render_unknown_command(input: &str) -> String {
    format!(
        "\r\n{RED}✗{RESET} Unknown command: {BOLD}'{input}'{RESET}\r\n  {DIM}Type {RESET}{GREEN}help{RESET}{DIM} to see available commands.{RESET}\r\n"
    )
}

/// Renders a goodbye message
pub fn render_goodbye() -> String {
    format!("\r\n{BRIGHT_CYAN}👋 Thanks for visiting! See you soon.{RESET}\r\n\r\n")
}

// ═══════════════════════════════════════════════════════════════════════════════
// Connect Form UI
// ═══════════════════════════════════════════════════════════════════════════════

/// Renders the connect form prompt
pub fn render_connect_prompt() -> String {
    let prompt = format!(
        r#"
{BOLD}{BRIGHT_MAGENTA}📨  Let's Connect!{RESET}
{DIM}{MAGENTA}════════════════════════════════════════════════════════════{RESET}

  {WHITE}I'd love to hear from you! Enter your details below and
  I'll send you an email to start the conversation.{RESET}

  {DIM}(Press Ctrl+C to cancel){RESET}

"#
    );
    crlf(&prompt)
}

/// Renders a connect form error message
pub fn render_connect_error(message: &str) -> String {
    format!("\r\n  {RED}✗ {message}{RESET}\r\n")
}

/// Renders the processing message
pub fn render_connect_processing() -> String {
    format!("\r\n  {DIM}Sending...{RESET}")
}

/// Renders the success message
pub fn render_connect_success(name: &str) -> String {
    format!(
        r#"

  {BRIGHT_GREEN}✓ Thanks, {name}!{RESET}

  {WHITE}I've sent you an email. Looking forward to connecting!{RESET}
  {DIM}Check your inbox (and spam folder, just in case).{RESET}
"#
    )
}

/// Renders the cancelled message
pub fn render_connect_cancelled() -> String {
    format!("\r\n  {YELLOW}Cancelled.{RESET}")
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
    fn test_help_contains_commands() {
        let help = render_help();
        assert!(help.contains("about"));
        assert!(help.contains("skills"));
        assert!(help.contains("contact"));
        assert!(help.contains("quit"));
    }

    #[test]
    fn test_messages_use_crlf() {
        let welcome = render_welcome_message();
        assert!(welcome.contains("\r\n"));
    }

    #[test]
    fn test_unknown_command() {
        let msg = render_unknown_command("foobar");
        assert!(msg.contains("foobar"));
        assert!(msg.contains("Unknown"));
    }
}
