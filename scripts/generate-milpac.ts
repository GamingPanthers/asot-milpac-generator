import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import { Member } from '../src/models';
import { ImageGeneratorService } from '../src/services/imageGenerator';
import { config } from '../src/config';

async function main() {
  const memberID = process.argv[2];
  if (!memberID) {
    console.error('Usage: npm run generate-milpac <memberID>');
    process.exit(1);
  }

  await mongoose.connect(config.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true } as any);
  const member = await Member.findOne({ memberID });
  if (!member) {
    console.error('No member found with memberID:', memberID);
    process.exit(1);
  }

  const generator = new ImageGeneratorService();
  const buffer = await generator.generateUniform(memberID, member.data);
  const outPath = path.join(__dirname, `../milpac/${memberID}.png`);
  fs.writeFileSync(outPath, buffer);
  console.log('Generated image at:', outPath);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
