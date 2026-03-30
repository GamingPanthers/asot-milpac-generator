import { PNG } from 'pngjs';
import { MemberData } from '../types';
import { config } from '../config';
import logger from '../utils/logger';

/**
 * Military uniform image generator using pngjs
 * Simplified implementation that generates basic PNG images
 */
export class ImageGeneratorService {

  /**
   * Generate military uniform image
   */
  async generateUniform(memberID: string, data: MemberData): Promise<Buffer> {
    try {
      // Create a basic PNG image
      const png = new PNG({
        width: config.IMAGE_WIDTH,
        height: config.IMAGE_HEIGHT,
        colorType: 2, // RGB
      });

      // Get uniform color
      const colorMap: { [key: string]: { r: number; g: number; b: number } } = {
        Blue: { r: 0, g: 51, b: 204 },
        Green: { r: 0, g: 102, b: 0 },
        Desert: { r: 204, g: 170, b: 102 },
        White: { r: 238, g: 238, b: 238 },
      };

      const color = colorMap[data.Uniform] || { r: 0, g: 51, b: 204 };

      // Fill background white
      for (let y = 0; y < png.height; y++) {
        for (let x = 0; x < png.width; x++) {
          const idx = (png.width * y + x) << 2;
          png.data[idx] = 255; // R
          png.data[idx + 1] = 255; // G
          png.data[idx + 2] = 255; // B
          png.data[idx + 3] = 255; // A
        }
      }

      // Draw uniform area (colored rectangle)
      const uniformTop = 50;
      const uniformHeight = 600;
      const uniformLeft = 100;
      const uniformWidth = 1200;

      for (let y = uniformTop; y < uniformTop + uniformHeight; y++) {
        for (let x = uniformLeft; x < uniformLeft + uniformWidth; x++) {
          if (x >= 0 && x < png.width && y >= 0 && y < png.height) {
            const idx = (png.width * y + x) << 2;
            png.data[idx] = color.r; // R
            png.data[idx + 1] = color.g; // G
            png.data[idx + 2] = color.b; // B
            png.data[idx + 3] = 255; // A
          }
        }
      }

      // Add medals as small colored squares
      let medalX = 50;
      let medalY = 250;
      const medalSize = 40;

      if (data.medallions && data.medallions.length > 0) {
        data.medallions.forEach((medal, idx) => {
          const medalColor = this.getMedalColor(medal);
          const x = medalX + idx * (medalSize + 5);
          const y = medalY;

          for (let dy = 0; dy < medalSize; dy++) {
            for (let dx = 0; dx < medalSize; dx++) {
              if (x + dx < png.width && y + dy < png.height) {
                const pixelIdx = (png.width * (y + dy) + (x + dx)) << 2;
                png.data[pixelIdx] = medalColor.r;
                png.data[pixelIdx + 1] = medalColor.g;
                png.data[pixelIdx + 2] = medalColor.b;
                png.data[pixelIdx + 3] = 255;
              }
            }
          }
        });
      }

      // Convert PNG to buffer
      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];

        const stream = png
          .pack()
          .on('data', (chunk) => {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          })
          .on('end', () => {
            const buffer = Buffer.concat(chunks);
            logger.info('Image generated successfully', { memberID, size: buffer.length });
            resolve(buffer);
          })
          .on('error', (error) => {
            logger.error('PNG encoding error', { error });
            reject(error);
          });
      });
    } catch (error) {
      logger.error('Failed to generate image', { memberID, error });
      throw error;
    }
  }

  /**
   * Get medal color
   */
  private getMedalColor(medal: string): { r: number; g: number; b: number } {
    const colors: { [key: string]: { r: number; g: number; b: number } } = {
      Service: { r: 255, g: 215, b: 0 }, // Gold
      Valor: { r: 255, g: 107, b: 107 }, // Red
      Commendation: { r: 78, g: 205, b: 196 }, // Teal
      Achievement: { r: 69, g: 183, b: 209 }, // Blue
    };

    return colors[medal] || { r: 200, g: 200, b: 200 }; // Gray default
  }

  /**
   * Generate minimal placeholder image (for testing)
   */
  async generatePlaceholder(memberID: string, name: string): Promise<Buffer> {
    try {
      const png = new PNG({
        width: config.IMAGE_WIDTH,
        height: config.IMAGE_HEIGHT,
        colorType: 2,
      });

      // White background
      for (let y = 0; y < png.height; y++) {
        for (let x = 0; x < png.width; x++) {
          const idx = (png.width * y + x) << 2;
          png.data[idx] = 255;
          png.data[idx + 1] = 255;
          png.data[idx + 2] = 255;
          png.data[idx + 3] = 255;
        }
      }

      // Add border (black lines)
      for (let x = 0; x < png.width; x++) {
        // Top border
        const topIdx = x << 2;
        png.data[topIdx] = 0;
        png.data[topIdx + 1] = 0;
        png.data[topIdx + 2] = 0;
        png.data[topIdx + 3] = 255;

        // Bottom border
        const bottomIdx = (png.width * (png.height - 1) + x) << 2;
        png.data[bottomIdx] = 0;
        png.data[bottomIdx + 1] = 0;
        png.data[bottomIdx + 2] = 0;
        png.data[bottomIdx + 3] = 255;
      }

      for (let y = 0; y < png.height; y++) {
        // Left border
        const leftIdx = (png.width * y) << 2;
        png.data[leftIdx] = 0;
        png.data[leftIdx + 1] = 0;
        png.data[leftIdx + 2] = 0;
        png.data[leftIdx + 3] = 255;

        // Right border
        const rightIdx = (png.width * y + (png.width - 1)) << 2;
        png.data[rightIdx] = 0;
        png.data[rightIdx + 1] = 0;
        png.data[rightIdx + 2] = 0;
        png.data[rightIdx + 3] = 255;
      }

      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];

        png
          .pack()
          .on('data', (chunk) => {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          })
          .on('end', () => {
            const buffer = Buffer.concat(chunks);
            logger.info('Placeholder image generated', { memberID, size: buffer.length });
            resolve(buffer);
          })
          .on('error', (error) => {
            logger.error('PNG encoding error', { error });
            reject(error);
          });
      });
    } catch (error) {
      logger.error('Failed to generate placeholder', { memberID, error });
      throw error;
    }
  }
}

export default new ImageGeneratorService();
