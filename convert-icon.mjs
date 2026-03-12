/**
 * Converts JobNexusICON.jpeg → JobNexusICON.png with transparent background.
 * Uses corner flood-fill to remove the dark outer background accurately,
 * leaving the circular logo design fully intact.
 */
import sharp from 'sharp';

const INPUT  = './Public/icons/JobNexusICON.jpeg';
const OUTPUT = './Public/icons/JobNexusICON.png';

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

// Tolerance: how close a pixel must be to bg color to count as background
const TOLERANCE = 30;

function isBg(x, y) {
  const i = idx(x, y);
  return (
    Math.abs(pixels[i]   - bgR) < TOLERANCE &&
    Math.abs(pixels[i+1] - bgG) < TOLERANCE &&
    Math.abs(pixels[i+2] - bgB) < TOLERANCE
  );
}

// BFS flood-fill from all 4 corners to mark background pixels
const visited = new Uint8Array(width * height); // 0 = unvisited, 1 = background
const queue = [];

function seed(x, y) {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  if (visited[y * width + x]) return;
  if (!isBg(x, y)) return;
  visited[y * width + x] = 1;
  queue.push(x, y);
}

// Seed from all 4 corners and all 4 edges
for (let x = 0; x < width; x++)  { seed(x, 0); seed(x, height-1); }
for (let y = 0; y < height; y++) { seed(0, y); seed(width-1, y); }

// BFS
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

// Make all flood-filled (background) pixels transparent
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
console.log(`Made ${count} background pixels transparent out of ${width*height} total`);

await sharp(Buffer.from(pixels), { raw: { width, height, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(OUTPUT);

console.log(`✅ Saved → ${OUTPUT}  (${width}×${height})`);

