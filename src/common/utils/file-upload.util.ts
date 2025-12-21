import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

// Allowed image extensions and MIME types
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Create uploads/cars directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads', 'cars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Multer storage configuration for car images
 * Best Practices:
 * - Generate unique filenames to prevent collisions
 * - Organize uploads in dedicated directory
 * - Preserve original file extensions
 */
export const carImageStorage = diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadsDir);
  },
  filename: (req, file, callback) => {
    // Format: timestamp-uuid-original-extension
    const timestamp = Date.now();
    const uniqueId = uuid();
    const ext = extname(file.originalname).toLowerCase();
    const filename = `${timestamp}-${uniqueId}${ext}`;
    callback(null, filename);
  },
});

/**
 * File filter for image uploads only
 * Validates file extension and MIME type
 */
export const imageFileFilter = (req, file, callback) => {
  const ext = extname(file.originalname).toLowerCase();

  // Check extension
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    return callback(
      new Error('Only JPG, PNG, and WebP images are allowed!'),
      false,
    );
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return callback(new Error('Invalid image MIME type!'), false);
  }

  callback(null, true);
};

/**
 * Image upload limits configuration
 * Best Practices:
 * - Limit file size to prevent abuse
 * - Limit number of files per upload
 */
export const imageUploadLimits = {
  fileSize: MAX_FILE_SIZE,
  files: 5, // Maximum 5 images per upload
};

/**
 * Delete image file from disk
 * @param imagePath - Relative path from uploads directory
 */
export const deleteImageFile = (imagePath: string): void => {
  try {
    if (imagePath.includes('http')) {
      // Skip deletion if it's an external URL
      return;
    }

    const filename = imagePath.split('/').pop();
    if (!filename) {
      console.warn('Invalid image path:', imagePath);
      return;
    }

    const fullPath = path.join(uploadsDir, filename);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (error) {
    console.error('Error deleting image file:', error);
  }
};

/**
 * Get absolute path for image
 * @param filename - Image filename
 * @returns Full path to image
 */
export const getImageAbsolutePath = (filename: string): string => {
  return path.join(uploadsDir, filename);
};

/**
 * Get relative path for image storage in DB
 * @param filename - Image filename
 * @returns Relative path (e.g., 'cars/timestamp-uuid.jpg')
 */
export const getImageRelativePath = (filename: string): string => {
  return `cars/${filename}`;
};