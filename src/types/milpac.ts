/**
 * Types for MILPAC organizational data
 */

export interface Rank {
  name: string;
  abbr: string;
  code: string;
  billet?: string;
}

export interface MilpacData {
  ranks: Rank[];
  corps: string[];
  awards: Array<{
    name: string;
    points?: number;
  }>;
  qualifications: Array<{
    name: string;
    points?: number;
    id?: string;
  }>;
  certificates: Array<{
    id: string;
    name: string;
    points?: number;
  }>;
}
