// @ts-ignore
import { PNG } from 'pngjs';
import { MemberData } from '../types';
import { config } from '../config';
import { milpacFieldMap } from '../config/milpacFieldMap';
import logger from '../utils/logger';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

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

      // Helper to map database value to asset ID using the mapping file
      const mapAssetId = (dbValue: string) => {
        if (!Array.isArray(milpacFieldMap)) {
          logger.warn('milpacFieldMap is not defined or not an array, falling back to dbValue', { dbValue });
          return dbValue;
        }
        const mapping = milpacFieldMap.find(m => m && (m.dbId === dbValue || (Array.isArray(m.aliases) && m.aliases.includes(dbValue))));
        if (!mapping) {
          logger.warn('No mapping found for dbValue, falling back to dbValue', { dbValue });
        }
        return mapping ? mapping.generatorId : dbValue;
      };

      // Helper to resolve asset path
      const asset = (folder: string, name: string) =>
        path.join(__dirname, '../../images', folder, `${name}.png`);

      // Compose layers
      const layers: sharp.OverlayOptions[] = [];

      // Rank
      if (data.rank) {
        const rankAssetId = mapAssetId(data.rank);
        const rankPath = asset('ranks', rankAssetId);
        logger.info('Adding rank layer', { rank: data.rank, rankAssetId, rankPath });
        if (fs.existsSync(rankPath)) {
          layers.push({ input: rankPath, top: 100, left: 50 });
        } else {
          logger.warn('Rank asset not found', { rank: data.rank, rankAssetId, rankPath });
        }
      }

      // Badge (corps-badges)
      if (data.badge) {
        const badgeAssetId = mapAssetId(data.badge);
        const badgePath = asset('corps-badges', badgeAssetId);
        logger.info('Adding badge layer', { badge: data.badge, badgeAssetId, badgePath });
        if (fs.existsSync(badgePath)) {
          layers.push({ input: badgePath, top: 800, left: 50 });
        } else {
          logger.warn('Badge asset not found', { badge: data.badge, badgeAssetId, badgePath });
        }
      }

      // Medals (medallions)
      if (data.medallions && data.medallions.length > 0) {
        const medalConfig = { x: 50, y: 250, spacing: 5, maxColumns: 8 };
        logger.info('Adding medallion layers', { medallions: data.medallions });
        data.medallions.forEach((medal, idx) => {
          const medalAssetId = mapAssetId(medal);
          const medalPath = asset('medallions', medalAssetId);
          if (fs.existsSync(medalPath)) {
            const col = idx % medalConfig.maxColumns;
            const row = Math.floor(idx / medalConfig.maxColumns);
            const x = medalConfig.x + col * (40 + medalConfig.spacing);
            const y = medalConfig.y + row * (40 + medalConfig.spacing);
            layers.push({ input: medalPath, top: y, left: x });
            logger.debug('Added medallion layer', { medal, medalAssetId, medalPath, x, y });
          } else {
            logger.warn('Medallion asset not found', { medal, medalAssetId, medalPath });
          }
        });
      }

      // Citations (ribbons)
      if (data.citations && data.citations.length > 0) {
        const citationConfig = { x: 50, y: 550, spacing: 5, maxColumns: 8 };
        logger.info('Adding citation layers', { citations: data.citations });
        data.citations.forEach((citation, idx) => {
          const citationAssetId = mapAssetId(citation);
          const citationPath = asset('ribbons', citationAssetId);
          if (fs.existsSync(citationPath)) {
            const col = idx % citationConfig.maxColumns;
            const row = Math.floor(idx / citationConfig.maxColumns);
            const x = citationConfig.x + col * (40 + citationConfig.spacing);
            const y = citationConfig.y + row * (40 + citationConfig.spacing);
            layers.push({ input: citationPath, top: y, left: x });
            logger.debug('Added citation layer', { citation, citationAssetId, citationPath, x, y });
          } else {
            logger.warn('Citation asset not found', { citation, citationAssetId, citationPath });
          }
        });
      }

      // Rifleman Badge (corps-badges)
      if (data.RifleManBadge) {
        const rifleAssetId = mapAssetId(data.RifleManBadge);
        const riflePath = asset('corps-badges', rifleAssetId);
        logger.info('Adding rifleman badge layer', { RifleManBadge: data.RifleManBadge, rifleAssetId, riflePath });
        if (fs.existsSync(riflePath)) {
          layers.push({ input: riflePath, top: 900, left: 50 });
        } else {
          logger.warn('Rifleman badge asset not found', { RifleManBadge: data.RifleManBadge, rifleAssetId, riflePath });
        }
      }

      // Training Medals
      if (data.TrainingMedals && data.TrainingMedals.length > 0) {
        logger.info('Adding training medal layers', { TrainingMedals: data.TrainingMedals });
        data.TrainingMedals.forEach((medal, idx) => {
          const trainAssetId = mapAssetId(medal);
          const trainPath = asset('training', trainAssetId);
          if (fs.existsSync(trainPath)) {
            layers.push({ input: trainPath, top: 950, left: 50 + idx * 50 });
            logger.debug('Added training medal layer', { medal, trainAssetId, trainPath, idx });
          } else {
            logger.warn('Training medal asset not found', { medal, trainAssetId, trainPath });
          }
        });
      }

      // Uniform collar (use getCollarAsset from config)
      let unitString = '';
      if ('unit' in data && typeof (data as any).unit === 'string') {
        unitString = (data as any).unit;
      } else if (data.Uniform && typeof data.Uniform === 'string') {
        unitString = data.Uniform;
      } else if (data.badge && typeof data.badge === 'string') {
        unitString = data.badge;
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
