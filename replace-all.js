const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = [
    ...walk(path.join(__dirname, 'frontend')),
    ...walk(path.join(__dirname, 'admin-portal'))
];

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let newContent = content
        .replace(/mysqlClient/g, 'supabaseClient')
        .replace(/\/mysqlClient'/g, '/supabaseClient\'')
        .replace(/\/mysqlClient"/g, '/supabaseClient"');
    
    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log(`Updated ${file}`);
    }
}
