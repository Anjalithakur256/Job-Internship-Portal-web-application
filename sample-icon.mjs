import sharp from 'sharp';

const INPUT = './Public/icons/JobNexusICON.png';
const img = sharp(INPUT);
const { width, height } = await img.metadata();
console.log(`Size: ${width}x${height}`);

const { data } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const pixels = new Uint8Array(data);
const idx = (x, y) => (y * width + x) * 4;

// Sample a grid of pixels in the center area to see actual colors
console.log('\n--- Pixel samples from center region ---');
const cx = Math.round(width / 2);
const cy = Math.round(height / 2);

for (let dy = -100; dy <= 100; dy += 50) {
  for (let dx = -100; dx <= 100; dx += 50) {
    const x = cx + dx, y = cy + dy;
    const i = idx(x, y);
    const r = pixels[i], g = pixels[i+1], b = pixels[i+2], a = pixels[i+3];
    console.log(`  (${x},${y}): rgba(${r},${g},${b},${a})`);
  }
}

// Count dark pixels in center
let totalInCircle = 0;
let darkCount = 0;
const r = Math.round(Math.min(width, height) / 2 * 0.9);
const histogram = new Array(10).fill(0); // buckets: 0-25, 26-50, ...255

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const dx = x - cx, dy2 = y - cy;
    if (dx*dx + dy2*dy2 > r*r) continue;
    const i = idx(x, y);
    const a = pixels[i+3];
    if (a < 30) continue;
    totalInCircle++;
    const pr = pixels[i], pg = pixels[i+1], pb = pixels[i+2];
    const brightness = (pr + pg + pb) / 3;
    const bucket = Math.min(9, Math.floor(brightness / 25.6));
    histogram[bucket]++;
    if (pr < 80 && pg < 80 && pb < 80) darkCount++;
  }
}

console.log(`\nTotal opaque pixels in circle: ${totalInCircle}`);
console.log(`Dark (all channels < 80): ${darkCount}`);
console.log('\nBrightness histogram (avg channel):');
histogram.forEach((count, i) => {
  const rangeStart = Math.round(i * 25.6);
  const rangeEnd = Math.round((i+1) * 25.6) - 1;
  console.log(`  ${String(rangeStart).padStart(3)}-${String(rangeEnd).padStart(3)}: ${count} pixels`);
});
