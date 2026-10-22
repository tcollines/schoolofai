const fs = require('fs');
const esbuild = require('./admin-portal/node_modules/esbuild');
const code = fs.readFileSync('admin-portal/src/components/admin/AdminCourseSetupWizard.tsx', 'utf8');

esbuild.transform(code, { loader: 'tsx' }).then(res => {
    console.log('Build succeeded!');
}).catch(err => {
    console.error('Esbuild error:', err);
});
