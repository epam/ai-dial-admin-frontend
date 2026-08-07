import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distPackagePath = join(root, 'dist/apps/ai-dial-admin/package.json');

const distPackage = JSON.parse(readFileSync(distPackagePath, 'utf8'));
const rootPackage = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

// Nx createPackageJson drops overrides whose keys were promoted to direct deps
// (e.g. dompurify). Restore root overrides before regenerating the lockfile.
distPackage.overrides = { ...distPackage.overrides, ...rootPackage.overrides };

writeFileSync(distPackagePath, `${JSON.stringify(distPackage, null, 2)}\n`);
