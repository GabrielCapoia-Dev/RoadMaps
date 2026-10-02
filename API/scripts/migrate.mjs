import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import pg from 'pg';

// Explicit command, used before starting the API. Never drops or resets data.
if (
  process.env.NODE_ENV === 'production' &&
  (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('breadcrumbs_local'))
)
  throw new Error(
    'Production migrations require an explicit database URL without development credentials.',
  );
const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ??
    'postgresql://breadcrumbs:breadcrumbs_local@localhost:5432/breadcrumbs',
  connectionTimeoutMillis: 5000,
});
const client = await pool.connect();
try {
  await client.query('SELECT pg_advisory_lock(73421801)');
  await client.query(
    'CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())',
  );
  const directory = new URL('../migrations/', import.meta.url);
  for (const name of (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort()) {
    const sql = await readFile(new URL(name, directory), 'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');
    const existing = await client.query('SELECT checksum FROM schema_migrations WHERE name=$1', [
      name,
    ]);
    if (existing.rowCount) {
      if (existing.rows[0].checksum !== checksum)
        throw new Error(`Migration changed after application: ${name}`);
      continue;
    }
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(name,checksum) VALUES($1,$2)', [
        name,
        checksum,
      ]);
      await client.query('COMMIT');
      console.log(`Applied ${name}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }
} finally {
  await client.query('SELECT pg_advisory_unlock(73421801)');
  client.release();
  await pool.end();
}
