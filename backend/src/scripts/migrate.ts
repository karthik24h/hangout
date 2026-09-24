import { runMigrations, closePool } from '../config/migrations';

async function main() {
  try {
    await runMigrations();
    console.log('All migrations completed successfully');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();