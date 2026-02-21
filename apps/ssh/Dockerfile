# Dockerfile for Rust SSH Server
# Build context should be set to the repository root
# Uses musl for static binary to avoid GLIBC version issues

# ==========================================
# Stage 1: Build the Rust SSH server
# ==========================================
FROM rust:1.88-alpine AS builder

# Install musl-dev and other build dependencies
RUN apk add --no-cache musl-dev pkgconfig openssl-dev openssl-libs-static

WORKDIR /app

# Copy workspace files
COPY Cargo.toml Cargo.lock ./
COPY apps/ssh ./apps/ssh

# Build the SSH server in release mode with musl target
ENV OPENSSL_STATIC=1
RUN cargo build --release --package ssh

# ==========================================
# Stage 2: Runtime
# ==========================================
FROM alpine:3.20 AS runtime

# Install necessary runtime dependencies
RUN apk add --no-cache ca-certificates

WORKDIR /app

# Copy the built binary
COPY --from=builder /app/target/release/ssh /app/ssh-server

# Expose SSH port
EXPOSE 2222

# Run the SSH server
CMD ["/app/ssh-server"]
