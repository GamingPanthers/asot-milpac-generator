import fs from 'fs';
import path from 'path';
import { config } from '../config';
import logger from '../utils/logger';

/**
 * File storage service for generated images
 */
export class StorageService {
  private directoryInitialized = false;

  /**
   * Ensure output directory exists (call once at startup)
   */
  ensureOutputDirectory(): void {
    if (this.directoryInitialized) return;
    
    try {
      if (!fs.existsSync(config.IMAGE_OUTPUT_DIR)) {
        fs.mkdirSync(config.IMAGE_OUTPUT_DIR, { recursive: true });
        logger.info('Output directory created', { path: config.IMAGE_OUTPUT_DIR });
      }
      this.directoryInitialized = true;
    } catch (err) {
      logger.error('Failed to create output directory', { path: config.IMAGE_OUTPUT_DIR, error: err instanceof Error ? err.message : err });
      throw err;
    }
  }

  /**
   * Save image to disk
   */
  async saveImage(memberID: string, imageBuffer: Buffer): Promise<string> {
    try {
      // Validate input
      if (!memberID || typeof memberID !== 'string') {
        throw new Error('Invalid memberID provided');
      }
      if (!Buffer.isBuffer(imageBuffer)) {
        throw new Error('Invalid image buffer');
      }

      // Ensure directory exists
      if (!this.directoryInitialized) {
        this.ensureOutputDirectory();
      }

      const filename = `${memberID}.png`;
      const filepath = path.join(config.IMAGE_OUTPUT_DIR, filename);

      // Write file asynchronously
      await fs.promises.writeFile(filepath, imageBuffer);
      logger.info('Image saved', { memberID, filepath, size: imageBuffer.length });

      return filepath;
    } catch (error) {
      logger.error('Failed to save image', { memberID, error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  /**
   * Delete image from disk
   */
  async deleteImage(memberID: string): Promise<boolean> {
    try {
      if (!memberID || typeof memberID !== 'string') {
        logger.warn('Invalid memberID for deletion', { memberID });
        return false;
      }

      const filepath = path.join(config.IMAGE_OUTPUT_DIR, `${memberID}.png`);

      if (fs.existsSync(filepath)) {
        await fs.promises.unlink(filepath);
        logger.info('Image deleted', { memberID, filepath });
        return true;
      }

      logger.debug('Image not found for deletion', { memberID, filepath });
      return false;
    } catch (error) {
      logger.error('Failed to delete image', { memberID, error: error instanceof Error ? error.message : error });
      return false;
    }
  }

  /**
   * Check if image exists
   */
  imageExists(memberID: string): boolean {
    const filepath = path.join(config.IMAGE_OUTPUT_DIR, `${memberID}.png`);
    return fs.existsSync(filepath);
  }

  /**
   * Get image file size
   */
  getImageSize(memberID: string): number | null {
    try {
      const filepath = path.join(config.IMAGE_OUTPUT_DIR, `${memberID}.png`);

      if (fs.existsSync(filepath)) {
        const stats = fs.statSync(filepath);
        return stats.size;
      }

      return null;
    } catch (error) {
      logger.error('Failed to get image size', { memberID, error });
      return null;
    }
  }
}

export default new StorageService();
