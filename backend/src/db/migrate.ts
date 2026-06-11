import { readFile } from 'node:fs/promises';

import postgres from 'postgres';

import { loadConfig } from '../config.js';

const migrationUrl = new URL('../../drizzle/0000_initial.sql', import.meta.url);
const config = loadConfig();
const sql = postgres(config.databaseUrl, { max: 1 });

try {
  const migration = await readFile(migrationUrl, 'utf8');
  await sql.unsafe(migration);
  console.log('Database migration completed.');
} finally {
  await sql.end();
}
