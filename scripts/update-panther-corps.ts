import mongoose from 'mongoose';
import { config } from '../src/config';
import { Member } from '../src/models';

/**
 * Direct update of Panther's corps from milpacs source
 */
async function updatePantherCorps() {
  try {
    await mongoose.connect(config.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true } as any);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Convert string ID to ObjectId for milpacs query
    const pantherObjectId = new mongoose.Types.ObjectId('69c387d12489d9690529ddfd');
    
    // Get Panther's milpac record to get the authoritative corps value
    const milpac = await db?.collection('milpacs').findOne({ _id: pantherObjectId });
    
    if (!milpac) {
      console.log('Panther not found in milpacs');
      await mongoose.disconnect();
      return;
    }

    console.log('Found Panther in milpacs:');
    console.log('  Corps:', milpac.corps);
    console.log('  Rank:', milpac.rankName);

    // Normalize corps - convert "Infantry Corp" -> "Infantry"
    const corpsNormalized = milpac.corps.replace(' Corp', '').trim();
    console.log('  Corps (normalized):', corpsNormalized);

    // Update member record
    const result = await Member.findOneAndUpdate(
      { memberID: '69c387d12489d9690529ddfd' },
      { $set: { 'data.corps': corpsNormalized } },
      { new: true }
    );

    if (result) {
      console.log('\n✓ Updated Panther member:');
      console.log('  data.corps:', result.data.corps);
    } else {
      console.log('✗ Member not found');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

updatePantherCorps();
