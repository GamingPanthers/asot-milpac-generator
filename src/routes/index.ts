import { Router, Request, Response, NextFunction } from 'express';
import WebhookHandler from '../middleware/webhookHandler';
import LogsService from '../services/logsService';
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
 * GET /logs - Retrieve application logs (requires authorization)
 * Authorization: Bearer token in Authorization header (WEBHOOK_API_KEY)
 * Query params:
 *   - type: 'error' or 'combined' (default: 'combined')
 *   - level: filter by log level (error, warn, info, debug)
 *   - limit: number of logs to return (default: 100, max: 10000)
 *   - search: search logs by message or metadata
 *   - format: 'json' or 'text' (default: 'json')
 * Response: { status, message, data: { entries[], total, returned, type, hasMore } }
 */
router.get('/logs', asyncHandler(async (req: Request, res: Response) => {
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

  const type = (req.query.type as string) || 'combined';
  const level = req.query.level as string | undefined;
  const limit = parseInt(req.query.limit as string, 10) || 100;
  const search = req.query.search as string | undefined;
  const format = (req.query.format as string) || 'json';

  // Validate type parameter
  if (type !== 'error' && type !== 'combined') {
    res.status(400).json({
      status: 'error',
      message: 'Invalid type parameter. Must be "error" or "combined"',
    });
    return;
  }

  // Validate format parameter
  if (format !== 'json' && format !== 'text') {
    res.status(400).json({
      status: 'error',
      message: 'Invalid format parameter. Must be "json" or "text"',
    });
    return;
  }

  if (format === 'text') {
    // Return plaintext response
    const logsText = LogsService.getLogsText({ type: type as 'error' | 'combined', level, limit, search });
    res.type('text/plain').send(logsText);
  } else {
    // Return JSON response
    const response = LogsService.getLogsResponse({
      type: type as 'error' | 'combined',
      level,
      limit,
      format: 'json',
      search,
    });
    res.status(response.status === 'success' ? 200 : 500).json(response);
  }
}));

/**
 * GET /logs/text - Retrieve application logs in plaintext format (requires authorization)
 * Query params: same as /logs endpoint
 * Response: plaintext log lines
 */
router.get('/logs/text', asyncHandler(async (req: Request, res: Response) => {
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

  const type = (req.query.type as string) || 'combined';
  const level = req.query.level as string | undefined;
  const limit = parseInt(req.query.limit as string, 10) || 100;
  const search = req.query.search as string | undefined;

  const logsText = LogsService.getLogsText({
    type: type as 'error' | 'combined',
    level,
    limit,
    search,
  });

  res.type('text/plain').send(logsText);
}));

/**
 * GET /logs/stats - Get log file statistics (requires authorization)
 * Authorization: Bearer token in Authorization header (WEBHOOK_API_KEY)
 * Response: { status, message, data: { combined: { exists, size, lines, lastModified }, error: { ... } } }
 */
router.get('/logs/stats', asyncHandler(async (req: Request, res: Response) => {
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

  const response = LogsService.getLogStats();
  res.status(response.status === 'success' ? 200 : 500).json(response);
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
