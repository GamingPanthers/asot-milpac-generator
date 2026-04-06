import mongoose from 'mongoose';
import { config } from '../src/config';

/**
 * Inspect milpacs and members collections to understand structure
 */
async function inspectCollections() {
  try {
    await mongoose.connect(config.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true } as any);
    console.log('Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    // Get one milpac record to inspect structure
    console.log('=== MILPACS COLLECTION ===');
    const milpac = await db?.collection('milpacs').findOne({});
    if (milpac) {
      console.log('Sample milpac record:');
      console.log(JSON.stringify(milpac, null, 2));
    } else {
      console.log('No milpac records found');
    }

    // Get Panther's member record
    console.log('\n=== MEMBERS COLLECTION ===');
    const member = await db?.collection('members').findOne({ memberID: '69c387d12489d9690529ddfd' });
    if (member) {
      console.log('Panther member record:');
      console.log('memberID:', member.memberID);
      console.log('name:', member.name);
      console.log('data.corps:', member.data?.corps);
      console.log('data.rank:', member.data?.rank);
    } else {
      console.log('Panther not found');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

inspectCollections();
