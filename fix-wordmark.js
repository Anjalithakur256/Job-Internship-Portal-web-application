const fs = require('fs');
const path = require('path');

const wordmark = '<span class="logo-wordmark"><span class="wm-name">Job<em>Nexus</em></span><span class="wm-sub">Connecting Careers</span></span>';

// Remove ALL existing wordmark spans then add one fresh one after the navbar img
// Step 1: strip all existing wordmarks
const stripPattern = /(<span class="logo-wordmark">[\s\S]*?<\/span>)/g;
// Step 2: match the navbar img (height 46 or 40, display:block)
const navImgPattern = /(<img src="\/Public\/icons\/JobNexusICON\.png" alt="JobNexus" style="height:(?:46|40)px;width:auto;display:block;">)/g;

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory() && f !== 'node_modules') { walk(full); continue; }
    if (!f.endsWith('.html')) continue;
    let c = fs.readFileSync(full, 'utf8');
    if (!c.includes('JobNexusICON')) continue;

    // Remove all existing wordmarks
    let stripped = c.replace(/<span class="logo-wordmark">[\s\S]*?<\/span><\/span>/g, '');

    // Now add exactly one wordmark after each navbar logo img
    navImgPattern.lastIndex = 0;
    if (navImgPattern.test(stripped)) {
      navImgPattern.lastIndex = 0;
      const updated = stripped.replace(navImgPattern, (m) => m + wordmark);
      fs.writeFileSync(full, updated, 'utf8');
      console.log('Fixed:', f);
    } else {
      fs.writeFileSync(full, stripped, 'utf8');
    }
  }
}
walk('.');
console.log('Done.');
