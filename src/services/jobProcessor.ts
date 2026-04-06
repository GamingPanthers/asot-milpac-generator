import { Job } from 'bullmq';
import mongoose from 'mongoose';
import { GenerationJob, GenerationLog as GenerationLogType } from '../types';
import { GenerationLogModel } from '../models';
import uniformGeneratorService from './uniformGenerator';
import storageService from './storage';
import memberService from './member';
import WebIntegrationService from './webIntegration';
import { config } from '../config';
import logger from '../utils/logger';

/**
 * Job processor for image generation
 */
export class JobProcessor {
  /**
   * Process a generation job
   */
  static async processGenerationJob(job: Job<GenerationJob>): Promise<any> {
    const startTime = Date.now();
    const { memberID, jobId } = job.data;

    try {
      logger.info('Processing generation job', { memberID, jobId });

      // Fetch fresh data from milpacs (authoritative source)
      const db = mongoose.connection.db;
      const milpac = await db?.collection('milpacs').findOne({ _id: new mongoose.Types.ObjectId(memberID) } as any);
      
      if (!milpac) {
        throw new Error(`Member not found in milpacs: ${memberID}`);
      }

      // Normalize corps from "Army Aviation Corp" to "Aviation"
      let corpsNormalized = '';
      if (milpac.corps && typeof milpac.corps === 'string') {
        corpsNormalized = milpac.corps
          .replace('Army ', '')
          .replace(' Corp', '')
          .trim();
      }

      // Transform milpac data to generator format
      const memberData = {
        rank: milpac.rankName || '',
        corps: corpsNormalized,
        awards: milpac.awards || [],
        qualifications: milpac.qualifications || [],
        certificates: [],
        name: milpac.name,
        Uniform: '',
        badge: '',
        medallions: milpac.medallions || [],
        citations: milpac.citations || [],
        TrainingMedals: milpac.TrainingMedals || [],
        RifleManBadge: '',
        certificateType: 'award',
        certificateAward: '',
      };

      // Generate image with fresh data
      const imageBuffer = await uniformGeneratorService.generateUniform(memberID, memberData);

      // Save image to disk in uniform folder
      const imagePath = await storageService.saveImage(memberID, imageBuffer, 'uniform');

      // Update member record with image metadata
      await memberService.updateMemberImage(memberID, imagePath);

      // Notify milpac-web of successful generation (non-blocking)
      try {
        // Only use filename, not full path - point to uniform subfolder
        const imageUrl = `${config.IMAGE_SERVICE_URL}/milpac/uniform/${memberID}.png`;
        await WebIntegrationService.notifyImageGeneration(memberID, imageUrl);
      } catch (notifyError) {
        // Log but don't fail the job - notification failure shouldn't block success
        logger.warn('Failed to notify web service', { memberID, error: notifyError instanceof Error ? notifyError.message : notifyError });
      }

      // Log successful generation
      const executionTime = Date.now() - startTime;
      const imageSize = imageBuffer.length;

      await JobProcessor.logGeneration({
        memberID,
        jobId,
        timestamp: new Date(),
        status: 'success',
        executionTime,
        imageSize,
      });

      logger.info('Generation job completed', {
        memberID,
        jobId,
        executionTime,
        imageSize,
      });

      return {
        success: true,
        memberID,
        imagePath,
        size: imageSize,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failed generation
      await JobProcessor.logGeneration({
        memberID,
        jobId,
        timestamp: new Date(),
        status: 'failed',
        executionTime,
        error: errorMessage,
      });

      logger.error('Generation job failed', {
        memberID,
        jobId,
        error: errorMessage,
        executionTime,
      });

      throw error;
    }
  }

  /**
   * Log generation result to database
   */
  private static async logGeneration(log: GenerationLogType): Promise<void> {
    try {
      await GenerationLogModel.create(log);
      logger.debug('Generation logged', { memberID: log.memberID, status: log.status });
    } catch (error) {
      logger.error('Failed to log generation', { memberID: log.memberID, error });
      // Don't throw - logging failure shouldn't fail the job
    }
  }

  /**
   * Get generation history for a member
   */
  static async getGenerationHistory(memberID: string, limit: number = 10): Promise<GenerationLogType[]> {
    try {
      const logs = await GenerationLogModel.find({ memberID }).sort({ timestamp: -1 }).limit(limit);
      return logs as GenerationLogType[];
    } catch (error) {
      logger.error('Failed to fetch generation history', { memberID, error });
      return [];
    }
  }
}

export default JobProcessor;
