import { MemberData } from '../types';
import { config } from '../config';
import logger from '../utils/logger';
import { createCanvas, loadImage } from 'canvas';
import path from 'path';
import fs from 'fs';
import { getAssetsInfo } from '../lib/mongo';
import milpacData from './milpacData';

/**
 * Military uniform image generator
 * Generates MILPAC images based on member rank, corps, awards, qualifications, and certificates
 */
export class UniformGeneratorService {
/**
 * Map corps to uniform colors
   * Supports both full names ("Infantry Corp") and abbreviated names ("Infantry")
   */
  private corpsToUniformMap: { [key: string]: string } = {
    // Blue Uniform
    'Army Aviation': 'blue_uniform',
    'Army Aviation Corp': 'blue_uniform',
    'Aviation': 'blue_uniform',
    
    // Brown Uniform
    'Infantry': 'brown_uniform',
    'Infantry Corp': 'brown_uniform',
    'Engineering': 'brown_uniform',
    'Engineers': 'brown_uniform',
    'Engineers Corp': 'brown_uniform',
    'Engineering Corp': 'brown_uniform',
    'Artillery': 'brown_uniform',
    'Artillery Corp': 'brown_uniform',
    'Armor': 'brown_uniform',
    'Armour': 'brown_uniform',
    'Armour Corp': 'brown_uniform',
    'Armor Corp': 'brown_uniform',
    'Medical': 'brown_uniform',
    'Medical Corp': 'brown_uniform',
    'Support': 'brown_uniform',
    'Support Corp': 'brown_uniform',
    'Command': 'brown_uniform',
    'Command Corp': 'brown_uniform',
    'Zeus': 'brown_uniform',
    'Zeus Corp': 'brown_uniform'
  };

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

        logger.info('Starting image generation', { userId, dataKeys: Object.keys(data), corps: data.corps, rank: data.rank });

    // Create canvas (1398 x 1000 like the original)
    const width = 1398;
    const height = 1000;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // --- Base Uniform Layer ---
    // Determine uniform color based on corps
    let uniformAsset = 'blue_uniform'; // default to blue
    if (data.corps && typeof data.corps === 'string' && data.corps.trim().length > 0) {
        uniformAsset = this.corpsToUniformMap[data.corps] || 'blue_uniform';
        logger.info('Corps found, mapping to uniform', { corps: data.corps, uniform: uniformAsset });
    } else {
        logger.info('No corps provided, using default blue uniform', { corps: data.corps, corpsType: typeof data.corps });
    }
    
    const uniformPath = path.join(__dirname, '../../images', 'uniform', `${uniformAsset}.png`);
    
    if (fs.existsSync(uniformPath)) {
        const uniformImage = await loadImage(uniformPath);
        ctx.drawImage(uniformImage, 0, 0, width, height);
        logger.info('Added uniform base layer', { uniform: uniformAsset, corps: data.corps });
    } else {
        logger.warn('Uniform base asset not found, using navy fallback', { uniform: uniformAsset, corps: data.corps });
        ctx.fillStyle = '#001f4d';
        ctx.fillRect(0, 0, width, height);
    }

    // --- Rank ---
    if (data.rank && typeof data.rank === 'string' && data.rank.trim().length > 0) {
        const rankInfo = milpacData.getRank(data.rank);
        if (rankInfo && rankInfo.code) {
        const rankPath = path.join(__dirname, '../../images', 'ranks', `${rankInfo.code}.png`);
        if (fs.existsSync(rankPath)) {
            const rankImage = await loadImage(rankPath);
            ctx.drawImage(rankImage, 0, 0, width, height);
            logger.info('Added rank layer', { rank: data.rank, code: rankInfo.code });
        } else {
            logger.warn('Rank image file not found', { rank: data.rank, code: rankInfo.code });
        }
        } else {
        logger.warn('Rank not found in MILPAC data', { rank: data.rank });
        }
    }

    // --- Qualifications (Training Badges) - LEFT SIDE ---
    if (Array.isArray(data.qualifications) && data.qualifications.length > 0) {
        try {
        const qualAssets = await getAssetsInfo('milpac_qualifications', 
            data.qualifications.map(q => (typeof q === 'string' ? q : q.qualification) || '').filter(Boolean));
        
        const qualAssets2 = await Promise.all(
            qualAssets.map(async (qualAsset: any) => {
            if (qualAsset && qualAsset.assetFile) {
                const qualPath = path.join(__dirname, '../../images', 'qualifications', `${qualAsset.assetFile}.png`);
                if (fs.existsSync(qualPath)) {
                return { assetFile: qualAsset.assetFile, path: qualPath };
                }
            }
            return null;
            })
        );
        
        let yPos = 180;
        for (const qual of qualAssets2) {
            if (qual) {
            const img = await loadImage(qual.path);
            ctx.drawImage(img, 50, yPos, 80, 80);
            logger.debug('Added qualification layer', { file: qual.assetFile, y: yPos });
            yPos += 100;
            }
        }
        } catch (err) {
        logger.warn('Failed to process qualifications', { error: err instanceof Error ? err.message : err });
        }
    }

    // --- Certificates/Citations (Ribbons) - RIGHT SIDE ---
    if (Array.isArray(data.certificates) && data.certificates.length > 0) {
        try {
        const certAssets = await getAssetsInfo('milpac_certificates', 
            data.certificates.map(c => (typeof c === 'string' ? c : c.id) || '').filter(Boolean));
        
        const certAssets2 = await Promise.all(
            certAssets.map(async (certAsset: any) => {
            if (certAsset && certAsset.assetFile) {
                const certPath = path.join(__dirname, '../../images', 'certificates', `${certAsset.assetFile}.png`);
                if (fs.existsSync(certPath)) {
                return { assetFile: certAsset.assetFile, path: certPath };
                }
            }
            return null;
            })
        );
        
        let yPos = 180;
        for (const cert of certAssets2) {
            if (cert) {
            const img = await loadImage(cert.path);
            ctx.drawImage(img, 1268, yPos, 80, 80);
            logger.debug('Added certificate layer', { file: cert.assetFile, y: yPos });
            yPos += 100;
            }
        }
        } catch (err) {
        logger.warn('Failed to process certificates', { error: err instanceof Error ? err.message : err });
        }
    }

    // --- Medals (Awards) - CENTER BOTTOM ---
    if (Array.isArray(data.awards) && data.awards.length > 0) {
        try {
        const awardAssets = await getAssetsInfo('milpac_awards', 
            data.awards.map(a => (typeof a === 'string' ? a : a.name) || '').filter(Boolean));
        
        const awardAssets2 = await Promise.all(
            awardAssets.map(async (awardAsset: any) => {
            if (awardAsset && awardAsset.assetFile) {
                const awardPath = path.join(__dirname, '../../images', 'awards', `${awardAsset.assetFile}.png`);
                if (fs.existsSync(awardPath)) {
                return { assetFile: awardAsset.assetFile, path: awardPath };
                }
            }
            return null;
            })
        );
        
        let xPos = 250;
        let yPos = 500;
        let colCount = 0;
        
        for (const award of awardAssets2) {
            if (award) {
            const img = await loadImage(award.path);
            ctx.drawImage(img, xPos, yPos, 100, 100);
            logger.debug('Added award layer', { file: award.assetFile, x: xPos, y: yPos });
            
            xPos += 150;
            colCount++;
            if (colCount >= 7) {
                colCount = 0;
                xPos = 250;
                yPos += 150;
            }
            }
        }
        } catch (err) {
        logger.warn('Failed to process awards', { error: err instanceof Error ? err.message : err });
        }
    }

    // --- Border Frame ---
    const borderPath = path.join(__dirname, '../../images', 'border.png');
    if (fs.existsSync(borderPath)) {
        const borderImage = await loadImage(borderPath);
        ctx.drawImage(borderImage, 0, 0, width, height);
        logger.info('Added border frame layer');
    } else {
        logger.warn('Border frame not found', { path: borderPath });
    }

    // --- Name Display (drawn LAST so it appears on top) ---
    if (data.name && typeof data.name === 'string' && data.name.trim() !== '') {
        const nameText = data.name.trim().toUpperCase();
        
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        // Dynamically size font to fit
        let size = ctx.measureText(nameText).width;
        let fontSize = 20;
        while (size > 150 && fontSize > 10) {
        fontSize--;
        ctx.font = `bold ${fontSize}px Arial`;
        size = ctx.measureText(nameText).width;
        }
        
        // Draw name on LEFT SIDE (next to the golden emblem)
        ctx.fillText(nameText, 430, 505);
        logger.info('Added name layer', { name: nameText, fontSize, width: size, x: 440, y: 505 });
    }
    
    // Convert canvas to buffer
    const buffer = canvas.toBuffer('image/png');
    logger.info('Image generated successfully', { userId, size: buffer.length });
    return buffer;
    } catch (error) {
    logger.error('Failed to generate image', { userId, error: error instanceof Error ? error.message : error });
    throw error;
    }
}

/**
 * Export all uniforms to the specified directory
 */
async exportAllUniforms(outputDirectory: string): Promise<void> {
    try {
    const uniformsDir = path.join(__dirname, '../../images', 'uniform');
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory, { recursive: true });
        logger.info('Created output directory', { path: outputDirectory });
    }

    // Get all uniform files
    const uniformFiles = fs.readdirSync(uniformsDir).filter(file => file.endsWith('.png'));
    logger.info('Found uniforms to export', { count: uniformFiles.length });

    // Copy each uniform
    for (const file of uniformFiles) {
        const srcPath = path.join(uniformsDir, file);
        const destPath = path.join(outputDirectory, file);
        fs.copyFileSync(srcPath, destPath);
        logger.info('Exported uniform', { file, destination: destPath });
    }

    logger.info('All uniforms exported successfully', { 
        count: uniformFiles.length, 
        outputDirectory 
    });
    } catch (error) {
    logger.error('Failed to export uniforms', { 
        outputDirectory, 
        error: error instanceof Error ? error.message : error 
    });
    throw error;
    }
}
}

export default new UniformGeneratorService();
