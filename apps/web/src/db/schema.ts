// db/migrations/*.sql is authoritative for the actual schema; this file exists
// to type queries and must be kept in step with it by hand.
import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const contacts = pgTable('contacts', {
    id: uuid().primaryKey().defaultRandom(),
    email: text().unique().notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const events = pgTable('events', {
    id: uuid().primaryKey().defaultRandom(),
    source: text().notNull(),
    eventType: text('event_type').notNull(),
    sessionId: text('session_id'),
    metadata: jsonb(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});
