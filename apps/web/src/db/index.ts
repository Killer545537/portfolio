import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';

import * as schema from './schema.ts';

config({ path: '../../.env', quiet: true });

const create = () => drizzle(neon(process.env.DATABASE_URL!), { schema });

let cached: ReturnType<typeof create> | undefined;

// ponytail: connect on first query, not at import. The Docker build has no
// DATABASE_URL (.env is dockerignored) and neon() throws when constructed,
// which otherwise kills prerendering at build time.
export const getDb = () => (cached ??= create());
