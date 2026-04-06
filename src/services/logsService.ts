import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  metadata?: Record<string, unknown>;
}

interface LogsResponse {
  status: 'success' | 'error';
  message: string;
  data?: {
    entries: LogEntry[] | string[];
    total: number;
    returned: number;
    type: string;
    level?: string;
    hasMore: boolean;
  };
  error?: string;
}

/**
 * Logs service for exporting and reading log files
 */
export class LogsService {
  private static readonly LOG_DIR = 'logs';
  private static readonly COMBINED_LOG = path.join(this.LOG_DIR, 'combined.log');
  private static readonly ERROR_LOG = path.join(this.LOG_DIR, 'error.log');
  private static readonly MAX_LINES = 10000;

  /**
   * Get logs with optional filtering and pagination
   */
  static getLogsResponse(options: {
    type?: 'error' | 'combined';
    level?: string;
    limit?: number;
    format?: 'json' | 'text';
    search?: string;
  } = {}): LogsResponse {
    const {
      type = 'combined',
      level,
      limit = 100,
      format = 'json',
      search,
    } = options;

    try {
      const logFile = type === 'error' ? this.ERROR_LOG : this.COMBINED_LOG;

      // Check if file exists
      if (!fs.existsSync(logFile)) {
        return {
          status: 'success',
          message: `No ${type} logs available yet`,
          data: {
            entries: [],
            total: 0,
            returned: 0,
            type,
            hasMore: false,
          },
        };
      }

      // Read file
      const content = fs.readFileSync(logFile, 'utf-8');
      const lines = content.split('\n').filter((line) => line.trim().length > 0);

      // Parse and filter logs
      const parsedLogs = this.parseLogs(lines);
      let filtered = parsedLogs;

      // Apply filters
      if (level) {
        filtered = filtered.filter(
          (log) => log.level.toLowerCase() === level.toLowerCase()
        );
      }

      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(
          (log) =>
            log.message.toLowerCase().includes(searchLower) ||
            JSON.stringify(log.metadata).toLowerCase().includes(searchLower)
        );
      }

      // Apply limit (get most recent logs)
      const actualLimit = Math.min(limit, this.MAX_LINES);
      const startIndex = Math.max(0, filtered.length - actualLimit);
      const returned = filtered.slice(startIndex);

      return {
        status: 'success',
        message: `Retrieved ${returned.length} ${type} logs`,
        data: {
          entries: format === 'json' ? returned : this.formatAsText(returned),
          total: filtered.length,
          returned: returned.length,
          type,
          level: level || 'all',
          hasMore: filtered.length > actualLimit,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to retrieve logs', { error: errorMessage });
      return {
        status: 'error',
        message: 'Failed to retrieve logs',
        error: errorMessage,
      };
    }
  }

  /**
   * Get text format response (for plaintext endpoint)
   */
  static getLogsText(options: {
    type?: 'error' | 'combined';
    level?: string;
    limit?: number;
    search?: string;
  } = {}): string {
    const response = this.getLogsResponse({ ...options, format: 'text' });

    if (response.status === 'error') {
      return `ERROR: ${response.error}`;
    }

    if (!response.data || response.data.entries.length === 0) {
      return `No logs found${options.level ? ` for level: ${options.level}` : ''}`;
    }

    const entries = response.data.entries as LogEntry[];
    return entries
      .map((entry) => {
        const metaStr = entry.metadata && Object.keys(entry.metadata).length > 0
          ? ` ${JSON.stringify(entry.metadata)}`
          : '';
        return `${entry.timestamp} [${entry.level}]: ${entry.message}${metaStr}`;
      })
      .join('\n');
  }

  /**
   * Get statistics about log files
   */
  static getLogStats() {
    try {
      const stats = {
        combined: {
          exists: fs.existsSync(this.COMBINED_LOG),
          size: 0,
          lines: 0,
          lastModified: null as string | null,
        },
        error: {
          exists: fs.existsSync(this.ERROR_LOG),
          size: 0,
          lines: 0,
          lastModified: null as string | null,
        },
      };

      // Combined log stats
      if (stats.combined.exists) {
        const combinedStat = fs.statSync(this.COMBINED_LOG);
        stats.combined.size = combinedStat.size;
        stats.combined.lastModified = combinedStat.mtime.toISOString();
        const combinedContent = fs.readFileSync(this.COMBINED_LOG, 'utf-8');
        stats.combined.lines = combinedContent.split('\n').filter((l) => l.trim()).length;
      }

      // Error log stats
      if (stats.error.exists) {
        const errorStat = fs.statSync(this.ERROR_LOG);
        stats.error.size = errorStat.size;
        stats.error.lastModified = errorStat.mtime.toISOString();
        const errorContent = fs.readFileSync(this.ERROR_LOG, 'utf-8');
        stats.error.lines = errorContent.split('\n').filter((l) => l.trim()).length;
      }

      return {
        status: 'success',
        message: 'Log statistics retrieved',
        data: stats,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get log statistics', { error: errorMessage });
      return {
        status: 'error',
        message: 'Failed to get log statistics',
        error: errorMessage,
      };
    }
  }

  /**
   * Parse raw log lines into structured LogEntry objects
   */
  private static parseLogs(lines: string[]): LogEntry[] {
    return lines
      .map((line) => {
        try {
          // Expected format: TIMESTAMP [LEVEL]: MESSAGE METADATA
          const match = line.match(/^(.+?)\s+\[(\w+)\]:\s+(.+?)(?:\s+({.*))?$/);

          if (!match) {
            // Fallback for unparseable lines
            return {
              timestamp: new Date().toISOString(),
              level: 'unknown',
              message: line,
            };
          }

          const [, timestamp, levelStr, message, metaStr] = match;
          const entry: LogEntry = {
            timestamp,
            level: levelStr.toLowerCase(),
            message: message.trim(),
          };

          // Try to parse metadata if present
          if (metaStr) {
            try {
              entry.metadata = JSON.parse(metaStr);
            } catch {
              // If metadata parsing fails, keep the raw string
              entry.metadata = { raw: metaStr };
            }
          }

          return entry;
        } catch {
          return {
            timestamp: new Date().toISOString(),
            level: 'unknown',
            message: line,
          };
        }
      })
      .filter((log) => log.level !== 'unknown' || log.message.length > 0);
  }

  /**
   * Format log entries as text (for non-JSON responses)
   */
  private static formatAsText(entries: LogEntry[]): string[] {
    return entries.map((entry) => {
      const metadata = entry.metadata && Object.keys(entry.metadata).length > 0
        ? ` ${JSON.stringify(entry.metadata)}`
        : '';
      return `${entry.timestamp} [${entry.level.toUpperCase()}]: ${entry.message}${metadata}`;
    });
  }
}

export default LogsService;
