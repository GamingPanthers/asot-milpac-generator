/**
 * Template for object-based placement of specific named medals/badges in medal boxes
 * Use this for medal box generation (like box.ts) where medals need specific positions
 * 
 * For uniform generation, use the grid-based placement from config.ts instead
 * 
 * Each object ID maps to a placement config: { x, y, width, height }
 * These positions are typically used in medal box containers where medals are arranged
 * with overlapping for visual effect
 */
export const objectPlacementTemplate: Record<string, { x: number; y: number; width: number; height: number }> = {
  // Example medals for medal boxes
  "Gallantry": { x: 100, y: 120, width: 74, height: 155 },
  "Founders": { x: 134, y: 120, width: 74, height: 155 },
  // ... add all medals/ribbons/badges you want to support for medal boxes
  
  // For uniform generator, use config.ts placement instead with calculateGridPosition()
};
