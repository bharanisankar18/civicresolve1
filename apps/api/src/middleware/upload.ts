import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { BadRequestError } from "../utils/errors";
import { env } from "../config/env";

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

const storage = multer.memoryStorage();

export const uploadMemory = multer({
  storage,
  limits: {
    fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const filename = file.originalname || "image.jpg";
    const ext = path.extname(filename).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(
        new BadRequestError(
          `Unsupported file format or extension. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
        ),
      );
      return;
    }
    cb(null, true);
  },
});

/**
 * Validates binary magic-byte header signatures to reject spoofed MIME types.
 */
function isValidImageMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  // JPEG: FF D8 FF
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  // PNG: 89 50 4E 47
  const isPng =
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  // WebP: RIFF .... WEBP
  const isWebp =
    buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";

  return isJpeg || isPng || isWebp;
}

/**
 * Strips EXIF metadata (privacy/security: eliminates camera GPS coordinates),
 * validates magic bytes, prevents decompression bombs,
 * resizes to max 1280px width/height, and compresses as clean JPEG.
 */
export async function sanitizeAndSaveImage(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.file) {
    next();
    return;
  }

  // Magic-byte binary verification
  if (!isValidImageMagicBytes(req.file.buffer)) {
    next(new BadRequestError("Invalid image header: corrupted file or spoofed MIME type"));
    return;
  }

  try {
    const filename = `${crypto.randomUUID()}.jpg`;
    const outputPath = path.join(UPLOAD_DIR, filename);

    await sharp(req.file.buffer, { limitInputPixels: 16000000 })
      .rotate() // auto-orient based on EXIF before stripping
      .resize(1280, 1280, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85, mozjpeg: true })
      .toFile(outputPath);

    // Save relative accessible URL
    req.body.imageUrl = `/uploads/${filename}`;
    next();
  } catch (_err) {
    next(new BadRequestError("Failed to process image attachment"));
  }
}
