import { Job } from 'bullmq';
import { GenerationJob, GenerationLog as GenerationLogType } from '../types';
import { GenerationLogModel } from '../models';
import imageGeneratorService from './imageGenerator';
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
    const { memberID, name, data } = job.data;

    try {
      logger.info('Processing generation job', { memberID, jobId: job.id });

      // Generate image
      const imageBuffer = await imageGeneratorService.generateUniform(memberID, data);

      // Save image to disk
      const imagePath = await storageService.saveImage(memberID, imageBuffer);

      // Update member record with image metadata
      await memberService.updateMemberImage(memberID, imagePath);

      // Notify milpac-web of successful generation (non-blocking)
      try {
        // Only use filename, not full path
        const imageUrl = `${config.IMAGE_SERVICE_URL}/milpac/${memberID}.png`;
        await WebIntegrationService.notifyImageGeneration(memberID, imageUrl);
      } catch (notifyError) {
        // Log but don't fail the job - notification failure shouldn't block success
        logger.warn('Failed to notify web service', { memberID, error: notifyError instanceof Error ? notifyError.message : notifyError });
      }

      // Log successful generation
      const executionTime = Date.now() - startTime;
      const imageSize = imageBuffer.length;

      await this.logGeneration({
        memberID,
        jobId: job.id || `job_${memberID}_${Date.now()}`,
        timestamp: new Date(),
        status: 'success',
        executionTime,
        imageSize,
      });

      logger.info('Generation job completed', {
        memberID,
        jobId: job.id,
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
      await this.logGeneration({
        memberID,
        jobId: job.id || `job_${memberID}_${Date.now()}`,
        timestamp: new Date(),
        status: 'failed',
        executionTime,
        error: errorMessage,
      });

      logger.error('Generation job failed', {
        memberID,
        jobId: job.id,
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
