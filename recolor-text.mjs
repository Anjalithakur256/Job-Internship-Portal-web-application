/**
 * Recolors the grey text pixels ("JOB|NEXUS", "CONNECTING CAREERS") in the icon
 * from near-invisible light grey → dark maroon to match the logo graphics.
 */
import sharp from 'sharp';
import { rename } from 'fs/promises';

const INPUT  = './Public/icons/JobNexusICON.png';
const TMP    = './Public/icons/JobNexusICON_tmp.png';
const OUTPUT = './Public/icons/JobNexusICON.png';

const img = sharp(INPUT);
const { width, height } = await img.metadata();
const { data } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const pixels = new Uint8Array(data);
const idx = (x, y) => (y * width + x) * 4;

// Dark maroon target — matches the existing logo graphic color
const DARK_R = 100, DARK_G = 12, DARK_B = 30;
// White/near-white background stays untouched above this brightness
const WHITE_THRESHOLD = 238;
// Minimum brightness for text pixels (below this are already dark graphics)
const DARK_THRESHOLD = 55;
// Maximum saturation for "grey" detection (actual logo graphics have high saturation)
const MAX_SAT = 38;

let changed = 0;
const cx = Math.round(width / 2), cy = Math.round(height / 2);
const r  = Math.round(Math.min(width, height) / 2 * 0.88);

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const dx = x - cx, dy = y - cy;
    if (dx*dx + dy*dy > r*r) continue;

    const i = idx(x, y);
    if (pixels[i+3] < 30) continue;

    const pr = pixels[i], pg = pixels[i+1], pb = pixels[i+2];
    const brightness  = (pr + pg + pb) / 3;
    const saturation  = Math.max(pr, pg, pb) - Math.min(pr, pg, pb);

    // Skip: white background, already-dark graphics, or high-saturation maroon
    if (brightness >= WHITE_THRESHOLD) continue;
    if (brightness < DARK_THRESHOLD)   continue;
    if (saturation > MAX_SAT)          continue;

    // ink density: 0 = nearly white (light grey), 1 = fully dark (pure text pixel)
    const ink = (WHITE_THRESHOLD - brightness) / (WHITE_THRESHOLD - DARK_THRESHOLD);

    // Blend: dark maroon for high ink, near-white for low ink
    pixels[i]     = Math.round(255 - ink * (255 - DARK_R));
    pixels[i + 1] = Math.round(255 - ink * (255 - DARK_G));
    pixels[i + 2] = Math.round(255 - ink * (255 - DARK_B));
    changed++;
  }
}

console.log(`Recolored ${changed} grey text pixels → dark maroon`);

await sharp(Buffer.from(pixels), { raw: { width, height, channels: 4 } })
  .png()
  .toFile(TMP);

await rename(TMP, OUTPUT);
console.log('Saved:', OUTPUT);
