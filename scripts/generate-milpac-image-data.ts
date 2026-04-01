import fs from 'fs';
import path from 'path';

// Paths to your JSON files
const milpacsPath = path.resolve('c:/Users/Andrew/Documents/asot_milpac.milpacs.json');
const outputPath = path.resolve('c:/Users/Andrew/Documents/asot_milpac.members.json');

// Read milpac_data (asot_milpac.milpacs.json)
const milpacData = JSON.parse(fs.readFileSync(milpacsPath, 'utf-8'));

// Transform milpac_data to milpac_image_data format
const imageData = milpacData.map((entry: any) => {
  return {
    memberID: entry._id?.$oid || entry._id || entry.memberID,
    name: entry.name,
    discordID: entry.discordUid || entry.discordID,
    data: {
      rank: entry.rankName || entry.rank || '',
      Uniform: '', // Fill as needed
      badge: '', // Fill as needed
      medallions: entry.awards || [],
      citations: entry.awards?.filter((a: string) => a.includes('Citation')) || [],
      TrainingMedals: entry.qualifications || [],
      RifleManBadge: '', // Fill as needed
    },
    lastUpdated: new Date(),
    imageUrl: '', // Fill as needed
  };
});

// Write to milpac_image_data (asot_milpac.members.json)
fs.writeFileSync(outputPath, JSON.stringify(imageData, null, 2));
console.log('Generated asot_milpac.members.json from asot_milpac.milpacs.json');
