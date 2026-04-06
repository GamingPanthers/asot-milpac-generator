
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import { Member } from '../src/models';
import { UniformGeneratorService } from '../src/services/uniformGenerator';
import { config } from '../src/config';
import { closeDb } from '../src/lib/mongo';
import BatchQueryService from '../src/services/batchQueryService';
import { performanceMonitor } from '../src/services/performanceMonitor';
import logger from '../src/utils/logger';

async function main() {
  const memberID = process.argv[2];
  if (!memberID) {
    console.error('Usage: npm run generate-milpac <memberID>');
    process.exit(1);
  }

  // Validate memberID format (basic check)
  if (typeof memberID !== 'string' || memberID.trim().length === 0) {
    console.error('Invalid memberID provided');
    process.exit(1);
  }

  try {
    await mongoose.connect(config.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true } as any);
    console.log('Connected to MongoDB');

    // Fetch member using batch query service (with caching)
    const queryStartTime = Date.now();
    const milpac = await BatchQueryService.fetchMember(memberID);
    const queryDuration = Date.now() - queryStartTime;
    
    // Record performance metric
    performanceMonitor.recordQuery('fetch_member', queryDuration, {
      success: !!milpac,
      documentsReturned: milpac ? 1 : 0,
    });

    if (!milpac) {
      console.error(`No member found with memberID: ${memberID}`);
      process.exit(1);
    }

    console.log(`Generating image for member: ${milpac.name} (${memberID})`);
    
    // Normalize corps from "Army Aviation Corp" to "Aviation"
    let corpsNormalized = '';
    if (milpac.corps && typeof milpac.corps === 'string') {
      corpsNormalized = milpac.corps
        .replace('Army ', '')
        .replace(' Corp', '')
        .trim();
    }

    // Transform milpac data to generator format
    const memberData = {
      rank: milpac.rankName || '',
      corps: corpsNormalized,
      awards: milpac.awards || [],
      qualifications: milpac.qualifications || [],
      certificates: [],
      name: milpac.name,
      Uniform: '',
      badge: '',
      medallions: milpac.medallions || [],
      citations: milpac.citations || [],
      TrainingMedals: milpac.TrainingMedals || [],
      RifleManBadge: '',
      certificateType: 'award',
      certificateAward: '',
    };

    const generator = new UniformGeneratorService();
    const generateStartTime = Date.now();
    const buffer = await generator.generateUniform(memberID, memberData);
    const generateDuration = Date.now() - generateStartTime;

    performanceMonitor.recordQuery('generate_uniform', generateDuration, {
      success: true,
    });

    // Ensure output directory exists
    const outDir = path.join(__dirname, '../milpac/uniform');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const outPath = path.join(outDir, `${memberID}.png`);
    fs.writeFileSync(outPath, buffer);
    console.log(`✓ Generated image at: ${outPath} (${buffer.length} bytes)`);

    // Log performance statistics
    performanceMonitor.logStats();
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : err);
    performanceMonitor.logStats();
    process.exit(1);
  } finally {
    // Only disconnect once
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      await closeDb();
    } catch (disconnectErr) {
      console.error('Error during cleanup:', disconnectErr instanceof Error ? disconnectErr.message : disconnectErr);
    }
  }
}

main();
