// @ts-ignore
import { PNG } from 'pngjs';
import { MemberData } from '../types';
import { config } from '../config';
import logger from '../utils/logger';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { getAssetInfo, getAssetsInfo } from '../lib/mongo';

/**
 * Military uniform image generator using pngjs
 * Simplified implementation that generates basic PNG images
 */
export class ImageGeneratorService {

  /**
   * Compose uniform image from assets based on milpac data
   */
  async generateUniform(memberID: string, data: MemberData): Promise<Buffer> {
    try {
      logger.info('Starting image generation', { memberID, data });

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

      // DB-driven: mapAssetId will be replaced by DB lookups

      // Helper to resolve asset path
      const asset = (folder: string, name: string) =>
        path.join(__dirname, '../../images', folder, `${name}.png`);

      // Compose layers
      const layers: sharp.OverlayOptions[] = [];

      // Rank
      if (data.rank) {
        const rankAsset = await getAssetInfo('milpac_ranks', data.rank);
        if (rankAsset && rankAsset.assetFile) {
          const rankPath = asset('ranks', rankAsset.assetFile);
          logger.info('Adding rank layer', { rank: data.rank, rankPath });
          if (fs.existsSync(rankPath)) {
            layers.push({ input: rankPath, top: 100, left: 50 });
          } else {
            logger.warn('Rank asset not found', { rank: data.rank, rankPath });
          }
        }
      }

      // Badge (corps-badges)
      if (data.badge) {
        const badgeAsset = await getAssetInfo('milpac_badges', data.badge);
        if (badgeAsset && badgeAsset.assetFile) {
          const badgePath = asset('corps-badges', badgeAsset.assetFile);
          logger.info('Adding badge layer', { badge: data.badge, badgePath });
          if (fs.existsSync(badgePath)) {
            layers.push({ input: badgePath, top: 800, left: 50 });
          } else {
            logger.warn('Badge asset not found', { badge: data.badge, badgePath });
          }
        }
      }

      // Medals (medallions)
      if (data.medallions && data.medallions.length > 0) {
        const medallionAssets = await getAssetsInfo('milpac_medallions', data.medallions);
        medallionAssets.forEach((medalAsset: any, idx: number) => {
          if (medalAsset && medalAsset.assetFile) {
            const medalPath = asset('medallions', medalAsset.assetFile);
            const col = idx % 8;
            const row = Math.floor(idx / 8);
            const x = 50 + col * 45;
            const y = 250 + row * 45;
            layers.push({ input: medalPath, top: y, left: x });
            logger.debug('Added medallion layer', { medal: medalAsset._id, medalPath, x, y });
          }
        });
      }

      // Citations (ribbons)
      if (data.citations && data.citations.length > 0) {
        const citationAssets = await getAssetsInfo('milpac_citations', data.citations);
        citationAssets.forEach((citationAsset: any, idx: number) => {
          if (citationAsset && citationAsset.assetFile) {
            const citationPath = asset('ribbons', citationAsset.assetFile);
            const col = idx % 8;
            const row = Math.floor(idx / 8);
            const x = 50 + col * 45;
            const y = 550 + row * 25;
            layers.push({ input: citationPath, top: y, left: x });
            logger.debug('Added citation layer', { citation: citationAsset._id, citationPath, x, y });
          }
        });
      }

      // Rifleman Badge (corps-badges)
      if (data.RifleManBadge) {
        const rifleAsset = await getAssetInfo('milpac_badges', data.RifleManBadge);
        if (rifleAsset && rifleAsset.assetFile) {
          const riflePath = asset('corps-badges', rifleAsset.assetFile);
          logger.info('Adding rifleman badge layer', { RifleManBadge: data.RifleManBadge, riflePath });
          if (fs.existsSync(riflePath)) {
            layers.push({ input: riflePath, top: 900, left: 50 });
          } else {
            logger.warn('Rifleman badge asset not found', { RifleManBadge: data.RifleManBadge, riflePath });
          }
        }
      }

      // Training Medals
      if (data.TrainingMedals && data.TrainingMedals.length > 0) {
        const trainingAssets = await getAssetsInfo('milpac_training_medals', data.TrainingMedals);
        trainingAssets.forEach((medalAsset: any, idx: number) => {
          if (medalAsset && medalAsset.assetFile) {
            const trainPath = asset('training', medalAsset.assetFile);
            layers.push({ input: trainPath, top: 950, left: 50 + idx * 50 });
            logger.debug('Added training medal layer', { medal: medalAsset._id, trainPath, idx });
          }
        });
      }

      // Uniform/collar logic would also be DB-driven (not shown here)
      let unitString = '';
      if (data.badge && typeof data.badge === 'string' && data.badge.trim() !== '') {
        unitString = data.badge;
      } else if (data.Uniform && typeof data.Uniform === 'string' && data.Uniform.trim() !== '') {
        unitString = data.Uniform;
      }
      const { getCollarAsset, getUniformAsset } = require('../config');
      const collarAsset = getCollarAsset(unitString);
      const uniformAsset = getUniformAsset(unitString);
      const uniformPath = asset('uniform', uniformAsset);
      if (fs.existsSync(uniformPath)) {
        layers.unshift({ input: uniformPath, top: 0, left: 0 });
        logger.info('Added uniform base layer (bottom)', { uniformAsset, uniformPath });
      } else {
        logger.warn('Uniform base asset not found', { uniformAsset, uniformPath });
      }
      // Collar overlay (if present)
      const collarPath = asset('uniform', collarAsset);
      if (fs.existsSync(collarPath)) {
        layers.push({ input: collarPath, top: 0, left: 0 });
        logger.info('Added uniform collar layer', { collarAsset, collarPath });
      } else {
        logger.warn('Uniform collar asset not found', { collarAsset, collarPath });
      }

      // Overlay border frame if present
      const framePath = path.join(__dirname, '../../images/border.png');
      if (fs.existsSync(framePath)) {
        layers.push({ input: framePath, top: 0, left: 0 });
        logger.info('Added border frame layer', { framePath });
      } else {
        logger.warn('Border frame asset not found', { framePath });
      }

      logger.info('Compositing all layers', { layerCount: layers.length });
      // Composite all layers
      const final = await base.composite(layers).png().toBuffer();
      logger.info('Image generated successfully (composite)', { memberID, size: final.length });
      return final;
    } catch (error) {
      logger.error('Failed to generate image (composite)', { memberID, error, data });
      throw error;
    }
  }
}

export default new ImageGeneratorService();
