import fs from 'fs';
import path from 'path';
import { config } from '../config';
import logger from '../utils/logger';

/**
 * File storage service for generated images
 */
export class StorageService {
  /**
   * Ensure output directory exists
   */
  ensureOutputDirectory(): void {
    if (!fs.existsSync(config.IMAGE_OUTPUT_DIR)) {
      fs.mkdirSync(config.IMAGE_OUTPUT_DIR, { recursive: true });
      logger.info('Output directory created', { path: config.IMAGE_OUTPUT_DIR });
    }
  }

  /**
   * Save image to disk
   */
  async saveImage(memberID: string, imageBuffer: Buffer): Promise<string> {
    try {
      this.ensureOutputDirectory();

      const filename = `${memberID}.png`;
      const filepath = path.join(config.IMAGE_OUTPUT_DIR, filename);

      fs.writeFileSync(filepath, imageBuffer);
      logger.info('Image saved', { memberID, filepath, size: imageBuffer.length });

      return filepath;
    } catch (error) {
      logger.error('Failed to save image', { memberID, error });
      throw error;
    }
  }

  /**
   * Delete image from disk
   */
  async deleteImage(memberID: string): Promise<boolean> {
    try {
      const filepath = path.join(config.IMAGE_OUTPUT_DIR, `${memberID}.png`);

      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        logger.info('Image deleted', { memberID, filepath });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to delete image', { memberID, error });
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
