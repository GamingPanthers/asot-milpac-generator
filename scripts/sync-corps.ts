import mongoose from 'mongoose';
import { config } from '../src/config';
import { Member } from '../src/models';

/**
 * Sync corps from milpacs (authoritative) to members collection
 */
async function syncCorps() {
  try {
    await mongoose.connect(config.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true } as any);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Get all milpacs and update corresponding members
    const milpacs = await db?.collection('milpacs').find({}).toArray();
    console.log(`Found ${milpacs?.length} milpacs records`);

    let updated = 0;
    if (milpacs) {
      for (const milpac of milpacs) {
        if (milpac.memberID && milpac.corps) {
          // Normalize corps to match database format (remove "Corp" suffix if present)
          let corpsValue = milpac.corps;
          if (typeof corpsValue === 'string') {
            // Convert "Infantry Corp" -> "Infantry", "Army Aviation Corp" -> "Aviation"
            corpsValue = corpsValue
              .replace(' Corp', '')
              .replace('Army ', '')
              .trim();
          }

          const result = await Member.findOneAndUpdate(
            { memberID: milpac.memberID },
            { $set: { 'data.corps': corpsValue } },
            { new: true }
          );

          if (result) {
            updated++;
            console.log(`✓ Updated ${milpac.memberID}: ${corpsValue}`);
          }
        }
      }
    }

    console.log(`\n✓ Synced ${updated} member records with corps from milpacs`);
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

syncCorps();
