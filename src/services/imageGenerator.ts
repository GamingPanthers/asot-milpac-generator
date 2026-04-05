import PNG = require('pngjs');
import { MemberData } from '../types';
import { config } from '../config';
import logger from '../utils/logger';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { getAssetInfo, getAssetsInfo } from '../lib/mongo';
import { createCanvas, loadImage, registerFont } from 'canvas';

/**
 * Military uniform image generator
 * Generates MILPAC images based on member rank, corps, awards, qualifications, and certificates
 */
export class ImageGeneratorService {

  /**
   * Compose uniform image from assets based on milpac data
   */
  async generateUniform(userId: string, data: MemberData): Promise<Buffer> {
    try {
      logger.info('Starting image generation', { userId, data });

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
      const asset = (folder: string, name: string) =>
        path.join(__dirname, '../../images', folder, `${name}.png`);

      // Compose layers
      const layers: sharp.OverlayOptions[] = [];

      // --- Base Uniform Layer ---
      const { getCollarAsset, getUniformAsset } = require('../config');
      const unitString = data.corps || '';
      const uniformAsset = await getUniformAsset(unitString);
      const uniformPath = asset('uniform', uniformAsset);
      if (fs.existsSync(uniformPath)) {
        layers.unshift({ input: uniformPath, top: 0, left: 0 });
        logger.info('Added uniform base layer', { uniformAsset, uniformPath });
      } else {
        logger.warn('Uniform base asset not found', { uniformAsset, uniformPath });
      }

      // --- Collar Overlay ---
      const collarAsset = await getCollarAsset(unitString);
      const collarPath = asset('uniform', collarAsset);
      if (fs.existsSync(collarPath)) {
        layers.push({ input: collarPath, top: 0, left: 0 });
        logger.info('Added uniform collar layer', { collarAsset, collarPath });
      } else {
        logger.warn('Uniform collar asset not found', { collarAsset, collarPath });
      }

      // --- Rank ---
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
      if (data.awards && data.awards.length > 0) {
        const awardAssets = await getAssetsInfo('milpac_awards', 
          data.awards.map(a => a.name));
        awardAssets.forEach((awardAsset: any, idx: number) => {
          if (awardAsset && awardAsset.assetFile) {
            const awardPath = asset('awards', awardAsset.assetFile);
            const col = idx % 8;
            const row = Math.floor(idx / 8);
            const x = 50 + col * 45;
            const y = 400 + row * 45;
            if (fs.existsSync(awardPath)) {
              layers.push({ input: awardPath, top: y, left: x });
              logger.debug('Added award layer', { award: awardAsset._id, awardPath, x, y });
            }
          }
        });
      }

      // --- Qualifications ---
      if (data.qualifications && data.qualifications.length > 0) {
        const qualAssets = await getAssetsInfo('milpac_qualifications', 
          data.qualifications.map(q => q.qualification));
        qualAssets.forEach((qualAsset: any, idx: number) => {
          if (qualAsset && qualAsset.assetFile) {
            const qualPath = asset('qualifications', qualAsset.assetFile);
            const col = idx % 8;
            const row = Math.floor(idx / 8);
            const x = 50 + col * 45;
            const y = 550 + row * 45;
            if (fs.existsSync(qualPath)) {
              layers.push({ input: qualPath, top: y, left: x });
              logger.debug('Added qualification layer', { qualification: qualAsset._id, qualPath, x, y });
            }
          }
        });
      }

      // --- Certificates ---
      if (data.certificates && data.certificates.length > 0) {
        const certAssets = await getAssetsInfo('milpac_certificates', 
          data.certificates.map(c => c.id));
        certAssets.forEach((certAsset: any, idx: number) => {
          if (certAsset && certAsset.assetFile) {
            const certPath = asset('certificates', certAsset.assetFile);
            const col = idx % 8;
            const row = Math.floor(idx / 8);
            const x = 50 + col * 45;
            const y = 700 + row * 45;
            if (fs.existsSync(certPath)) {
              layers.push({ input: certPath, top: y, left: x });
              logger.debug('Added certificate layer', { certificate: certAsset._id, certPath, x, y });
            }
          }
        });
      }

      // --- Border Frame ---
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
      logger.info('Image generated successfully', { userId, size: final.length });
      return final;
    } catch (error) {
      logger.error('Failed to generate image', { userId, error, data });
      throw error;
    }
  }
}

export default new ImageGeneratorService();

