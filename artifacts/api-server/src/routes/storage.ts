import { Router, type IRouter, type Request, type Response } from "express";
import { Readable } from "stream";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import multer from "multer";
import {
  RequestUploadUrlBody,
  RequestUploadUrlResponse,
} from "@workspace/api-zod";
import { ObjectStorageService, ObjectNotFoundError, objectStorageClient } from "../lib/objectStorage";
import { optimizeImage } from "../lib/imageOptimize";
import { ObjectPermission } from "../lib/objectAcl";
import { requireAdmin } from "../middlewares/requireAdmin";
import { requireEditor } from "../middlewares/requireEditor";
import { getAuth } from "@clerk/express";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const localUpload = multer({
  dest: UPLOADS_DIR,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

/**
 * POST /storage/uploads/request-url
 *
 * Request a presigned URL for file upload.
 * The client sends JSON metadata (name, size, contentType) — NOT the file.
 * Then uploads the file directly to the returned presigned URL.
 */
router.post("/storage/uploads/request-url", requireAdmin, async (req: Request, res: Response) => {
  const parsed = RequestUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing or invalid required fields" });
    return;
  }

  try {
    const { name, size, contentType } = parsed.data;

    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

    res.json(
      RequestUploadUrlResponse.parse({
        uploadURL,
        objectPath,
        metadata: { name, size, contentType },
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Error generating upload URL");
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

/**
 * GET /storage/public-objects/*
 *
 * Serve public assets from PUBLIC_OBJECT_SEARCH_PATHS.
 * These are unconditionally public — no authentication or ACL checks.
 * IMPORTANT: Always provide this endpoint when object storage is set up.
 */
router.get("/storage/public-objects/*filePath", async (req: Request, res: Response) => {
  try {
    const raw = req.params.filePath;
    const filePath = Array.isArray(raw) ? raw.join("/") : raw;
    const file = await objectStorageService.searchPublicObject(filePath);
    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const response = await objectStorageService.downloadObject(file);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    req.log.error({ err: error }, "Error serving public object");
    res.status(500).json({ error: "Failed to serve public object" });
  }
});

/**
 * GET /storage/objects/*
 *
 * Serve object entities from PRIVATE_OBJECT_DIR.
 * These are served from a separate path from /public-objects and can optionally
 * be protected with authentication or ACL checks based on the use case.
 */
router.get("/storage/objects/*path", async (req: Request, res: Response) => {
  try {
    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join("/") : raw;
    const objectPath = `/objects/${wildcardPath}`;
    const objectFile = await objectStorageService.getObjectEntityFile(objectPath);

    const auth = getAuth(req);
    if (!auth.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const canAccess = await objectStorageService.canAccessObjectEntity({
      userId: auth.userId,
      objectFile,
      requestedPermission: ObjectPermission.READ,
    });
    if (!canAccess) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const response = await objectStorageService.downloadObject(objectFile);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      req.log.warn({ err: error }, "Object not found");
      res.status(404).json({ error: "Object not found" });
      return;
    }
    req.log.error({ err: error }, "Error serving object");
    res.status(500).json({ error: "Failed to serve object" });
  }
});

/**
 * GET /storage/product-images/*path
 *
 * Publicly serve admin-uploaded product images without authentication.
 * Product images must be visible to all shoppers.
 */
router.get("/storage/product-images/*path", async (req: Request, res: Response) => {
  try {
    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join("/") : raw;
    // Constrain to the uploads/ prefix — product images are written there by
    // getObjectEntityUploadURL(). Reject path traversal and non-upload paths.
    if (!wildcardPath.startsWith("uploads/") || wildcardPath.includes("..")) {
      res.status(404).json({ error: "Image not found" });
      return;
    }
    const objectPath = `/objects/${wildcardPath}`;
    const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
    const response = await objectStorageService.downloadObject(objectFile);
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    // Object IDs are UUIDs — content never changes for a given name, safe to cache long-term.
    res.setHeader("Cache-Control", "public, max-age=2592000, immutable");
    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      res.status(404).json({ error: "Image not found" });
      return;
    }
    req.log.error({ err: error }, "Error serving product image");
    res.status(500).json({ error: "Failed to serve image" });
  }
});

/**
 * POST /storage/uploads/server
 *
 * Server-side image upload — avoids browser CORS issues with signed URLs.
 * Tries Replit Object Storage first (server-to-GCS, no CORS), then falls
 * back to local filesystem. Returns { url, objectPath }.
 */
router.post("/storage/uploads/server", requireAdmin, memoryUpload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: "No file provided" });
    return;
  }

  const privateDir = process.env.PRIVATE_OBJECT_DIR ?? "";

  const opt = await optimizeImage(req.file.buffer, req.file.mimetype);
  if (opt.optimized) {
    req.log.info(
      { before: req.file.buffer.length, after: opt.buffer.length },
      "Image compressed on upload",
    );
  }

  if (privateDir) {
    try {
      const parts = privateDir.replace(/^\//, "").split("/");
      const bucketName = parts[0];
      const dirPath = parts.slice(1).join("/");
      const objectId = randomUUID();
      const objectName = dirPath ? `${dirPath}/uploads/${objectId}` : `uploads/${objectId}`;

      const bucket = objectStorageClient.bucket(bucketName);
      const gcsFile = bucket.file(objectName);
      await gcsFile.save(opt.buffer, {
        contentType: opt.contentType,
        resumable: false,
      });

      res.json({
        url: `/api/storage/product-images/uploads/${objectId}`,
        objectPath: `/objects/uploads/${objectId}`,
      });
      return;
    } catch (err) {
      req.log.warn({ err }, "GCS server-side upload failed, falling back to local filesystem");
    }
  }

  // Fallback: local filesystem
  const ext = opt.optimized
    ? opt.ext
    : path.extname(req.file.originalname || "").toLowerCase() || ".jpg";
  const newName = `${randomUUID()}${ext}`;
  const destPath = path.join(UPLOADS_DIR, newName);
  fs.writeFileSync(destPath, opt.buffer);
  res.json({ url: `/api/storage/local-files/${newName}`, objectPath: null });
});

/**
 * POST /storage/uploads/direct
 *
 * Local filesystem fallback for product image upload when Replit object
 * storage is not configured (e.g. on VPS). Accepts multipart/form-data
 * with a single "file" field. Returns a URL to access the saved image.
 */
router.post("/storage/uploads/direct", requireEditor, localUpload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: "No file provided" });
    return;
  }
  try {
    const buffer = fs.readFileSync(req.file.path);
    const opt = await optimizeImage(buffer, req.file.mimetype);
    if (opt.optimized) {
      req.log.info(
        { before: buffer.length, after: opt.buffer.length },
        "Image compressed on upload",
      );
    }
    const ext = opt.optimized
      ? opt.ext
      : path.extname(req.file.originalname || "").toLowerCase() || ".jpg";
    const newName = `${req.file.filename}${ext}`;
    const newPath = path.join(UPLOADS_DIR, newName);
    fs.writeFileSync(newPath, opt.buffer);
    res.json({ url: `/api/storage/local-files/${newName}` });
  } catch (error) {
    req.log.error({ err: error }, "Error processing uploaded image");
    res.status(500).json({ error: "Failed to process uploaded image" });
  } finally {
    // Always remove the multer temp file, success or failure (ignore ENOENT).
    fs.promises.unlink(req.file.path).catch(() => {});
  }
});

/**
 * GET /storage/local-files/:filename
 *
 * Serve locally uploaded product images (VPS fallback).
 */
router.get("/storage/local-files/:filename", (req: Request, res: Response) => {
  const filename = (req.params as { filename: string }).filename;
  if (!filename || filename.includes("..") || filename.includes("/")) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const filePath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  // Filenames are UUIDs — content never changes for a given name, safe to cache long-term.
  res.setHeader("Cache-Control", "public, max-age=2592000, immutable");
  res.sendFile(filePath);
});

export default router;
