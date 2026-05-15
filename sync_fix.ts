import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const schemaPath = path.resolve('prisma/schema.prisma');
const originalSchema = readFileSync(schemaPath, 'utf-8');

try {
    console.log("Temporarily switching to sqlite provider for sync...");
    const sqliteSchema = originalSchema.replace('provider = "postgresql"', 'provider = "sqlite"');
    writeFileSync(schemaPath, sqliteSchema);
    
    console.log("Executing prisma db push...");
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    console.log("Sync completed successfully.");
} catch (err) {
    console.error("Sync failed:", err);
} finally {
    console.log("Restoring original schema (postgresql provider)...");
    writeFileSync(schemaPath, originalSchema);
}
