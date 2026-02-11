-- Add down migration script here
DROP TABLE IF EXISTS contacts;
DROP TABLE IF EXISTS events;
DROP EXTENSION IF EXISTS "pgcrypto";
