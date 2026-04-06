import logger from '../utils/logger';

/**
 * Query performance metrics
 */
export interface QueryMetrics {
  queryType: string;
  duration: number;
  cached: boolean;
  timestamp: Date;
  success: boolean;
  error?: string;
  documentsReturned?: number;
}

/**
 * Query type statistics
 */
interface QueryTypeStats {
  count: number;
  totalDuration: number;
  cached: number;
  errors: number;
  averageDuration?: number;
}

/**
 * Performance statistics
 */
interface PerformanceStats {
  totalQueries: number;
  cachedQueries: number;
  averageDuration: number;
  slowestQuery: QueryMetrics | null;
  fastestQuery: QueryMetrics | null;
  successRate: number;
  byQueryType: Record<string, QueryTypeStats>;
}

/**
 * Detailed statistics for a query type
 */
interface QueryTypeDetailedStats {
  queryType: string;
  count: number;
  averageDuration: number;
  cachedCount: number;
  errorCount: number;
  successRate: number;
}

/**
 * Performance monitoring service
 * Tracks query execution times and provides performance insights
 */
export class PerformanceMonitor {
  private metrics: QueryMetrics[] = [];
  private maxMetrics: number = 1000; // Keep last 1000 metrics
  private slowQueryThreshold: number = 100; // 100ms

  /**
   * Track a query execution
   */
  recordQuery(
    queryType: string,
    duration: number,
    options: { cached?: boolean; success?: boolean; error?: string; documentsReturned?: number } = {}
  ): void {
    const metric: QueryMetrics = {
      queryType,
      duration,
      cached: options.cached || false,
      timestamp: new Date(),
      success: options.success !== false,
      error: options.error,
      documentsReturned: options.documentsReturned || 0,
    };

    this.metrics.push(metric);

    // Keep metrics array from growing too large
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log slow queries
    if (duration > this.slowQueryThreshold && !options.cached) {
      logger.warn('Slow query detected', {
        queryType,
        durationMs: duration,
        threshold: this.slowQueryThreshold,
      });
    }

    // Debug logging for all queries
    logger.debug('Query executed', {
      queryType,
      durationMs: duration,
      cached: options.cached,
      success: options.success,
    });
  }

  /**
   * Get performance statistics
   */
  getStats(): PerformanceStats {
    if (this.metrics.length === 0) {
      return {
        totalQueries: 0,
        cachedQueries: 0,
        averageDuration: 0,
        slowestQuery: null,
        fastestQuery: null,
        successRate: 100,
        byQueryType: {},
      };
    }

    const cachedCount = this.metrics.filter((m) => m.cached).length;
    const successCount = this.metrics.filter((m) => m.success).length;
    const avgDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0) / this.metrics.length;

    let slowest = this.metrics[0];
    let fastest = this.metrics[0];

    this.metrics.forEach((m) => {
      if (m.duration > slowest.duration) slowest = m;
      if (m.duration < fastest.duration) fastest = m;
    });

    // Statistics by query type
    const byType: Record<string, QueryTypeStats> = {};
    this.metrics.forEach((m) => {
      if (!byType[m.queryType]) {
        byType[m.queryType] = {
          count: 0,
          totalDuration: 0,
          cached: 0,
          errors: 0,
        };
      }
      byType[m.queryType].count++;
      byType[m.queryType].totalDuration += m.duration;
      if (m.cached) byType[m.queryType].cached++;
      if (!m.success) byType[m.queryType].errors++;
    });

    // Calculate averages per type
    Object.keys(byType).forEach((type) => {
      byType[type].averageDuration = byType[type].totalDuration / byType[type].count;
    });

    return {
      totalQueries: this.metrics.length,
      cachedQueries: cachedCount,
      averageDuration: Math.round(avgDuration * 100) / 100,
      slowestQuery: slowest,
      fastestQuery: fastest,
      successRate: Math.round((successCount / this.metrics.length) * 100),
      byQueryType: byType,
    };
  }

  /**
   * Log current performance statistics
   */
  logStats(): void {
    const stats = this.getStats();
    logger.info('Performance statistics', {
      totalQueries: stats.totalQueries,
      cachedQueries: stats.cachedQueries,
      cacheHitRate: Math.round((stats.cachedQueries / stats.totalQueries) * 100) + '%',
      averageDurationMs: stats.averageDuration,
      slowestQueryMs: stats.slowestQuery?.duration,
      successRate: stats.successRate + '%',
    });
  }

  /**
   * Get detailed stats for a specific query type
   */
  getQueryTypeStats(queryType: string): QueryTypeDetailedStats | null {
    const filtered = this.metrics.filter((m) => m.queryType === queryType);
    if (filtered.length === 0) return null;

    return {
      queryType,
      count: filtered.length,
      averageDuration: Math.round((filtered.reduce((sum, m) => sum + m.duration, 0) / filtered.length) * 100) / 100,
      cachedCount: filtered.filter((m) => m.cached).length,
      errorCount: filtered.filter((m) => !m.success).length,
      successRate: Math.round(((filtered.length - filtered.filter((m) => !m.success).length) / filtered.length) * 100),
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    const count = this.metrics.length;
    this.metrics = [];
    logger.info('Performance metrics cleared', { metricsCleared: count });
  }

  /**
   * Set slow query threshold (in milliseconds)
   */
  setSlowQueryThreshold(ms: number): void {
    this.slowQueryThreshold = ms;
    logger.info('Slow query threshold updated', { thresholdMs: ms });
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();
