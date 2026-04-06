import mongoose from 'mongoose';
import { config } from '../src/config';
import { Member } from '../src/models';

/**
 * Sync all members from milpacs (authoritative) to members collection
 * The milpacs collection is the source of truth for all member data
 */
async function syncAllMembers() {
  try {
    await mongoose.connect(config.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true } as any);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Get all milpacs records (authoritative source)
    const milpacs = await db?.collection('milpacs').find({}).toArray();
    console.log(`\n📋 Found ${milpacs?.length} records in milpacs collection`);

    let synced = 0;
    let created = 0;
    let skipped = 0;

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
          // Keep simple format matching milpacs structure
          const memberData = {
            rank: milpac.rankName || '',
            corps: corpsNormalized,
            awards: Array.isArray(milpac.awards) ? milpac.awards.filter((a: any) => a) : [],
            qualifications: Array.isArray(milpac.qualifications) ? milpac.qualifications.filter((q: any) => q) : [],
            certificates: [],
            Uniform: '',
            badge: '',
            medallions: Array.isArray(milpac.medallions) ? milpac.medallions : [],
            citations: Array.isArray(milpac.citations) ? milpac.citations : [],
            TrainingMedals: Array.isArray(milpac.TrainingMedals) ? milpac.TrainingMedals : [],
            RifleManBadge: '',
            certificateType: 'award',
            certificateAward: '',
          };

          // Check if member exists
          const existingMember = await Member.findOne({ memberID: milpac._id?.toString() });

          if (existingMember) {
            // Update existing member
            const result = await Member.findOneAndUpdate(
              { memberID: milpac._id?.toString() },
              {
                $set: {
                  name: milpac.name || '',
                  discordID: milpac.discordUid || '',
                  data: memberData,
                  lastUpdated: new Date(),
                },
              },
              { new: true }
            );

            if (result) {
              console.log(`✓ Updated: ${milpac.name} (${milpac._id}) - Corps: ${corpsNormalized}`);
              synced++;
            }
          } else {
            // Create new member
            const newMember = new Member({
              memberID: milpac._id?.toString(),
              name: milpac.name || '',
              discordID: milpac.discordUid || '',
              data: memberData,
              lastUpdated: new Date(),
            });

            await newMember.save();
            console.log(`✨ Created: ${milpac.name} (${milpac._id}) - Corps: ${corpsNormalized}`);
            created++;
          }
        } catch (err) {
          console.error(`✗ Error processing ${milpac.name}:`, err instanceof Error ? err.message : err);
          skipped++;
        }
      }
    }

    console.log('\n═════════════════════════════════════════');
    console.log(`✅ Sync Complete:`);
    console.log(`   Updated: ${synced}`);
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${synced + created + skipped}`);
    console.log('═════════════════════════════════════════');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

syncAllMembers();
