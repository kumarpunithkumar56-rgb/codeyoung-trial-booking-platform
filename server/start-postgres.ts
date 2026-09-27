import EmbeddedPostgres from 'embedded-postgres';
import path from 'path';

async function start() {
  console.log('🚀 Starting Embedded PostgreSQL server...');
  const pg = new EmbeddedPostgres({
    databaseDir: path.join(__dirname, '.pgdata'),
    port: 5432,
    user: 'user',
    password: 'password',
    initialDatabase: 'codeyoung_dev',
    persistent: true,
  });

  try {
    await pg.initialise();
  } catch (err: any) {
    console.log('Already initialized or warning:', err?.message || err);
  }

  await pg.start();
  console.log('✅ PostgreSQL is running on port 5432 (database: codeyoung_dev)');
}

start().catch((err) => {
  console.error('❌ Failed to start PostgreSQL:', err);
  process.exit(1);
});
