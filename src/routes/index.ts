import { Router, Request, Response, NextFunction } from 'express';
import WebhookHandler from '../middleware/webhookHandler';
import logger from '../utils/logger';

/**
 * Wrapper for async route handlers to catch errors
 */
const asyncHandler = (fn: (req: Request, res: Response, next?: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Express routes
 */
const router = Router();

/**
 * POST /webhook - Process webhook from web service
 * Request body: WebhookPayload with member data and generation request
 * Authorization: Bearer token in Authorization header (WEBHOOK_API_KEY)
 * Response: { status, message, data: { jobId, memberID, queued } }
 */
router.post('/webhook', asyncHandler(async (req: Request, res: Response) => {
  await WebhookHandler.handleWebhook(req, res);
}));

/**
 * GET /status/:jobId - Check status of a generation job
 * Path params: jobId (string format: job_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
 * Response: { status, message, data: { jobId, status, imageUrl } }
 */
router.get('/status/:jobId', asyncHandler(async (req: Request, res: Response) => {
  await WebhookHandler.getJobStatus(req, res);
}));

/**
 * GET /queue/stats - Get queue statistics (requires authorization)
 * Authorization: Bearer token in Authorization header (WEBHOOK_API_KEY)
 * Response: { status, message, data: { waiting, active, completed, failed, ... } }
 */
router.get('/queue/stats', asyncHandler(async (req: Request, res: Response) => {
  // Validate authorization for sensitive endpoint
  if (!WebhookHandler.validateAuthorization(req)) {
    res.status(401).json({
      status: 'error',
      message: 'Unauthorized',
      code: 401,
      error: 'Invalid or missing authorization header',
    });
    return;
  }

  await WebhookHandler.getQueueStats(req, res);
}));

/**
 * GET /health - Health check endpoint
 * Returns server status and checks critical dependencies (MongoDB, Redis)
 * Response: { status, message, timestamp, dependencies: { mongodb, redis } }
 */
router.get('/health', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Check basic health
    const health = {
      status: 'success',
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      dependencies: {
        mongodb: 'unknown',
        redis: 'unknown',
      },
    };

    // Try to verify MongoDB connection
    try {
      const db = req.app.locals.db;
      if (db && db.admin) {
        await db.admin().ping();
        health.dependencies.mongodb = 'healthy';
      } else {
        health.dependencies.mongodb = 'not initialized';
      }
    } catch (err) {
      health.dependencies.mongodb = 'unhealthy';
      logger.warn('MongoDB health check failed');
    }

    // Try to verify Redis connection
    try {
      const redis = req.app.locals.redis;
      if (redis) {
        await redis.ping();
        health.dependencies.redis = 'healthy';
      } else {
        health.dependencies.redis = 'not initialized';
      }
    } catch (err) {
      health.dependencies.redis = 'unhealthy';
      logger.warn('Redis health check failed');
    }

    res.status(200).json(health);
  } catch (err) {
    logger.error('Health check error', { error: err instanceof Error ? err.message : err });
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
}));

export default router;
