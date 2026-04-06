import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Member } from '../src/models';

dotenv.config();

async function queryMembers() {
  try {
    const mongoUrl = process.env.MONGO_URL;
    if (!mongoUrl) throw new Error('MONGO_URL not set');
    
    await mongoose.connect(mongoUrl);
    console.log('Querying members with valid corps values...\n');
    
    const validCorps = ['Infantry', 'Command', 'Artillery', 'Engineering', 'Armor', 'Support'];
    
    const members = await Member.find({
      'data.corps': { $in: validCorps }
    })
      .select('memberID data.corps')
      .limit(5);
    
    console.log(`Found ${members.length} members:\n`);
    members.forEach((m: any) => {
      console.log(`✓ Member ID: ${m.memberID}`);
      console.log(`  Corps: ${m.data.corps}\n`);
    });
    
    if (members.length > 0) {
      console.log(`Use Member ID: ${members[0].memberID} with corps: ${members[0].data.corps} for testing`);
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

queryMembers();
