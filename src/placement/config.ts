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
