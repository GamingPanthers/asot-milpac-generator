import fs from 'fs';
import path from 'path';

// Read input path from command line or use defaults
const args = process.argv.slice(2);
const inputPath = args[0] || 'asot_milpac.milpacs.json';
const outputPath = args[1] || 'asot_milpac.members.json';

// Validate input file exists
if (!fs.existsSync(inputPath)) {
  console.error(`Input file not found: ${inputPath}`);
  console.error(`Usage: npm run generate-milpac-image-data <inputFile> <outputFile>`);
  process.exit(1);
}

try {
  console.log(`Reading milpac data from: ${inputPath}`);
  const milpacData = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

  if (!Array.isArray(milpacData)) {
    throw new Error('Input file must contain an array of milpac entries');
  }

  console.log(`Processing ${milpacData.length} entries...`);

  // Transform milpac_data to milpac_image_data format
  const imageData = milpacData.map((entry: any, index: number) => {
    // Validate required fields
    if (!entry.memberID && !entry._id) {
      console.warn(`Entry ${index} missing memberID and _id, skipping`);
      return null;
    }

    return {
      memberID: entry.memberID || entry._id?.$oid || entry._id?.toString(),
      name: entry.name || 'Unknown',
      discordID: entry.discordUid || entry.discordID || '',
      rank: entry.rankName || entry.rank || '',
      data: {
        rank: entry.rankName || entry.rank || '',
        Uniform: entry.Uniform || '',
        badge: entry.badge || '',
        medallions: Array.isArray(entry.awards) ? entry.awards : [],
        citations: Array.isArray(entry.awards)
          ? entry.awards.filter((a: string) => typeof a === 'string' && a.includes('Citation'))
          : [],
        TrainingMedals: Array.isArray(entry.qualifications) ? entry.qualifications : [],
        RifleManBadge: entry.RifleManBadge || '',
      },
      dateCreated: new Date().toISOString(),
      dateModified: new Date().toISOString(),
      imageUrl: '',
    };
  }).filter((entry: any) => entry !== null);

  // Write output
  fs.writeFileSync(outputPath, JSON.stringify(imageData, null, 2));
  console.log(`✓ Generated ${imageData.length} entries in: ${outputPath}`);
  console.log(`  Skipped: ${milpacData.length - imageData.length} entries with missing data`);
} catch (err) {
  console.error('Error processing file:', err instanceof Error ? err.message : err);
  process.exit(1);
}
