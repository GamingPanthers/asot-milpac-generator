import mongoose from 'mongoose';
import { config } from '../config';
import logger from '../utils/logger';

/**
 * MongoDB connection service
 */
export class DatabaseService {
  private static instance: DatabaseService;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Connect to MongoDB
   */
  async connect(): Promise<void> {
    try {
      await mongoose.connect(config.MONGO_URL);
      logger.info('✓ Connected to MongoDB');
    } catch (error) {
      logger.error('✗ MongoDB connection failed', { error });
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      logger.info('✓ Disconnected from MongoDB');
    } catch (error) {
      logger.error('✗ MongoDB disconnection failed', { error });
      throw error;
    }
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }
}

export default DatabaseService.getInstance();
