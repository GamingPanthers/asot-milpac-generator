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
 * Defines positions for rank, medals, citations, and badges
 */
export const placementConfig: PlacementConfig = {
  rank: {
    x: 50,
    y: 100,
    spacing: 10,
  },
  medals: {
    x: 50,
    y: 250,
    spacing: 5,
    maxColumns: 8,
  },
  citations: {
    x: 50,
    y: 550,
    spacing: 5,
    maxColumns: 8,
  },
  badges: {
    x: 50,
    y: 800,
    spacing: 10,
    maxColumns: 4,
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
