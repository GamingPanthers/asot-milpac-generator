import logger from '../utils/logger';
import { assetCache } from './cacheService';
import { performanceMonitor } from './performanceMonitor';
import { getAssetsInfo } from '../lib/mongo';

interface StartupInfo {
  assetsLoaded: boolean;
  performanceMonitoringEnabled: boolean;
  cacheSystemReady: boolean;
  timestamp: string;
}

/**
 * Service initialization
 * Handles startup tasks like cache warm-up and performance monitoring setup
 */
export class ServiceInitializer {
  /**
   * Initialize all services on application startup
   */
  static async initialize(): Promise<StartupInfo> {
    try {
      logger.info('Initializing application services...');

      // Initialize asset cache
      const assetsLoaded = await this.initializeAssetCache();

      // Configure performance monitoring
      const performanceMonitoringEnabled = this.configurePerformanceMonitoring();

      logger.info('Application services initialized successfully');

      return {
        assetsLoaded,
        performanceMonitoringEnabled,
        cacheSystemReady: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to initialize services', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Initialize asset cache (pre-load common assets)
   */
  private static async initializeAssetCache(): Promise<boolean> {
    try {
      logger.info('Initializing asset cache...');

      // Initialize the cache with the fetch function
      await assetCache.initialize(getAssetsInfo);

      const stats = assetCache.getStats();
      logger.info('Asset cache initialized', {
        qualifications: stats.qualifications,
        certificates: stats.certificates,
        awards: stats.awards,
        total: stats.total,
      });

      return true;
    } catch (error) {
      logger.warn('Failed to initialize asset cache', {
        error: error instanceof Error ? error.message : error,
      });
      // Don't throw - cache can be populated on-demand
      return false;
    }
  }

  /**
   * Configure performance monitoring
   */
  private static configurePerformanceMonitoring(): boolean {
    try {
      // Set slow query threshold to 100ms for database queries
      performanceMonitor.setSlowQueryThreshold(100);

      logger.info('Performance monitoring configured', {
        slowQueryThreshold: '100ms',
      });

      // Optional: Log performance stats periodically (e.g., every 5 minutes)
      // This would be useful in a longer-running process
      // setInterval(() => {
      //   performanceMonitor.logStats();
      // }, 5 * 60 * 1000);

      return true;
    } catch (error) {
      logger.warn('Failed to configure performance monitoring', {
        error: error instanceof Error ? error.message : error,
      });
      return false;
    }
  }

  /**
   * Get startup information
   */
  static getStartupInfo(): StartupInfo {
    return {
      assetsLoaded: true,
      performanceMonitoringEnabled: true,
      cacheSystemReady: true,
      timestamp: new Date().toISOString(),
    };
  }
}

export default ServiceInitializer;
