import fs from 'fs';
import path from 'path';
import { MilpacData, Rank } from '../types/milpac';
import logger from '../utils/logger';

/**
 * Service to load and cache MILPAC organizational data
 */
export class MilpacDataService {
  private static instance: MilpacDataService;
  private data: MilpacData | null = null;
  private rankMap: Map<string, Rank> = new Map();

  private constructor() {
    this.loadData();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): MilpacDataService {
    if (!MilpacDataService.instance) {
      MilpacDataService.instance = new MilpacDataService();
    }
    return MilpacDataService.instance;
  }

  /**
   * Load MILPAC data from JSON file
   */
  private loadData(): void {
    try {
      const dataPath = path.join(process.cwd(), 'public', 'milpac-data.json');
      const jsonData = fs.readFileSync(dataPath, 'utf-8');
      this.data = JSON.parse(jsonData) as MilpacData;

      // Build rank lookup map (by code and abbreviation)
      this.data.ranks.forEach((rank) => {
        if (rank.code && !rank.name.includes('Billet')) {
          this.rankMap.set(rank.code.toUpperCase(), rank);
        }
        if (rank.abbr && !rank.name.includes('Billet')) {
          this.rankMap.set(rank.abbr.toUpperCase(), rank);
        }
      });

      logger.info('MILPAC data loaded successfully', {
        ranks: this.data.ranks.filter((r) => !r.name.includes('Billet')).length,
      });
    } catch (error) {
      logger.error('Failed to load MILPAC data', { error });
      // Provide empty data structure as fallback
      this.data = {
        ranks: [],
        corps: [],
        awards: [],
        qualifications: [],
        certificates: [],
      };
    }
  }

  /**
   * Get full MILPAC data
   */
  getData(): MilpacData {
    if (!this.data) {
      this.loadData();
    }
    return this.data!;
  }

  /**
   * Look up rank by code or abbreviation
   */
  getRank(identifier: string): Rank | undefined {
    if (!identifier) return undefined;
    return this.rankMap.get(identifier.toUpperCase());
  }

  /**
   * Get all ranks filtered by billet
   */
  getRanksByBillet(billet: string): Rank[] {
    if (!this.data) return [];
    return this.data.ranks.filter(
      (r) => r.billet === billet && !r.name.includes('Billet')
    );
  }

  /**
   * Get all valid ranks (excludes billet headers)
   */
  getAllRanks(): Rank[] {
    if (!this.data) return [];
    return this.data.ranks.filter((r) => !r.name.includes('Billet'));
  }
}

export default MilpacDataService.getInstance();
