import { readFileSync, writeFileSync, existsSync } from 'fs';
import { spawn, execSync } from 'child_process';
import path from 'path';

const schemaPath = path.resolve('prisma/schema.prisma');

function getOriginalSchema() {
  if (!existsSync(schemaPath)) return '';
  let content = readFileSync(schemaPath, 'utf-8');
  if (content.includes('provider = "sqlite"')) {
    console.log('[Dev] Startup check: Restoring schema provider to "postgresql"...');
    content = content.replace('provider = "sqlite"', 'provider = "postgresql"');
    writeFileSync(schemaPath, content);
  }
  return content;
}

const originalSchema = getOriginalSchema();
let changedToSqlite = false;

function restoreSchema() {
  if (changedToSqlite && existsSync(schemaPath)) {
    console.log('\n[Dev] Restoring prisma/schema.prisma back to "postgresql" provider...');
    const current = readFileSync(schemaPath, 'utf-8');
    if (current.includes('provider = "sqlite"')) {
      const restored = current.replace('provider = "sqlite"', 'provider = "postgresql"');
      writeFileSync(schemaPath, restored);
    }
    changedToSqlite = false;
  }
}

// Handle cleanup on exit
process.on('exit', restoreSchema);
process.on('SIGINT', () => {
  restoreSchema();
  process.exit(0);
});
process.on('SIGTERM', () => {
  restoreSchema();
  process.exit(0);
});
process.on('uncaughtException', (err) => {
  console.error('[Dev] Uncaught exception:', err);
  restoreSchema();
  process.exit(1);
});

async function main() {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === '') {
    console.log('[Dev] No DATABASE_URL found. Defaulting to local SQLite: file:./prisma/dev.db');
    process.env.DATABASE_URL = 'file:./prisma/dev.db';
  }
  const isSqlite = process.env.DATABASE_URL?.startsWith('file:') || process.env.DATABASE_URL?.includes('dev.db');
  
  if (isSqlite) {
    console.log('[Dev] Detected local SQLite database URL.');
    if (originalSchema.includes('provider = "postgresql"')) {
      console.log('[Dev] Swapping schema provider to "sqlite" for development runs...');
      const sqliteSchema = originalSchema.replace('provider = "postgresql"', 'provider = "sqlite"');
      writeFileSync(schemaPath, sqliteSchema);
      changedToSqlite = true;
      
      console.log('[Dev] Synchronizing local database and generating client...');
      try {
        execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
      } catch (err) {
        console.error('[Dev] Initial prisma db push failed. Retrying generate...', err);
        execSync('npx prisma generate', { stdio: 'inherit' });
      }
      
      // Restore schema immediately after generating Prisma Client/DB push
      // so that it never sits as "sqlite" on disk while dev server runs.
      restoreSchema();
    }
  } else {
    console.log('[Dev] Using non-SQLite database connection. Schema untouched.');
  }

  // Start the main server process
  console.log('[Dev] Starting LOXX dev server (server.ts)...');
  const child = spawn('npx', ['tsx', 'server.ts'], {
    stdio: 'inherit',
    env: process.env,
    shell: true
  });

  child.on('close', (code) => {
    restoreSchema();
    process.exit(code || 0);
  });
}

main().catch((err) => {
  console.error('[Dev] Runner error:', err);
  restoreSchema();
  process.exit(1);
});
