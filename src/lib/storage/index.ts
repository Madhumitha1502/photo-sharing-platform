import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

// Initialize Cloudinary if credentials are provided
const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export interface UploadResult {
  storageLocation: string;
  storageKey: string;
  fileSize: number;
  width?: number;
  height?: number;
}

export class StorageService {
  /**
   * Upload a photo buffer to cloud object storage (Cloudinary) or local storage fallback.
   * Image binaries are NEVER stored in the database.
   */
  static async uploadPhoto(
    buffer: Buffer,
    filename: string,
    eventId: string
  ): Promise<UploadResult> {
    if (isCloudinaryConfigured) {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `photo-sharing-platform/events/${eventId}`,
            resource_type: "image",
            use_filename: true,
            unique_filename: true,
          },
          (error, result) => {
            if (error || !result) {
              return reject(error || new Error("Cloudinary upload failed"));
            }
            resolve({
              storageLocation: result.secure_url,
              storageKey: result.public_id,
              fileSize: result.bytes,
              width: result.width,
              height: result.height,
            });
          }
        );
        uploadStream.end(buffer);
      });
    }

    // Fallback: Local object storage directory (outside database)
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "events", eventId);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const uniquePrefix = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storedFilename = `${uniquePrefix}-${sanitizedFilename}`;
    const filePath = path.join(uploadsDir, storedFilename);

    await fs.promises.writeFile(filePath, buffer);

    const relativeUrl = `/uploads/events/${eventId}/${storedFilename}`;
    return {
      storageLocation: relativeUrl,
      storageKey: storedFilename,
      fileSize: buffer.length,
    };
  }

  /**
   * Delete a photo from storage
   */
  static async deletePhoto(storageKey: string, eventId?: string): Promise<boolean> {
    if (isCloudinaryConfigured) {
      try {
        const result = await cloudinary.uploader.destroy(storageKey);
        return result.result === "ok";
      } catch (err) {
        console.error("Cloudinary delete error:", err);
        return false;
      }
    }

    if (eventId) {
      try {
        const filePath = path.join(process.cwd(), "public", "uploads", "events", eventId, storageKey);
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
        }
        return true;
      } catch (err) {
        console.error("Local file delete error:", err);
        return false;
      }
    }

    return true;
  }
}
