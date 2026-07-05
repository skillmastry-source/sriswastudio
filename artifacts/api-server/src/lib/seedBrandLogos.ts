import { db } from "@workspace/db";
import { mediaFilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

const BRAND_LOGOS = [
  {
    filename: "logo-color.png",
    url: "/brand/logo-color.png",
    folder: "Brand",
    mimeType: "image/png",
    path: path.join(process.cwd(), "../../artifacts/store/public/brand/logo-color.png"),
  },
  {
    filename: "logo-white.png",
    url: "/brand/logo-white.png",
    folder: "Brand",
    mimeType: "image/png",
    path: path.join(process.cwd(), "../../artifacts/store/public/brand/logo-white.png"),
  },
  {
    filename: "logo-icon.png",
    url: "/brand/logo-icon.png",
    folder: "Brand",
    mimeType: "image/png",
    path: path.join(process.cwd(), "../../artifacts/store/public/brand/logo-icon.png"),
  },
  {
    filename: "logo-transparent.png",
    url: "/brand/logo-transparent.png",
    folder: "Brand",
    mimeType: "image/png",
    path: path.join(process.cwd(), "../../artifacts/store/public/brand/logo-transparent.png"),
  },
];

export async function seedBrandLogos() {
  try {
    for (const logo of BRAND_LOGOS) {
      const existing = await db
        .select()
        .from(mediaFilesTable)
        .where(eq(mediaFilesTable.url, logo.url))
        .limit(1);

      if (existing.length > 0) continue;

      let sizeBytes = 0;
      try {
        const stat = fs.statSync(logo.path);
        sizeBytes = stat.size;
      } catch {
        sizeBytes = 0;
      }

      await db.insert(mediaFilesTable).values({
        filename: logo.filename,
        url: logo.url,
        folder: logo.folder,
        mimeType: logo.mimeType,
        sizeBytes,
      });
    }
  } catch {
  }
}
