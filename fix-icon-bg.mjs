/**
 * fix-icon-bg.mjs
 * Replaces the dark/black background pixels inside the icon's circular design
 * with a bright warm-white background, making the logo text clearly readable.
 * Pixels that are already non-dark (the actual logo graphics) are kept as-is.
 */
import sharp from 'sharp';

const INPUT  = './Public/icons/JobNexusICON.png';
const OUTPUT = './Public/icons/JobNexusICON.png';
const TMP    = './Public/icons/JobNexusICON_tmp.png';

const img = sharp(INPUT);
const { width, height } = await img.metadata();
console.log(`Image size: ${width}x${height}`);

const { data } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const pixels = new Uint8Array(data);

const idx = (x, y) => (y * width + x) * 4;

// Determine circle parameters from image dimensions
const cx = Math.round(width  / 2);
const cy = Math.round(height / 2);
// The circle radius is roughly 90% of the shorter half-dimension
const r  = Math.round(Math.min(width, height) / 2 * 0.90);
console.log(`Circle: center=(${cx},${cy}), radius=${r}`);

// Warm-white background color for inside the circle
const BG_R = 255, BG_G = 253, BG_B = 250; // near-white with slight warmth

// How dark a pixel must be to be considered "background" (not logo graphics)
// Pixels where ALL channels are below this value → background
const DARK_THRESHOLD = 60;
// Pixels with very high brightness are already light (logo highlight elements) → keep as-is

let replaced = 0;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = idx(x, y);
    const a = pixels[i + 3];

    // Skip fully transparent pixels (the corners already made transparent by flood-fill)
    if (a < 30) continue;

    // Check if inside the circular design region
    const dx = x - cx;
    const dy = y - cy;
    if (dx * dx + dy * dy > r * r) continue;

    const pr = pixels[i];
    const pg = pixels[i + 1];
    const pb = pixels[i + 2];

    // If pixel is very dark (near-black background), replace with warm white
    if (pr < DARK_THRESHOLD && pg < DARK_THRESHOLD && pb < DARK_THRESHOLD) {
      pixels[i]     = BG_R;
      pixels[i + 1] = BG_G;
      pixels[i + 2] = BG_B;
      pixels[i + 3] = 255;
      replaced++;
    }
  }
}

console.log(`Replaced ${replaced} dark background pixels with warm white`);

// Write result
await sharp(Buffer.from(pixels), {
  raw: { width, height, channels: 4 }
})
  .png()
  .toFile(TMP);

// Overwrite original
import { rename } from 'fs/promises';
await rename(TMP, OUTPUT);
console.log(`Saved to ${OUTPUT}`);
