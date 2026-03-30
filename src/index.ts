import express, { Application } from 'express';
import { config, validateConfig } from './config';
import logger from './utils/logger';
import databaseService from './services/database';
import queueService from './services/queue';
import JobProcessor from './services/jobProcessor';
import routes from './routes';

/**
 * Initialize and start the server
 */
async function startServer(): Promise<void> {
  try {
    // Validate configuration
    validateConfig();

    const app: Application = express();

    // Middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Request logging middleware
    app.use((req, res, next) => {
      logger.debug(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
      next();
    });

    // Routes
    app.use('/', routes);

    // Error handling middleware
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error', { error: err.message, stack: err.stack });

      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        code: 500,
      });
    });

    // Connect to MongoDB
    await databaseService.connect();

    // Register job processor
    queueService.registerProcessor(JobProcessor.processGenerationJob);

    // Start server
    app.listen(config.PORT, () => {
      logger.info(`✓ Server starting on port: ${config.PORT}`);
      logger.info(`✓ Environment: ${config.NODE_ENV}`);
      logger.info(`✓ Image output directory: ${config.IMAGE_OUTPUT_DIR}`);
      logger.info(`✓ Test webhook endpoint: POST http://localhost:${config.PORT}/webhook`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      await shutdown();
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully...');
      await shutdown();
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

/**
 * Shutdown handler
 */
async function shutdown(): Promise<void> {
  try {
    await queueService.close();
    await databaseService.disconnect();
    logger.info('Shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error });
    process.exit(1);
  }
}

// Start the server
startServer();
