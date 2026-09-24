import { Pool } from 'pg';
import { readEnv } from './env';
export const pool = new Pool({ connectionString: readEnv().databaseUrl });
