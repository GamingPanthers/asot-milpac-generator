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
      const queuedJob = await this.queue.add(job.jobId, job, {
        jobId: job.jobId,
      });
      logger.info('Job enqueued', { jobId: job.jobId, memberID: job.memberID });
      return queuedJob.id || '';
    } catch (error) {
      logger.error('Failed to add job to queue', { error });
      throw error;
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<string | null> {
    try {
      const job = await this.queue.getJob(jobId);
      if (!job) return null;

      const state = await job.getState();
      return state;
    } catch (error) {
      logger.error('Failed to get job status', { jobId, error });
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
      logger.error('Failed to get queue stats', { error });
      return {};
    }
  }

  /**
   * Clear queue
   */
  async clear(): Promise<void> {
    try {
      await this.queue.clean(0, 1000);
      logger.info('Queue cleared');
    } catch (error) {
      logger.error('Failed to clear queue', { error });
    }
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
      logger.error('Failed to close queue service', { error });
    }
  }
}

export default QueueService.getInstance();
