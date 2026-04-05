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

    // Validate event type
    const validEvents = ['member.updated', 'certificate.requested'];
    if (!validEvents.includes(payload.event)) {
      logger.warn('Invalid event type', { event: payload.event });
      return false;
    }

    const member = payload.member;

    if (!member.memberID || !member.name || !member.discordID || !member.data) {
      logger.warn('Missing required member fields in webhook');
      return false;
    }

    // Validate changeFields if present
    if (member.changeFields !== undefined && !Array.isArray(member.changeFields)) {
      logger.warn('changeFields must be an array');
      return false;
    }

    return true;
  }

  /**
   * Handle incoming webhook
   * Supports both "member.updated" and "certificate.requested" events.
   * Both event types are processed identically, using change detection to determine
   * whether a new image generation is needed. The event type distinction is maintained
   * for future extensibility and clarity of intent from the web service.
   */
  static async handleWebhook(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      // Validate authorization
      if (!WebhookHandler.validateAuthorization(req)) {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized',
          code: 401,
          error: 'Invalid or missing authorization header',
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
          error: 'Missing or invalid required fields',
        });
        return;
      }

      const { member } = payload;
      const { memberID, name, discordID, changeFields = [], data } = member;

      logger.info('Webhook received', { memberID, event: payload.event, changeFieldsCount: changeFields.length });

      // Get existing member data
      const existingMember = await memberService.getMember(memberID);
      const oldData = existingMember?.data || null;

      // Detect changes (use empty array if changeFields not provided)
      const hasChanges = memberService.detectChanges(oldData, data, changeFields);

      if (!hasChanges && existingMember) {
        logger.info('No relevant changes detected', { memberID });
        res.status(200).json({
          status: 'success',
          message: 'No relevant changes detected',
          data: {
            jobId: null,
            memberID,
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
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get job status
   */
  static async getJobStatus(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { jobId } = req.params;

      if (!jobId || typeof jobId !== 'string' || jobId.trim().length === 0) {
        res.status(400).json({
          status: 'error',
          message: 'Job ID is required',
          code: 400,
          error: 'Job ID must be a non-empty string',
        });
        return;
      }

      const jobData = await queueService.getJobStatus(jobId);

      if (!jobData) {
        res.status(404).json({
          status: 'error',
          message: 'Job not found',
          code: 404,
          error: `No job found with ID: ${jobId}`,
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        message: 'Job status retrieved',
        data: {
          jobId,
          status: jobData.state,
          imageUrl: jobData.imageUrl,
        },
      });
    } catch (error) {
      logger.error('Failed to get job status', { error });

      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        code: 500,
        error: error instanceof Error ? error.message : 'Unknown error',
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
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default WebhookHandler;
