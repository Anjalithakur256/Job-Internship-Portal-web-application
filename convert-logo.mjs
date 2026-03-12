/**
 * Converts "Job Nexus logo..jpeg" → "Job Nexus logo.png"
 * Removes near-black/dark background pixels to make them transparent.
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';

const INPUT  = './Public/Job Nexus logo..jpeg';
const OUTPUT = './Public/Job Nexus logo.png';

// Load as raw RGBA
const img = sharp(INPUT);
const { width, height } = await img.metadata();

const { data } = await img
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const pixels = new Uint8Array(data);

// Threshold: pixels darker than this on ALL channels are made transparent
const DARK_THRESHOLD = 60;
// Edge-feathering: pixels slightly above threshold get partial alpha for smooth edges
const SOFT_THRESHOLD = 100;

for (let i = 0; i < pixels.length; i += 4) {
  const r = pixels[i];
  const g = pixels[i + 1];
  const b = pixels[i + 2];

  const brightness = (r + g + b) / 3;

  if (brightness < DARK_THRESHOLD) {
    // Fully transparent
    pixels[i + 3] = 0;
  } else if (brightness < SOFT_THRESHOLD) {
    // Feathered edge
    const alpha = Math.round(((brightness - DARK_THRESHOLD) / (SOFT_THRESHOLD - DARK_THRESHOLD)) * 255);
    pixels[i + 3] = alpha;
  }
  // else: keep fully opaque
}

await sharp(Buffer.from(pixels), {
  raw: { width, height, channels: 4 }
})
  .png({ compressionLevel: 9 })
  .toFile(OUTPUT);

console.log(`✅ Saved transparent PNG → ${OUTPUT}  (${width}×${height})`);
