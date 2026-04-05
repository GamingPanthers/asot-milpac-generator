
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import { Member } from '../src/models';
import { ImageGeneratorService } from '../src/services/imageGenerator';
import { config } from '../src/config';
import { closeDb } from '../src/lib/mongo';

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

    const member = await Member.findOne({ memberID });
    if (!member) {
      console.error(`No member found with memberID: ${memberID}`);
      process.exit(1);
    }

    console.log(`Generating image for member: ${member.name} (${memberID})`);
    const generator = new ImageGeneratorService();
    const buffer = await generator.generateUniform(memberID, member.data);

    // Ensure output directory exists
    const outDir = path.join(__dirname, '../milpac');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const outPath = path.join(outDir, `${memberID}.png`);
    fs.writeFileSync(outPath, buffer);
    console.log(`✓ Generated image at: ${outPath} (${buffer.length} bytes)`);
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : err);
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
