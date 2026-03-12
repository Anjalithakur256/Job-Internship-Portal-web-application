const fs = require('fs');
const path = require('path');

// Remove all logo-wordmark spans
const pattern = /<span class="logo-wordmark">[\s\S]*?<\/span><\/span>/g;

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory() && f !== 'node_modules') { walk(full); continue; }
    if (!f.endsWith('.html')) continue;
    let c = fs.readFileSync(full, 'utf8');
    if (pattern.test(c)) {
      pattern.lastIndex = 0;
      const updated = c.replace(pattern, '');
      fs.writeFileSync(full, updated, 'utf8');
      console.log('Cleaned:', f);
    }
    pattern.lastIndex = 0;
  }
}
walk('.');
console.log('Done.');
