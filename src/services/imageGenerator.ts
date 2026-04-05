import { MemberData } from '../types';
import { config } from '../config';
import logger from '../utils/logger';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { getAssetInfo, getAssetsInfo } from '../lib/mongo';
import { createCanvas } from 'canvas';

/**
 * Military uniform image generator
 * Generates MILPAC images based on member rank, corps, awards, qualifications, and certificates
 */
export class ImageGeneratorService {
  /**
   * Validate input data before processing
   */
  private validateData(data: MemberData): boolean {
    if (!data) {
      logger.warn('Missing member data for image generation');
      return false;
    }
    if (typeof data !== 'object') {
      logger.warn('Invalid member data type');
      return false;
    }
    return true;
  }

  /**
   * Compose uniform image from assets based on milpac data
   */
  async generateUniform(userId: string, data: MemberData): Promise<Buffer> {
    try {
      // Validate input
      if (!userId || !this.validateData(data)) {
        throw new Error('Invalid input: userId and data are required');
      }

      logger.info('Starting image generation', { userId });

      // Base canvas
      const width = config.IMAGE_WIDTH;
      const height = config.IMAGE_HEIGHT;
      logger.debug('Canvas dimensions', { width, height });
      const base = sharp({
        create: {
          width,
          height,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
      });

      // Helper to resolve asset path
      const asset = (folder: string, name: string) => {
        const assetPath = path.join(__dirname, '../../images', folder, `${name}.png`);
        if (!fs.existsSync(assetPath)) {
          logger.warn('Asset file not found', { folder, name, path: assetPath });
          return null;
        }
        return assetPath;
      };

      // Compose layers
      const layers: sharp.OverlayOptions[] = [];

      // --- Base Uniform Layer ---
      const uniformAsset = data.corps && data.corps.length > 0 ? data.corps : 'default';
      const uniformPath = asset('uniform', uniformAsset);
      if (uniformPath) {
        layers.unshift({ input: uniformPath, top: 0, left: 0 });
        logger.info('Added uniform base layer', { uniform: uniformAsset });
      } else {
        logger.warn('Uniform base asset not found', { uniform: uniformAsset });
      }

      // --- Rank ---
      if (data.rank && typeof data.rank === 'string' && data.rank.trim().length > 0) {
        const rankAsset = await getAssetInfo('milpac_ranks', data.rank);
        if (rankAsset && rankAsset.assetFile) {
          const rankPath = asset('ranks', rankAsset.assetFile);
          if (rankPath) {
            layers.push({ input: rankPath, top: 100, left: 50 });
            logger.info('Added rank layer', { rank: data.rank });
          }
        } else {
          logger.warn('Rank asset not found in database', { rank: data.rank });
        }
      }

      // --- Name Display ---
      if (data.name && typeof data.name === 'string' && data.name.trim() !== '') {
        logger.info('Preparing to add name display', { name: data.name });
        const nameText = data.name.trim().toUpperCase();
        const nameWidth = 200;
        const nameHeight = 60;
        const fontSize = 32;
        const canvas = createCanvas(nameWidth, nameHeight);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, nameWidth, nameHeight);
        ctx.font = `bold ${fontSize}px 'Arial'`;
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(nameText, nameWidth / 2, nameHeight / 2);
        logger.info('Drew name text', { name: nameText, fontSize });
        layers.push({ input: canvas.toBuffer('image/png'), top: 800, left: 50 });
      }

      // --- Awards ---
      if (Array.isArray(data.awards) && data.awards.length > 0) {
        try {
          const awardAssets = await getAssetsInfo('milpac_awards', 
            data.awards.map(a => (typeof a === 'string' ? a : a.name) || '').filter(Boolean));
          awardAssets.forEach((awardAsset: any, idx: number) => {
            if (awardAsset && awardAsset.assetFile) {
              const awardPath = asset('awards', awardAsset.assetFile);
              if (awardPath) {
                const col = idx % 8;
                const row = Math.floor(idx / 8);
                const x = 50 + col * 45;
                const y = 400 + row * 45;
                layers.push({ input: awardPath, top: y, left: x });
                logger.debug('Added award layer', { award: awardAsset._id, x, y });
              }
            }
          });
        } catch (err) {
          logger.warn('Failed to process awards', { error: err instanceof Error ? err.message : err });
        }
      }

      // --- Qualifications ---
      if (Array.isArray(data.qualifications) && data.qualifications.length > 0) {
        try {
          const qualAssets = await getAssetsInfo('milpac_qualifications', 
            data.qualifications.map(q => (typeof q === 'string' ? q : q.qualification) || '').filter(Boolean));
          qualAssets.forEach((qualAsset: any, idx: number) => {
            if (qualAsset && qualAsset.assetFile) {
              const qualPath = asset('qualifications', qualAsset.assetFile);
              if (qualPath) {
                const col = idx % 8;
                const row = Math.floor(idx / 8);
                const x = 50 + col * 45;
                const y = 550 + row * 45;
                layers.push({ input: qualPath, top: y, left: x });
                logger.debug('Added qualification layer', { qualification: qualAsset._id, x, y });
              }
            }
          });
        } catch (err) {
          logger.warn('Failed to process qualifications', { error: err instanceof Error ? err.message : err });
        }
      }

      // --- Certificates ---
      if (Array.isArray(data.certificates) && data.certificates.length > 0) {
        try {
          const certAssets = await getAssetsInfo('milpac_certificates', 
            data.certificates.map(c => (typeof c === 'string' ? c : c.id) || '').filter(Boolean));
          certAssets.forEach((certAsset: any, idx: number) => {
            if (certAsset && certAsset.assetFile) {
              const certPath = asset('certificates', certAsset.assetFile);
              if (certPath) {
                const col = idx % 8;
                const row = Math.floor(idx / 8);
                const x = 50 + col * 45;
                const y = 700 + row * 45;
                layers.push({ input: certPath, top: y, left: x });
                logger.debug('Added certificate layer', { certificate: certAsset._id, x, y });
              }
            }
          });
        } catch (err) {
          logger.warn('Failed to process certificates', { error: err instanceof Error ? err.message : err });
        }
      }

      // --- Border Frame ---
      const framePath = asset('border', 'border');
      if (framePath) {
        layers.push({ input: framePath, top: 0, left: 0 });
        logger.info('Added border frame layer');
      }

      logger.info('Compositing layers', { layerCount: layers.length });
      // Composite all layers
      const final = await base.composite(layers).png().toBuffer();
      logger.info('Image generated successfully', { userId, size: final.length });
      return final;
    } catch (error) {
      logger.error('Failed to generate image', { userId, error: error instanceof Error ? error.message : error });
      throw error;
    }
  }
}

export default new ImageGeneratorService();

