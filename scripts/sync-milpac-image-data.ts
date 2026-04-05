import mongoose from 'mongoose';
import { MilpacImageDataModel } from '../src/models/milpacImageData';
import { config } from '../src/config';
import { closeDb } from '../src/lib/mongo';

async function syncMilpacImageData() {
  try {
    await mongoose.connect(config.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true } as any);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection failed');

    const milpacDataList = await db.collection('milpac_data').find({}).toArray();
    console.log(`Found ${milpacDataList.length} milpac entries to sync`);

    let syncedCount = 0;
    let skippedCount = 0;

    for (const entry of milpacDataList) {
      try {
        // Validate required fields
        const memberID = entry.memberID || entry._id?.toString();
        if (!memberID) {
          console.warn(`Skipped entry without memberID:`, entry._id);
          skippedCount++;
          continue;
        }

        const imageData = {
          milpacId: entry._id?.toString() || memberID,
          memberID,
          name: entry.name || 'Unknown',
          discordID: entry.discordUid || entry.discordID || '',
          data: {
            rank: entry.rankName || entry.rank || '',
            Uniform: entry.Uniform || '',
            badge: entry.badge || '',
            medallions: entry.awards || [],
            citations: entry.citations || [],
            TrainingMedals: entry.qualifications || [],
            RifleManBadge: entry.RifleManBadge || '',
          },
          imageUrl: '',
          dateCreated: new Date(),
          dateModified: new Date(),
          lastChecked: new Date(),
          logs: [
            {
              timestamp: new Date(),
              action: 'sync',
              details: { source: 'milpac_data', entryId: entry._id?.toString() },
            },
          ],
        };

        await MilpacImageDataModel.updateOne(
          { milpacId: imageData.milpacId },
          { $set: imageData, $setOnInsert: { dateCreated: imageData.dateCreated }, $push: { logs: imageData.logs[0] } },
          { upsert: true }
        );
        console.log(`✓ Synced image data for memberID: ${memberID}`);
        syncedCount++;
      } catch (err) {
        console.error(`✗ Failed to sync entry ${entry._id}:`, err instanceof Error ? err.message : err);
        skippedCount++;
      }
    }

    console.log(`\nSync complete. Synced: ${syncedCount}, Skipped: ${skippedCount}`);
  } catch (err) {
    console.error('Fatal error during sync:', err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    await closeDb();
  }
}

syncMilpacImageData().catch(err => {
  console.error('Unhandled error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
