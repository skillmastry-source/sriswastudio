#!/usr/bin/env node
/**
 * One-time compressor for images already in the uploads/ directory.
 *
 * - Keeps the SAME filename and extension (URLs stored in the database keep working)
 * - Resizes anything larger than 1600px and re-encodes at web quality
 * - Backs up every original to uploads_originals/ before touching it
 * - Skips files that are already small (< 150 KB) or would not shrink
 *
 * Usage (from the repo root on the VPS):
 *   pnpm --filter @workspace/api-server run compress-uploads
 * Or with an explicit directory:
 *   pnpm --filter @workspace/api-server run compress-uploads -- /path/to/uploads
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";

const MAX_DIMENSION = 1600;
const SKIP_BELOW_BYTES = 150 * 1024;

const argDir = process.argv[2];
const candidates = [
  argDir,
  path.join(process.cwd(), "uploads"),
  "/var/www/sriswastudio/artifacts/api-server/uploads",
  "/var/www/sriswastudio/uploads",
].filter(Boolean);

const uploadsDir = candidates.find((d) => {
  try {
    return fs.statSync(d).isDirectory();
  } catch {
    return false;
  }
});

if (!uploadsDir) {
  console.error("❌ Could not find an uploads directory. Tried:");
  for (const c of candidates) console.error(`   - ${c}`);
  console.error("   Pass the path explicitly: ... run compress-uploads -- /path/to/uploads");
  process.exit(1);
}

const backupDir = path.join(path.dirname(uploadsDir), "uploads_originals");
fs.mkdirSync(backupDir, { recursive: true });

const EXT_HANDLERS = {
  ".jpg": (img) => img.jpeg({ quality: 80, mozjpeg: true }),
  ".jpeg": (img) => img.jpeg({ quality: 80, mozjpeg: true }),
  ".png": (img) => img.png({ compressionLevel: 9, palette: true }),
  ".webp": (img) => img.webp({ quality: 80 }),
};

const files = fs.readdirSync(uploadsDir).filter((f) => {
  const ext = path.extname(f).toLowerCase();
  return Object.hasOwn(EXT_HANDLERS, ext);
});

console.log(`📂 Uploads directory: ${uploadsDir}`);
console.log(`🗄️  Backups go to:    ${backupDir}`);
console.log(`🖼️  Found ${files.length} image(s) to check\n`);

let compressed = 0;
let skipped = 0;
let failed = 0;
let savedBytes = 0;

for (const file of files) {
  const filePath = path.join(uploadsDir, file);
  const ext = path.extname(file).toLowerCase();
  try {
    const original = fs.readFileSync(filePath);
    if (original.length < SKIP_BELOW_BYTES) {
      skipped++;
      continue;
    }

    const pipeline = sharp(original, { failOn: "none" })
      .rotate()
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      });
    const out = await EXT_HANDLERS[ext](pipeline).toBuffer();

    if (out.length >= original.length * 0.9) {
      skipped++;
      continue;
    }

    const backupPath = path.join(backupDir, file);
    if (!fs.existsSync(backupPath)) {
      fs.writeFileSync(backupPath, original);
    }

    const tmpPath = `${filePath}.tmp`;
    fs.writeFileSync(tmpPath, out);
    fs.renameSync(tmpPath, filePath);

    savedBytes += original.length - out.length;
    compressed++;
    console.log(
      `   ✓ ${file}: ${(original.length / 1024).toFixed(0)} KB → ${(out.length / 1024).toFixed(0)} KB`,
    );
  } catch (err) {
    failed++;
    console.error(`   ⚠️  ${file}: ${err.message} (left untouched)`);
  }
}

console.log("");
console.log(`✅ Done. Compressed ${compressed}, skipped ${skipped} (already small), failed ${failed}.`);
console.log(`💾 Total saved: ${(savedBytes / 1024 / 1024).toFixed(1)} MB`);
if (compressed > 0) {
  console.log(`🗄️  Originals backed up in: ${backupDir}`);
  console.log("   If everything looks good after a few days, you can delete that folder to free space.");
}
