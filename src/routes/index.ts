import { Router, Request, Response } from 'express';
import WebhookHandler from '../middleware/webhookHandler';

/**
 * Express routes
 */
const router = Router();

/**
 * POST /webhook - Receive webhook from Koda database
 */
router.post('/webhook', async (req: Request, res: Response) => {
  await WebhookHandler.handleWebhook(req, res);
});

/**
 * GET /status/:jobId - Check status of a generation job
 */
router.get('/status/:jobId', async (req: Request, res: Response) => {
  await WebhookHandler.getJobStatus(req, res);
});

/**
 * GET /queue/stats - Get queue statistics
 */
router.get('/queue/stats', async (req: Request, res: Response) => {
  await WebhookHandler.getQueueStats(req, res);
});

/**
 * GET /health - Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
