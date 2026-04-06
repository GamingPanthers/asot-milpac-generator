/**
 * Object-based placement for medals in the medal box (from box.ts logic)
 * Each medal ID maps to a position and size
 */
export const medalBoxPlacement: Record<string, { x: number; y: number; width: number; height: number }> = {
  // Example medals, add more as needed
  Gallantry: { x: 84, y: 102, width: 74, height: 155 },
  Founders: { x: 118, y: 102, width: 74, height: 155 },
  Diplomat: { x: 152, y: 102, width: 74, height: 155 },
  'Cross Of Valour': { x: 186, y: 102, width: 74, height: 155 },
  'Group Development': { x: 220, y: 102, width: 74, height: 155 },
  'Public Relation': { x: 254, y: 102, width: 74, height: 155 },
  'Senior Leadership': { x: 288, y: 102, width: 74, height: 155 },
  'Junior Leadership': { x: 322, y: 102, width: 74, height: 155 },
  '1 year': { x: 356, y: 102, width: 74, height: 155 },
  '2 Year': { x: 390, y: 102, width: 74, height: 155 },
  '3 Year': { x: 424, y: 102, width: 74, height: 155 },
  '4 Year': { x: 458, y: 102, width: 74, height: 155 },
  // Add more medals as needed, using the same spacing logic
};

import { PlacementConfig } from '../types';

/**
 * Placement configuration for uniform image generation
 * Defines positions for rank, medals (awards), citations (certificates), and badges (qualifications)
 * 
 * Layout is designed to mimic a professional military uniform display:
 * - Rank & shoulder insignia at TOP
 * - Left chest: training badges/qualifications in vertical array
 * - Center: name and corps emblem
 * - Right chest: ribbons/citations
 * - Lower chest: medals in organized rows
 * 
 * Canvas size: 1398 x 1000
 * 
 * Mapping:
 * - medals: Used for data.awards (military decorations/medals)
 * - citations: Used for data.certificates (formal citations/commendations) - RIGHT SIDE
 * - badges: Used for data.qualifications (training badges/qualifications) - LEFT SIDE
 * - rank: Used for data.rank (military rank insignia) - SHOULDER/TOP
 */
export const placementConfig: PlacementConfig = {
  rank: {
    x: 599,
    y: 50,
    spacing: 20,
    maxColumns: 1,
  },
  medals: {
    x: 250,
    y: 500,
    spacing: 20,
    maxColumns: 7,
  },
  citations: {
    x: 1050,
    y: 180,
    spacing: 20,
    maxColumns: 1,
  },
  badges: {
    x: 50,
    y: 180,
    spacing: 20,
    maxColumns: 1,
  },
  background: {
    width: 1398,
    height: 1000,
    color: '#ffffff',
  },
};

/**
 * Get placement position for element
 */
export function getPlacement(category: 'rank' | 'medals' | 'citations' | 'badges'): any {
  return placementConfig[category];
}

/**
 * Calculate grid position for medal/citation
 */
export function calculateGridPosition(
  index: number,
  startX: number,
  startY: number,
  itemWidth: number,
  itemHeight: number,
  spacing: number,
  maxColumns: number
): { x: number; y: number } {
  const column = index % maxColumns;
  const row = Math.floor(index / maxColumns);

  return {
    x: startX + column * (itemWidth + spacing),
    y: startY + row * (itemHeight + spacing),
  };
}
