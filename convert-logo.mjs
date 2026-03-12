/**
 * Converts "Job Nexus logo..jpeg" → "Job Nexus logo.png"
 * Uses corner flood-fill to remove dark outer background accurately.
 */
import sharp from 'sharp';

const INPUT  = './Public/Job Nexus logo..jpeg';
const OUTPUT = './Public/Job Nexus logo.png';

const img = sharp(INPUT);
const { width, height } = await img.metadata();

const { data } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const pixels = new Uint8Array(data);

const idx = (x, y) => (y * width + x) * 4;

// Sample background color from top-left corner
const bgR = pixels[idx(0,0)];
const bgG = pixels[idx(0,0)+1];
const bgB = pixels[idx(0,0)+2];
console.log(`Background color sampled: rgb(${bgR},${bgG},${bgB})`);

const TOLERANCE = 35;

function isBg(x, y) {
  const i = idx(x, y);
  return (
    Math.abs(pixels[i]   - bgR) < TOLERANCE &&
    Math.abs(pixels[i+1] - bgG) < TOLERANCE &&
    Math.abs(pixels[i+2] - bgB) < TOLERANCE
  );
}

const visited = new Uint8Array(width * height);
const queue = [];

function seed(x, y) {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  if (visited[y * width + x]) return;
  if (!isBg(x, y)) return;
  visited[y * width + x] = 1;
  queue.push(x, y);
}

for (let x = 0; x < width; x++)  { seed(x, 0); seed(x, height-1); }
for (let y = 0; y < height; y++) { seed(0, y); seed(width-1, y); }

let qi = 0;
while (qi < queue.length) {
  const x = queue[qi++];
  const y = queue[qi++];
  for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
    if (visited[ny * width + nx]) continue;
    if (!isBg(nx, ny)) continue;
    visited[ny * width + nx] = 1;
    queue.push(nx, ny);
  }
}

let count = 0;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    if (visited[y * width + x]) {
      const i = idx(x, y);
      pixels[i+3] = 0;
      count++;
    }
  }
}
console.log(`Made ${count} pixels transparent out of ${width*height} total`);

await sharp(Buffer.from(pixels), { raw: { width, height, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(OUTPUT);

console.log(`✅ Saved → ${OUTPUT}  (${width}×${height})`);

