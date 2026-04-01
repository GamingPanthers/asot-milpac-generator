import mongoose from 'mongoose';
import { MilpacImageDataModel } from '../src/models/milpacImageData';
import { config } from '../src/config';

// Example: import your milpac_data model here
// import { MilpacDataModel } from '../src/models/milpacData';

async function syncMilpacImageData() {
  await mongoose.connect(config.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true } as any);

  // TODO: Replace with your actual milpac_data model and query
  const milpacDataList = await mongoose.connection.db.collection('milpac_data').find({}).toArray();

  for (const entry of milpacDataList) {
    const imageData = {
      milpacId: entry._id?.toString() || entry._id,
      memberID: entry.memberID || entry._id?.toString(),
      name: entry.name,
      discordID: entry.discordUid || entry.discordID,
      data: entry, // Store full snapshot for traceability
      imageUrl: '', // Fill in after image generation
      dateCreated: new Date(),
      dateModified: new Date(),
      lastChecked: new Date(),
      logs: [
        {
          timestamp: new Date(),
          action: 'sync',
          details: { source: 'milpac_data', entryId: entry._id?.toString() || entry._id },
        },
      ],
    };
    await MilpacImageDataModel.updateOne(
      { milpacId: imageData.milpacId },
      { $set: imageData, $setOnInsert: { dateCreated: imageData.dateCreated }, $push: { logs: imageData.logs[0] } },
      { upsert: true }
    );
    console.log(`Synced image data for milpacId: ${imageData.milpacId}`);
  }

  await mongoose.disconnect();
  console.log('Sync complete.');
}

syncMilpacImageData().catch(err => {
  console.error('Error during sync:', err);
  process.exit(1);
});
