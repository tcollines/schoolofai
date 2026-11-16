// Builds the admin console (admin-portal) into frontend/dist/admin so the live site serves it at /admin/.
// It never fails the student-site build: if this step breaks, the student site still deploys and the problem is logged.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const admin = path.join(root, 'admin-portal');
const out = path.join(root, 'frontend', 'dist', 'admin');
const run = (cmd, args) => spawnSync(cmd, args, { cwd: admin, stdio: 'inherit', shell: process.platform === 'win32' });

try {
    if (!fs.existsSync(path.join(admin, 'node_modules'))) {
        const i = run('npm', ['ci', '--no-audit', '--no-fund']);
        if (i.status !== 0) throw new Error('npm ci failed in admin-portal');
    }
    const b = run('npx', ['vite', 'build', '--base=/admin/', '--outDir', out, '--emptyOutDir']);
    if (b.status !== 0) throw new Error('admin build failed');
    console.log('Admin console built into', out);
} catch (e) {
    console.warn('WARNING: admin console was not built:', e.message);
}
