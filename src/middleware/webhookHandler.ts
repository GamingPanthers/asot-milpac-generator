import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { WebhookPayload, GenerationJob, ApiResponse } from '../types';
import { config } from '../config';
import logger from '../utils/logger';
import memberService from '../services/member';
import queueService from '../services/queue';

/**
 * Webhook request handler
 */
export class WebhookHandler {
  /**
   * Validate webhook authorization
   */
  static validateAuthorization(req: Request): boolean {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      logger.warn('Webhook request without authorization header');
      return false;
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

    if (token !== config.WEBHOOK_API_KEY) {
      logger.warn('Webhook request with invalid API key');
      return false;
    }

    return true;
  }

  /**
   * Validate webhook payload
   */
  static validatePayload(payload: any): payload is WebhookPayload {
    if (!payload.event || !payload.member) {
      logger.warn('Invalid webhook payload structure');
      return false;
    }

    const member = payload.member;

    if (!member.memberID || !member.name || !member.discordID || !member.data) {
      logger.warn('Missing required member fields in webhook');
      return false;
    }

    return true;
  }

  /**
   * Handle incoming webhook
   */
  static async handleWebhook(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      // Validate authorization
      if (!WebhookHandler.validateAuthorization(req)) {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized',
          code: 401,
        });
        return;
      }

      // Validate payload
      const payload = req.body;

      if (!WebhookHandler.validatePayload(payload)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid webhook payload',
          code: 400,
        });
        return;
      }

      const { member } = payload;
      const { memberID, name, discordID, changeFields, data } = member;

      logger.info('Webhook received', { memberID, event: payload.event, changeFields });

      // Get existing member data
      const existingMember = await memberService.getMember(memberID);
      const oldData = existingMember?.data || null;

      // Detect changes
      const hasChanges = memberService.detectChanges(oldData, data, changeFields);

      if (!hasChanges && existingMember) {
        logger.info('No relevant changes detected', { memberID, changeFields });
        res.status(200).json({
          status: 'success',
          message: 'No relevant changes detected',
          data: {
            jobId: null,
            queued: false,
          },
        });
        return;
      }

      // Save member data
      await memberService.saveMember(memberID, name, discordID, data);

      // Create generation job
      const jobId = `job_${uuidv4()}`;
      const generationJob: GenerationJob = {
        jobId,
        memberID,
        name,
        data,
        timestamp: new Date(),
        status: 'pending',
        retries: 0,
      };

      // Add to queue
      await queueService.addJob(generationJob);

      logger.info('Image generation queued', { memberID, jobId });

      res.status(200).json({
        status: 'success',
        message: 'Image generation queued for processing',
        data: {
          jobId,
          memberID,
          queued: true,
        },
      });
    } catch (error) {
      logger.error('Webhook handler error', { error });

      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        code: 500,
      });
    }
  }

  /**
   * Get job status
   */
  static async getJobStatus(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { jobId } = req.params;

      if (!jobId) {
        res.status(400).json({
          status: 'error',
          message: 'Job ID is required',
          code: 400,
        });
        return;
      }

      const status = await queueService.getJobStatus(jobId);

      res.status(200).json({
        status: 'success',
        message: 'Job status retrieved',
        data: {
          jobId,
          status,
        },
      });
    } catch (error) {
      logger.error('Failed to get job status', { error });

      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        code: 500,
      });
    }
  }

  /**
   * Get queue statistics
   */
  static async getQueueStats(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const stats = await queueService.getStats();

      res.status(200).json({
        status: 'success',
        message: 'Queue statistics retrieved',
        data: stats,
      });
    } catch (error) {
      logger.error('Failed to get queue stats', { error });

      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        code: 500,
      });
    }
  }
}

export default WebhookHandler;
