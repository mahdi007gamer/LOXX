import fs from 'fs';
import path from 'path';

const keep = new Set(['node_modules', 'clean_and_fetch.cjs']);

for (const item of fs.readdirSync('.')) {
    if (!keep.has(item)) {
        fs.rmSync(item, { recursive: true, force: true });
    }
}
