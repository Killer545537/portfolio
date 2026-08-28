import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import * as schema from './schema.ts';

// Env comes from the process: Vite's `envDir` in dev, the container in prod.
// The dotenv call that used to live here resolved relative to process.cwd()
// and silently no-opped once the server ran out of .output/.

const create = () => drizzle(neon(process.env.DATABASE_URL!), { schema });

let cached: ReturnType<typeof create> | undefined;

// ponytail: connect on first query, not at import. The Docker build has no
// DATABASE_URL (.env is dockerignored) and neon() throws when constructed,
// which otherwise kills prerendering at build time.
export const getDb = () => (cached ??= create());
