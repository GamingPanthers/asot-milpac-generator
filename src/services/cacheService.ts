import logger from '../utils/logger';
import { MemberData } from '../types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Asset documents can have various structures from MongoDB
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AssetInfo = Record<string, unknown>;

/**
 * Query cache with TTL (Time To Live)
 * Stores frequently accessed database records in memory
 */
export class QueryCache {
  private cache: Map<string, CacheEntry<MemberData>> = new Map();
  private ttl: number = 5 * 60 * 1000; // 5 minutes default

  constructor(ttlMs: number = 5 * 60 * 1000) {
    this.ttl = ttlMs;
  }

  /**
   * Get value from cache if not expired
   */
  get(key: string): MemberData | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > this.ttl) {
      this.cache.delete(key);
      logger.debug('Cache expired', { key, ageMs: age });
      return null;
    }

    logger.debug('Cache hit', { key, ageMs: age });
    return cached.data;
  }

  /**
   * Set value in cache
   */
  set(key: string, data: MemberData): void {
    this.cache.set(key, { data, timestamp: Date.now() });
    logger.debug('Cache set', { key });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;

    const age = Date.now() - cached.timestamp;
    if (age > this.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Remove specific key from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
    logger.debug('Cache deleted', { key });
  }

  /**
   * Clear all cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    logger.info('Cache cleared', { itemsCleared: size });
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

/**
 * Asset metadata cache
 * Pre-loads and caches asset information (qualifications, certificates, awards)
 */
export class AssetCache {
  private qualifications: Map<string, AssetInfo> = new Map();
  private certificates: Map<string, AssetInfo> = new Map();
  private awards: Map<string, AssetInfo> = new Map();
  private isInitialized: boolean = false;

  /**
   * Initialize cache by loading assets from database
   */
  async initialize(_getAssetsInfoFn: (collection: string, names: string[]) => Promise<AssetInfo[]>): Promise<void> {
    if (this.isInitialized) {
      logger.debug('Asset cache already initialized');
      return;
    }

    try {
      // Pre-load all unique assets (in a real scenario, you'd fetch all from DB)
      // For now, we'll load on-demand and cache results
      logger.info('Asset cache initialized');
      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize asset cache', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Get asset info from cache or fetch and cache
   */
  async getAssetInfo(
    collectionType: 'qualifications' | 'certificates' | 'awards',
    names: string[],
    fetchFn: (collection: string, names: string[]) => Promise<AssetInfo[]>
  ): Promise<AssetInfo[]> {
    const cacheMap = this.getCacheMap(collectionType);
    const results: AssetInfo[] = [];
    const missingNames: string[] = [];

    // Check cache for each name
    names.forEach((name) => {
      const cached = cacheMap.get(name);
      if (cached) {
        results.push(cached);
        logger.debug('Asset cache hit', { type: collectionType, name });
      } else {
        missingNames.push(name);
      }
    });

    // Fetch missing assets
    if (missingNames.length > 0) {
      const collectionName = `milpac_${collectionType}`;
      logger.debug('Fetching missing assets', { type: collectionType, count: missingNames.length });

      const fetched = await fetchFn(collectionName, missingNames);
      fetched.forEach((asset) => {
        const name = String(asset.name || asset._id);
        cacheMap.set(name, asset);
        results.push(asset);
      });
    }

    return results;
  }

  /**
   * Clear all asset caches
   */
  clear(): void {
    const total = this.qualifications.size + this.certificates.size + this.awards.size;
    this.qualifications.clear();
    this.certificates.clear();
    this.awards.clear();
    logger.info('Asset cache cleared', { itemsCleared: total });
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    qualifications: number;
    certificates: number;
    awards: number;
    total: number;
  } {
    return {
      qualifications: this.qualifications.size,
      certificates: this.certificates.size,
      awards: this.awards.size,
      total: this.qualifications.size + this.certificates.size + this.awards.size,
    };
  }

  /**
   * Get appropriate cache map based on collection type
   */
  private getCacheMap(type: 'qualifications' | 'certificates' | 'awards'): Map<string, AssetInfo> {
    switch (type) {
      case 'qualifications':
        return this.qualifications;
      case 'certificates':
        return this.certificates;
      case 'awards':
        return this.awards;
      default:
        throw new Error(`Unknown asset type: ${type}`);
    }
  }
}

// Export singleton instances
export const memberCache = new QueryCache(5 * 60 * 1000); // 5 minute TTL
export const assetCache = new AssetCache();
