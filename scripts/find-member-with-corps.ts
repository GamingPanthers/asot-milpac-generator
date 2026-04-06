import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import logger from '../src/utils/logger';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import the Member model
import { Member } from '../src/models';

/**
 * Find a member with a non-empty corps value for testing
 */
async function findMemberWithCorps(): Promise<void> {
  try {
    // Connect to MongoDB
    const mongoUrl = process.env.MONGO_URL;
    if (!mongoUrl) {
      throw new Error('MONGO_URL environment variable is not set');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUrl);
    console.log('✓ Connected to MongoDB\n');

    // Define the corps values we're looking for
    const validCorpsValues = [
      'Infantry Corp',
      'Army Aviation Corp',
      'Engineers Corp',
      'Artillery Corp',
      'Armour Corp',
      'Medical Corp',
      'Zeus Corp'
    ];

    console.log(`Searching for members with corps values: ${validCorpsValues.join(', ')}\n`);

    // Query for members with a non-empty corps value
    const members = await Member.find({
      'data.corps': { $in: validCorpsValues }
    })
      .select('memberID data.corps')
      .limit(10);

    if (members.length === 0) {
      console.log('No members found with the specified corps values.');
      
      // Let's check what corps values exist in the database
      console.log('\nChecking what corps values exist in the database...\n');
      const allCorpsValues = await Member.aggregate([
        { $match: { 'data.corps': { $ne: '' } } },
        { $group: { _id: '$data.corps', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      if (allCorpsValues.length === 0) {
        console.log('No members have a corps value set.');
      } else {
        console.log('Corps values found in database:');
        allCorpsValues.forEach((item: any) => {
          console.log(`  - "${item._id}": ${item.count} member(s)`);
        });
      }
    } else {
      console.log(`Found ${members.length} member(s) with valid corps values:\n`);
      members.forEach((member: any, index: number) => {
        console.log(`${index + 1}. Member ID: ${member.memberID}`);
        console.log(`   Corps: ${member.data.corps}`);
        console.log();
      });
    }

    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
findMemberWithCorps();
