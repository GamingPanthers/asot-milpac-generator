import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { config } from '../config';
import logger from '../utils/logger';
import { GenerationJob } from '../types';

/**
 * Job Queue Service using BullMQ
 */
export class QueueService {
  private static instance: QueueService;
  private queue: Queue<GenerationJob>;
  private redis: Redis;
  private worker: Worker<GenerationJob> | null = null;

  private constructor() {
    // BullMQ requires maxRetriesPerRequest to be null
    this.redis = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: null,
    });
    this.queue = new Queue('image-generation', {
      connection: this.redis,
      defaultJobOptions: {
        attempts: config.MAX_RETRIES,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    this.setupQueueEvents();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): QueueService {
    if (!QueueService.instance) {
      QueueService.instance = new QueueService();
    }
    return QueueService.instance;
  }

  /**
   * Setup queue event listeners
   */
  private setupQueueEvents(): void {
    this.queue.on('error', (error: Error) => {
      logger.error('Queue error', { error: error.message });
    });
  }

  /**
   * Add job to queue
   */
  async addJob(job: GenerationJob): Promise<string> {
    try {
      // Validate job
      if (!job || !job.jobId || !job.memberID) {
        throw new Error('Invalid job: jobId and memberID are required');
      }

      const queuedJob = await this.queue.add(job.jobId, job, {
        jobId: job.jobId,
        attempts: config.MAX_RETRIES,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });
      logger.info('Job enqueued', { jobId: job.jobId, memberID: job.memberID });
      return queuedJob.id || '';
    } catch (error) {
      logger.error('Failed to add job to queue', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  /**
   * Get job status with result data
   */
  async getJobStatus(jobId: string): Promise<any> {
    try {
      // Validate jobId
      if (!jobId || typeof jobId !== 'string' || jobId.trim().length === 0) {
        throw new Error('Invalid jobId provided');
      }

      const job = await this.queue.getJob(jobId);
      if (!job) return null;

      const state = await job.getState();
      
      // Get job result if completed
      const result = state === 'completed' ? job.returnvalue : null;
      
      // Convert file path to URL
      let imageUrl = null;
      if (result?.imagePath && result?.memberID) {
        imageUrl = `${config.IMAGE_SERVICE_URL}/milpac/${result.memberID}.png`;
      }
      
      return {
        state,
        result,
        imageUrl,
      };
    } catch (error) {
      logger.error('Failed to get job status', { jobId, error: error instanceof Error ? error.message : error });
      return null;
    }
  }

  /**
   * Register job processor
   */
  registerProcessor(processor: (job: any) => Promise<any>): void {
    this.worker = new Worker('image-generation', processor, {
      connection: this.redis,
      concurrency: config.MAX_CONCURRENT_JOBS,
    });

    this.worker.on('completed', (job) => {
      logger.info('Worker completed job', { jobId: job.id });
    });

    this.worker.on('failed', (job, error) => {
      if (job) {
        logger.error('Worker job failed', { jobId: job.id, error: error.message });
      }
    });
  }

  /**
   * Get queue stats
   */
  async getStats(): Promise<any> {
    try {
      const counts = await this.queue.getJobCounts('active', 'completed', 'failed', 'delayed', 'waiting');
      return counts;
    } catch (error) {
      logger.error('Failed to get queue stats', { error: error instanceof Error ? error.message : error });
      return {};
    }
  }

  /**
   * Clear completed/failed jobs (keeps jobs from last 7 days)
   */
  async clear(): Promise<void> {
    try {
      // Keep jobs from the last 7 days, remove everything older
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      await this.queue.clean(sevenDaysInMs, 100);
      logger.info('Queue cleaned - removed jobs older than 7 days');
    } catch (error) {
      logger.error('Failed to clear queue', { error: error instanceof Error ? error.message : error });
    }
  }

  /**
   * Get Redis client (for app.locals and health checks)
   */
  getRedisClient(): Redis {
    return this.redis;
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    try {
      if (this.worker) {
        await this.worker.close();
      }
      await this.queue.close();
      await this.redis.quit();
      logger.info('✓ Queue service closed');
    } catch (error) {
      logger.error('Failed to close queue service', { error: error instanceof Error ? error.message : error });
    }
  }
}

export default QueueService.getInstance();
