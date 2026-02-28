# Dockerfile for Rust SSH Server
# Build context should be set to the repository root

# ==========================================
# Stage 1: cargo-chef planner
# ==========================================
FROM rust:alpine AS chef
RUN apk add --no-cache musl-dev pkgconfig openssl-dev openssl-libs-static
RUN cargo install cargo-chef
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
ENV OPENSSL_STATIC=1
# This layer is cached as long as Cargo.toml/Cargo.lock don't change
RUN cargo chef cook --release --recipe-path recipe.json

# Now copy source and build only your code
COPY Cargo.toml Cargo.lock ./
COPY apps/ssh ./apps/ssh
RUN cargo build --release --package ssh

# ==========================================
# Stage 3: Runtime
# ==========================================
FROM alpine:latest AS runtime

RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=builder /app/target/release/ssh /app/ssh-server

EXPOSE 2222
CMD ["/app/ssh-server"]
