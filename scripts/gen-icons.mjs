import { readFileSync, mkdirSync } from "fs";
import sharp from "sharp";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, "..");
const svgPath = resolve(root, "public", "favicon.svg");
const outDir = resolve(root, "public", "icons");

mkdirSync(outDir, { recursive: true });

const svgBuffer = readFileSync(svgPath);

// Square icon sizes required by the PWA spec + common platforms
const SIZES = [72, 96, 128, 144, 152, 192, 256, 384, 512];

for (const size of SIZES) {
  await sharp(svgBuffer, { density: Math.ceil((size / 100) * 96) })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(resolve(outDir, `icon-${size}.png`));
  console.log(`✓ icon-${size}.png`);
}

// Apple touch icon (180×180, no transparency — iOS strips alpha)
await sharp(svgBuffer, { density: 172 })
  .resize(160, 160, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
  .extend({ top: 10, bottom: 10, left: 10, right: 10, background: { r: 255, g: 255, b: 255, alpha: 1 } })
  .png()
  .toFile(resolve(root, "public", "apple-touch-icon.png"));
console.log("✓ apple-touch-icon.png");

// Maskable icon: icon centred in the safe zone (80%) on the brand blue background
const MASK_SIZE = 512;
const SAFE_ZONE = Math.round(MASK_SIZE * 0.8); // 410px icon area
const PAD = Math.round((MASK_SIZE - SAFE_ZONE) / 2); // 51px each side

await sharp(svgBuffer, { density: Math.ceil((SAFE_ZONE / 100) * 96) })
  .resize(SAFE_ZONE, SAFE_ZONE, { fit: "contain", background: { r: 26, g: 75, b: 255, alpha: 1 } })
  .extend({ top: PAD, bottom: PAD, left: PAD, right: PAD, background: { r: 26, g: 75, b: 255, alpha: 1 } })
  .png()
  .toFile(resolve(outDir, "icon-maskable-512.png"));
console.log("✓ icon-maskable-512.png");

// Maskable 192
const M192 = 192;
const S192 = Math.round(M192 * 0.8);
const P192 = Math.round((M192 - S192) / 2);
await sharp(svgBuffer, { density: Math.ceil((S192 / 100) * 96) })
  .resize(S192, S192, { fit: "contain", background: { r: 26, g: 75, b: 255, alpha: 1 } })
  .extend({ top: P192, bottom: P192, left: P192, right: P192, background: { r: 26, g: 75, b: 255, alpha: 1 } })
  .png()
  .toFile(resolve(outDir, "icon-maskable-192.png"));
console.log("✓ icon-maskable-192.png");

console.log("\nAll icons generated successfully.");
