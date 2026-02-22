# Srijan Mahajan - Portfolio (Web + SSH)

A full-stack _polyglot_ developer portfolio combining:

- 🌐 Modern web application (TanStack Start)
- 🖥 SSH-accessible terminal portfolio
- 🗄 Unified Postgres event logging

## Overview

This portfolio is designed to showcase my work through two distinct interfaces:

1. **Web Application** - A modern, responsive React-based portfolio accessible via browser
2. **SSH Server** - A terminal-based portfolio experience accessible via SSH

Both interfaces share the same data source (`me.toml`) and connect to a unified PostgreSQL database for analytics and contact management.

## Project Structure

```
portfolio/
├── apps/
│   ├── web/          # TanStack Start web application
│   └── ssh/          # Rust SSH server
├── db/
│   └── migrations/   # SQL migrations for PostgreSQL
├── me.toml           # Unified profile data source
├── docker-compose.yml
└── Cargo.toml        # Rust workspace configuration
```

## Tech Stack

### Web Application (`apps/web`)

| Category       | Technology                                                       |
| -------------- | ---------------------------------------------------------------- |
| **Framework**  | [TanStack Start](https://tanstack.com/start) (React 19)          |
| **Runtime**    | [Bun](https://bun.sh)                                            |
| **Routing**    | [TanStack Router](https://tanstack.com/router)                   |
| **Styling**    | [Tailwind CSS v4](https://tailwindcss.com)                       |
| **Forms**      | [TanStack Form](https://tanstack.com/form)                       |
| **Validation** | [ArkType](https://arktype.io)                                    |
| **Database**   | [Drizzle ORM](https://orm.drizzle.team) + PostgreSQL             |
| **Email**      | [Resend](https://resend.com) + [React Email](https://react.email)|
| **UI**         | [Base UI](https://base-ui.com) + [Lucide Icons](https://lucide.dev)|
| **Build**      | [Vite](https://vite.dev)                                         |
| **Linting**    | [Biome](https://biomejs.dev)                                     |

### SSH Server (`apps/ssh`)

| Category      | Technology                                                  |
| ------------- | ----------------------------------------------------------- |
| **Language**  | [Rust](https://www.rust-lang.org) (Edition 2024)            |
| **SSH**       | [Russh](https://github.com/Russh/russh)                     |
| **Runtime**   | [Tokio](https://tokio.rs) (async runtime)                   |
| **Database**  | [SQLx](https://github.com/launchbadge/sqlx) + PostgreSQL    |
| **HTTP**      | [Reqwest](https://github.com/seanmonstar/reqwest)           |
| **Config**    | [TOML](https://toml.io) parsing via `toml` crate            |

### Database

| Component      | Technology                                      |
| -------------- | ----------------------------------------------- |
| **Database**   | PostgreSQL                                      |
| **Migrations** | Raw SQL migrations (managed via Drizzle Kit)    |
| **Tables**     | `contacts`, `events`                            |

### Infrastructure

| Component         | Technology                          |
| ----------------- | ----------------------------------- |
| **Containerization** | Docker + Docker Compose          |
| **Web Server**    | Nitro (via TanStack Start)          |

## Configuration

All portfolio content is defined in `me.toml`, a single source of truth used by both the web and SSH applications:

- Profile information
- Education history
- Work experience
- Projects
- Tech stack
- Achievements
- Contact details

## Features

### Web Application

- Responsive single-page portfolio
- GitHub contribution heatmap integration
- Contact form with email notifications
- Event analytics tracking
- Dark theme with modern UI components

### SSH Server

- Interactive terminal UI with ANSI colors
- Navigation commands (`about`, `skills`, `projects`, `experience`, `education`, `contact`)
- Connect/contact flow via terminal
- Session analytics and event logging
- Graceful degradation when database is unavailable

## Available Commands (SSH)

Connect to the SSH server and use these commands:

| Command      | Description                        |
| ------------ | ---------------------------------- |
| `help`       | Show available commands            |
| `about`      | Display profile information        |
| `skills`     | Show technical skills              |
| `experience` | List work experience               |
| `projects`   | Browse projects                    |
| `education`  | View education history             |
| `contact`    | Get contact information            |
| `connect`    | Submit your email to connect       |
| `exit`       | Close the SSH session              |
