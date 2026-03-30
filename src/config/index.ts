import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

/**
 * Environment configuration
 */
export const config = {
  // Server
  PORT: parseInt(process.env.PORT || '42070', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Webhook Security
  WEBHOOK_API_KEY: process.env.WEBHOOK_API_KEY || 'default-insecure-key',

  // Database
  MONGO_URL: process.env.MONGO_URL || 'mongodb://localhost:27017/milpac',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // Image Generation
  IMAGE_OUTPUT_DIR: process.env.IMAGE_OUTPUT_DIR || path.join(process.cwd(), 'milpac'),
  IMAGE_WIDTH: parseInt(process.env.IMAGE_WIDTH || '1398', 10),
  IMAGE_HEIGHT: parseInt(process.env.IMAGE_HEIGHT || '1000', 10),

  // Job Queue
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES || '5', 10),
  JOB_TIMEOUT: parseInt(process.env.JOB_TIMEOUT || '30000', 10),
  MAX_CONCURRENT_JOBS: parseInt(process.env.MAX_CONCURRENT_JOBS || '5', 10),

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // Change Detection
  TRIGGER_FIELDS: ['rank', 'Uniform', 'badge', 'medallions', 'citations', 'TrainingMedals', 'RifleManBadge'],

  // API
  API_TIMEOUT: parseInt(process.env.API_TIMEOUT || '30000', 10),
};

/**
 * Validate required configuration
 */
export function validateConfig(): void {
  const required = ['WEBHOOK_API_KEY', 'MONGO_URL', 'REDIS_URL'];

  if (config.NODE_ENV === 'production') {
    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
}
