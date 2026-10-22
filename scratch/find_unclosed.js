const fs = require('fs');
const content = fs.readFileSync('admin-portal/src/components/admin/AdminCourseSetupWizard.tsx', 'utf8');

let curly = 0;
let paren = 0;
for (let c of content) {
    if (c === '{') curly++;
    if (c === '}') curly--;
    if (c === '(') paren++;
    if (c === ')') paren--;
}
console.log('Curly balance:', curly, 'Paren balance:', paren);
