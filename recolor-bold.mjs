/**
 * Hard-recolor grey text pixels in the icon.
 * Any low-saturation (grey) pixel inside the circle with brightness below 230
 * becomes solid dark maroon — no blending, just clean solid color.
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

// Target: deep crisp maroon (matches the existing ring / graphics)
const TARGET_R = 90, TARGET_G = 8, TARGET_B = 24;

const cx = Math.round(width / 2), cy = Math.round(height / 2);
const r  = Math.round(Math.min(width, height) / 2 * 0.88);

// Pure white background threshold — keep anything at/above this
const WHITE_FLOOR = 230;
// Saturation cap — real maroon graphics have high saturation, grey text does not
const MAX_SAT = 40;
// Minimum brightness to process (below this are already-dark graphics)
const MIN_BRIGHT = 40;

let changed = 0;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const dx = x - cx, dy = y - cy;
    if (dx * dx + dy * dy > r * r) continue;

    const i = idx(x, y);
    if (pixels[i + 3] < 30) continue;

    const pr = pixels[i], pg = pixels[i + 1], pb = pixels[i + 2];
    const brightness = (pr + pg + pb) / 3;
    const saturation = Math.max(pr, pg, pb) - Math.min(pr, pg, pb);

    // Skip white background, skip already dark graphics, skip high-saturation maroon pixels
    if (brightness >= WHITE_FLOOR) continue;
    if (brightness < MIN_BRIGHT)   continue;
    if (saturation > MAX_SAT)       continue;

    // This is a grey text pixel — set it to solid dark maroon
    pixels[i]     = TARGET_R;
    pixels[i + 1] = TARGET_G;
    pixels[i + 2] = TARGET_B;
    changed++;
  }
}

console.log(`Recolored ${changed} grey pixels → solid dark maroon rgb(${TARGET_R},${TARGET_G},${TARGET_B})`);

await sharp(Buffer.from(pixels), { raw: { width, height, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(TMP);

await rename(TMP, OUTPUT);
console.log('Saved:', OUTPUT);
