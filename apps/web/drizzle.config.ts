import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: ['.env.local', '.env'] });

export default defineConfig({
    out: './drizzle',
    schema: './src/db/schema.ts',
    dialect: 'postgresql',
    migrations: {
        schema: 'public',
        table: '__drizzle_migrations',
    },
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },

    casing: 'snake_case',
    strict: true,
    verbose: true,
});
