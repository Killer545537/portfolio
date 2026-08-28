# Dockerfile for Rust SSH Server
# Build context should be set to the repository root

# ==========================================
# Stage 1: cargo-chef planner
# ==========================================
# Prebuilt cargo-chef image - avoids compiling cargo-chef from source on every
# build the way `cargo install cargo-chef` did.
FROM lukemathwalker/cargo-chef:latest-rust-alpine AS chef
# musl-dev provides the C toolchain aws-lc-sys builds against. The project is
# rustls-only (no openssl-sys anywhere in Cargo.lock), so the OpenSSL packages
# and OPENSSL_STATIC that used to live here were dead weight.
RUN apk add --no-cache musl-dev
WORKDIR /app

FROM chef AS planner
COPY Cargo.toml Cargo.lock ./
COPY apps/ssh ./apps/ssh
RUN cargo chef prepare --recipe-path recipe.json

# ==========================================
# Stage 2: Cache dependencies
# ==========================================
FROM chef AS builder
COPY --from=planner /app/recipe.json recipe.json
# This layer is cached as long as Cargo.toml/Cargo.lock don't change
RUN cargo chef cook --release --recipe-path recipe.json

# Now copy source and build only your code
COPY Cargo.toml Cargo.lock ./
COPY apps/ssh ./apps/ssh
RUN cargo build --release --locked --package ssh

# ==========================================
# Stage 3: Runtime
# ==========================================
FROM alpine:3 AS runtime

RUN apk add --no-cache ca-certificates
WORKDIR /app

COPY --from=builder /app/target/release/ssh /app/ssh-server
# ui.rs reads me.toml at runtime and silently falls back to hardcoded content
# when it is missing, so the image has to carry it.
COPY me.toml /app/me.toml

# Drop root: the server only reads files and binds 2222 (>1024).
# /app/data holds the persistent SSH host key and must be writable by appuser;
# mount a volume over it so the key survives container replacement.
RUN adduser -D -H -u 10001 appuser \
    && mkdir -p /app/data \
    && chown appuser:appuser /app/data
USER appuser

ENV SSH_HOST_KEY_FILE=/app/data/ssh_host_key
VOLUME ["/app/data"]

EXPOSE 2222
CMD ["/app/ssh-server"]
