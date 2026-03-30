/**
 * Member data structure from Koda database
 */
export interface MemberData {
  name: string;
  memberID: string;
  discordID: string;
  rank: string;
  Uniform: string;
  badge: string;
  medallions: string[];
  citations: string[];
  TrainingMedals: string[];
  RifleManBadge: string;
}

/**
 * Webhook payload structure from Koda API
 */
export interface WebhookPayload {
  event: string;
  member: {
    name: string;
    memberID: string;
    discordID: string;
    changeFields: string[];
    data: MemberData;
  };
}

/**
 * Stored member record in MongoDB
 */
export interface StoredMember {
  _id?: string;
  memberID: string;
  name: string;
  discordID: string;
  data: MemberData;
  lastUpdated: Date;
  lastGenerated?: Date;
  imageUrl?: string;
}

/**
 * Generation job data
 */
export interface GenerationJob {
  jobId: string;
  memberID: string;
  name: string;
  data: MemberData;
  timestamp: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  retries: number;
}

/**
 * Generation log entry
 */
export interface GenerationLog {
  _id?: string;
  memberID: string;
  jobId: string;
  timestamp: Date;
  status: 'success' | 'failed';
  executionTime: number;
  error?: string;
  imageSize?: number;
}

/**
 * Placement configuration for image positioning
 */
export interface PlacementConfig {
  rank: PlacementPosition;
  medals: PlacementPosition;
  citations: PlacementPosition;
  badges: PlacementPosition;
  background: {
    width: number;
    height: number;
    color: string;
  };
}

/**
 * Position information for elements
 */
export interface PlacementPosition {
  x: number;
  y: number;
  spacing?: number;
  maxColumns?: number;
}

/**
 * Medal configuration
 */
export interface MedalConfig {
  id: string;
  name: string;
  imageUrl: string;
  width: number;
  height: number;
}

/**
 * Rank configuration
 */
export interface RankConfig {
  id: string;
  name: string;
  imageUrl: string;
  width: number;
  height: number;
}

/**
 * API Response structure
 */
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  error?: string;
  code?: number;
}

// Re-export MILPAC types
export type { MilpacData, Rank } from './milpac';
