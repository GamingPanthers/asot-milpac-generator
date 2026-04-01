// Template for object-based placement of medals, ribbons, badges, etc.
// Each object ID maps to a placement config: { x, y, width, height }
// You can expand this as needed for your actual medals/ribbons/badges

export const objectPlacementTemplate: Record<string, { x: number; y: number; width: number; height: number }> = {
  // Example medals
  "Gallantry": { x: 100, y: 120, width: 74, height: 155 },
  "Founders": { x: 134, y: 120, width: 74, height: 155 },
  // ... add all medals/ribbons/badges you want to support
};
