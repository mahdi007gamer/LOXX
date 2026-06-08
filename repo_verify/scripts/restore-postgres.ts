import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';

const schemaPath = path.resolve('prisma/schema.prisma');

if (existsSync(schemaPath)) {
  let schema = readFileSync(schemaPath, 'utf-8');
  if (schema.includes('provider = "sqlite"')) {
    console.log('[Restore-Postgres] Restoring schema provider to "postgresql"...');
    schema = schema.replace('provider = "sqlite"', 'provider = "postgresql"');
    writeFileSync(schemaPath, schema);
    console.log('[Restore-Postgres] Schema successfully restored.');
  } else {
    console.log('[Restore-Postgres] Schema already set or kept to "postgresql" provider.');
  }
}
