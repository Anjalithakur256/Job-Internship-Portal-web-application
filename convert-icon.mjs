/**
 * Converts JobNexusICON.jpeg → JobNexusICON.png with transparent background.
 * Removes near-white/light pixels (the white background of the icon).
 */
import sharp from 'sharp';

const INPUT  = './Public/icons/JobNexusICON.jpeg';
const OUTPUT = './Public/icons/JobNexusICON.png';

const img = sharp(INPUT);
const { width, height } = await img.metadata();

const { data } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const pixels = new Uint8Array(data);

// Thresholds for the white background removal
const WHITE_THRESHOLD = 220;  // pixels brighter than this on all channels → transparent
const SOFT_THRESHOLD  = 180;  // pixels between SOFT and WHITE → feathered edge

for (let i = 0; i < pixels.length; i += 4) {
  const r = pixels[i];
  const g = pixels[i + 1];
  const b = pixels[i + 2];

  if (r > WHITE_THRESHOLD && g > WHITE_THRESHOLD && b > WHITE_THRESHOLD) {
    // Fully transparent (white background)
    pixels[i + 3] = 0;
  } else if (r > SOFT_THRESHOLD && g > SOFT_THRESHOLD && b > SOFT_THRESHOLD) {
    // Soft feathered edge
    const factor = (Math.min(r, g, b) - SOFT_THRESHOLD) / (WHITE_THRESHOLD - SOFT_THRESHOLD);
    pixels[i + 3] = Math.round((1 - factor) * 255);
  }
  // else: fully opaque (keep colored pixels as-is)
}

await sharp(Buffer.from(pixels), { raw: { width, height, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(OUTPUT);

console.log(`✅ Saved → ${OUTPUT}  (${width}×${height})`);
