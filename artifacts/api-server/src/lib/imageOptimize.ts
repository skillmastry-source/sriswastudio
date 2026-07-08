import sharp from "sharp";

const OPTIMIZABLE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/tiff",
  "image/avif",
]);

const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 80;

export function isOptimizableImage(mimetype: string | undefined | null): boolean {
  return !!mimetype && OPTIMIZABLE_TYPES.has(mimetype.toLowerCase());
}

/**
 * Compress an uploaded image: auto-rotate (EXIF), resize down to a web-friendly
 * maximum dimension, and convert to WebP. Returns the original buffer untouched
 * if optimization fails or does not make the file smaller.
 */
export async function optimizeImage(
  buffer: Buffer,
  mimetype: string,
): Promise<{ buffer: Buffer; contentType: string; ext: string; optimized: boolean }> {
  const original = { buffer, contentType: mimetype, ext: "", optimized: false };
  if (!isOptimizableImage(mimetype)) return original;

  try {
    const out = await sharp(buffer, { failOn: "none" })
      .rotate()
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    if (out.length >= buffer.length) return original;

    return { buffer: out, contentType: "image/webp", ext: ".webp", optimized: true };
  } catch {
    return original;
  }
}
