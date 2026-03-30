/**
 * Types for MILPAC organizational data
 */

export interface Rank {
  name: string;
  abbr: string;
  code: string;
  billet?: string;
  points: number;
}

export interface MilpacData {
  ranks: Rank[];
  callsigns: string[];
  corps: string[];
  operations: Record<string, number>;
  departments: Record<string, number>;
  awards: Array<{
    name: string;
    points: number;
  }>;
  qualifications: Array<{
    name: string;
    points: number;
    id?: string;
  }>;
  discipline: Array<{
    name: string;
    points: number;
  }>;
  certificates: Array<{
    id: string;
    name: string;
    points: number;
  }>;
}
