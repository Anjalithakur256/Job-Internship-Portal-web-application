const fs = require('fs');
const path = require('path');

const wordmark = '<span class="logo-wordmark"><span class="wm-name">Job<em>Nexus</em></span><span class="wm-sub">Connecting Careers</span></span>';
// matches navbar logos (height:46px or height:40px with display:block — not loading overlays)
const pattern = /(<img src="\/Public\/icons\/JobNexusICON\.png" alt="JobNexus" style="height:(?:46|40)px;width:auto;display:block;">)/g;

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory() && f !== 'node_modules') { walk(full); continue; }
    if (!f.endsWith('.html')) continue;
    let c = fs.readFileSync(full, 'utf8');
    if (pattern.test(c)) {
      pattern.lastIndex = 0;
      const updated = c.replace(pattern, (m) => m + wordmark);
      fs.writeFileSync(full, updated, 'utf8');
      console.log('Updated:', full);
    } else {
      pattern.lastIndex = 0;
    }
  }
}
walk('.');
console.log('Done.');
