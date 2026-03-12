/**
 * Analyze pixel color distribution in the icon to find the grey text range
 */
import sharp from 'sharp';

const INPUT = './Public/icons/JobNexusICON.png';
const img = sharp(INPUT);
const { width, height } = await img.metadata();
const { data } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const pixels = new Uint8Array(data);
const idx = (x, y) => (y * width + x) * 4;
const cx = Math.round(width / 2), cy = Math.round(height / 2);
const r = Math.round(Math.min(width, height) / 2 * 0.85);

// Collect grey-ish pixels (R≈G≈B, not too dark, not too bright = the text area)
// Grey = max channel - min channel < 30 (roughly equal RGB = grey)
// Text range: brightness 60-210 (not pure white, not pure black)
const greyBuckets = {};
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const dx = x - cx, dy = y - cy;
    if (dx*dx + dy*dy > r*r) continue;
    const i = idx(x, y);
    if (pixels[i+3] < 30) continue;
    const pr = pixels[i], pg = pixels[i+1], pb = pixels[i+2];
    const brightness = Math.round((pr+pg+pb)/3);
    const maxC = Math.max(pr,pg,pb), minC = Math.min(pr,pg,pb);
    const saturation = maxC - minC;
    // Grey-ish: low saturation, mid-brightness
    if (saturation < 35 && brightness > 55 && brightness < 245) {
      const bucket = Math.round(brightness / 10) * 10;
      greyBuckets[bucket] = (greyBuckets[bucket] || 0) + 1;
    }
  }
}

console.log('Grey-ish pixel buckets (brightness range → count):');
Object.keys(greyBuckets).sort((a,b) => Number(a)-Number(b)).forEach(k => {
  console.log(`  ${k}-${Number(k)+9}: ${greyBuckets[k]} pixels`);
});

// Also sample the text area specifically (lower portion of circle where text "JOB NEXUS" is)
console.log('\nSamples from text area (center-bottom region):');
for (let y = Math.round(cy + r*0.3); y < Math.round(cy + r*0.75); y += 10) {
  for (let x = Math.round(cx - r*0.6); x < Math.round(cx + r*0.6); x += 20) {
    const i = idx(x, y);
    if (pixels[i+3] < 30) continue;
    const pr = pixels[i], pg = pixels[i+1], pb = pixels[i+2];
    const maxC = Math.max(pr,pg,pb), minC = Math.min(pr,pg,pb);
    if (maxC - minC < 40 && (pr+pg+pb)/3 < 240) {
      console.log(`  (${x},${y}): rgb(${pr},${pg},${pb}) brightness=${Math.round((pr+pg+pb)/3)}`);
    }
  }
}
