import mongoose from 'mongoose';
import logger from '../utils/logger';
import { memberCache } from './cacheService';
import { MemberData } from '../types';

/**
 * Milpac document from MongoDB
 */
export interface MilpacDocument extends MemberData {
  _id?: object;
  activeDuty?: boolean;
  rankName?: string;
  medallions?: unknown[];
  citations?: unknown[];
  TrainingMedals?: unknown[];
}

/**
 * Batch query service for efficient multi-document retrieval
 */
export class BatchQueryService {
  /**
   * Fetch multiple members efficiently
   * Uses caching and batch queries to minimize database hits
   */
  static async fetchMembers(memberIDs: string[]): Promise<Map<string, MilpacDocument>> {
    const startTime = Date.now();
    const results = new Map<string, MilpacDocument>();
    const idsToQuery: string[] = [];

    // Check cache first
    memberIDs.forEach((id) => {
      const cacheKey = `member:${id}`;
      const cached = memberCache.get(cacheKey);
      if (cached) {
        results.set(id, cached as MilpacDocument);
        logger.debug('Member found in cache', { memberID: id });
      } else {
        idsToQuery.push(id);
      }
    });

    // Batch query for missing members
    if (idsToQuery.length > 0) {
      try {
        const db = mongoose.connection.db;
        const objectIds = idsToQuery.map((id) => new mongoose.Types.ObjectId(id));

        const milpacs = await db
          ?.collection<MilpacDocument>('milpacs')
          .find({ _id: { $in: objectIds } })
          .toArray();

        if (milpacs) {
          milpacs.forEach((milpac) => {
            const id = milpac._id?.toString() || '';
            results.set(id, milpac);
            // Cache for future use
            memberCache.set(`member:${id}`, milpac);
          });
        }

        logger.info('Batch query completed', {
          requestedCount: idsToQuery.length,
          foundCount: milpacs?.length || 0,
          durationMs: Date.now() - startTime,
        });
      } catch (error) {
        logger.error('Batch query failed', {
          error: error instanceof Error ? error.message : error,
          idsRequested: idsToQuery.length,
        });
        throw error;
      }
    }

    return results;
  }

  /**
   * Fetch single member with caching
   */
  static async fetchMember(memberID: string): Promise<MilpacDocument | null> {
    const startTime = Date.now();
    const cacheKey = `member:${memberID}`;

    // Check cache
    const cached = memberCache.get(cacheKey);
    if (cached) {
      logger.debug('Member fetched from cache', { memberID, durationMs: Date.now() - startTime });
      return cached as MilpacDocument;
    }

    // Query database
    try {
      const db = mongoose.connection.db;
      const milpac = await db?.collection<MilpacDocument>('milpacs').findOne({
        _id: new mongoose.Types.ObjectId(memberID),
      });

      if (milpac) {
        memberCache.set(cacheKey, milpac);
        logger.debug('Member fetched from database', { memberID, durationMs: Date.now() - startTime });
        return milpac;
      }

      logger.warn('Member not found', { memberID });
      return null;
    } catch (error) {
      logger.error('Failed to fetch member', {
        memberID,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Fetch all active members (for bulk operations)
   */
  static async fetchAllActive(): Promise<MilpacDocument[]> {
    const startTime = Date.now();

    try {
      const db = mongoose.connection.db;
      const milpacs = await db
        ?.collection<MilpacDocument>('milpacs')
        .find({ activeDuty: { $ne: false } })
        .toArray();

      logger.info('Fetched all active members', {
        count: milpacs?.length || 0,
        durationMs: Date.now() - startTime,
      });

      return milpacs || [];
    } catch (error) {
      logger.error('Failed to fetch all active members', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Fetch members by corps
   */
  static async fetchMembersByCorps(corps: string): Promise<MilpacDocument[]> {
    const startTime = Date.now();

    try {
      const db = mongoose.connection.db;
      const milpacs = await db?.collection<MilpacDocument>('milpacs').find({ corps }).toArray();

      logger.info('Fetched members by corps', {
        corps,
        count: milpacs?.length || 0,
        durationMs: Date.now() - startTime,
      });

      return milpacs || [];
    } catch (error) {
      logger.error('Failed to fetch members by corps', {
        corps,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Invalidate member cache (after updates)
   */
  static invalidateMemberCache(memberID: string): void {
    const cacheKey = `member:${memberID}`;
    memberCache.delete(cacheKey);
    logger.info('Member cache invalidated', { memberID });
  }

  /**
   * Invalidate all member caches
   */
  static invalidateAllMemberCache(): void {
    memberCache.clear();
    logger.info('All member caches invalidated');
  }
}

export default BatchQueryService;
