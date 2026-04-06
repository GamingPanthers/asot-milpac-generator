import mongoose from 'mongoose';
import { config } from '../src/config';

/**
 * Sync all members from milpacs directly to members collection using MongoDB
 * Bypasses mongoose schema validation to preserve exact data format
 */
async function syncAllMembersRaw() {
  try {
    await mongoose.connect(config.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true } as any);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const milpacsCol = db?.collection('milpacs');
    const membersCol = db?.collection('members');

    // Get all milpacs records
    const milpacs = await milpacsCol?.find({}).toArray();
    console.log(`\n📋 Found ${milpacs?.length} records in milpacs collection\n`);

    let synced = 0;
    let created = 0;
    let errors = 0;

    if (milpacs) {
      for (const milpac of milpacs) {
        try {
          // Normalize corps
          let corpsNormalized = '';
          if (milpac.corps && typeof milpac.corps === 'string') {
            corpsNormalized = milpac.corps
              .replace('Army ', '')
              .replace(' Corp', '')
              .trim();
          }

          // Build the data object from milpac
          const memberData = {
            rank: milpac.rankName || '',
            corps: corpsNormalized,
            awards: milpac.awards || [],
            qualifications: milpac.qualifications || [],
            certificates: [],
            Uniform: '',
            badge: '',
            medallions: milpac.medallions || [],
            citations: milpac.citations || [],
            TrainingMedals: milpac.TrainingMedals || [],
            RifleManBadge: '',
            certificateType: 'award',
            certificateAward: '',
          };

          // Update or create member
          const result = await membersCol?.updateOne(
            { memberID: milpac._id?.toString() },
            {
              $set: {
                name: milpac.name || '',
                discordID: milpac.discordUid || '',
                data: memberData,
                lastUpdated: new Date(),
              },
            },
            { upsert: true }
          );

          if (result?.upsertedId) {
            console.log(`✨ Created: ${milpac.name} (${milpac._id}) - Corps: ${corpsNormalized}`);
            created++;
          } else if (result?.modifiedCount) {
            console.log(`✓ Updated: ${milpac.name} (${milpac._id}) - Corps: ${corpsNormalized}`);
            synced++;
          } else {
            console.log(`— No changes: ${milpac.name} (${milpac._id})`);
          }
        } catch (err) {
          console.error(`✗ Error processing ${milpac.name}:`, err instanceof Error ? err.message : err);
          errors++;
        }
      }
    }

    console.log('\n═════════════════════════════════════════');
    console.log(`✅ Sync Complete:`);
    console.log(`   Updated: ${synced}`);
    console.log(`   Created: ${created}`);
    console.log(`   Errors: ${errors}`);
    console.log(`   Total Processed: ${milpacs?.length || 0}`);
    console.log('═════════════════════════════════════════');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

syncAllMembersRaw();
