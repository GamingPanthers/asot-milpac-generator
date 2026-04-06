const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/asot_milpac';
const MEMBER_ID = '69c387d12489d9690529ddfd';

// Define Member schema
const memberSchema = new mongoose.Schema({
  memberID: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  discordID: { type: String, required: true, index: true },
  data: {
    rank: { type: String, default: '' },
    corps: { type: String, default: '' },
    awards: Array,
    qualifications: Array,
    certificates: Array,
    Uniform: { type: String, default: '' },
    badge: { type: String, default: '' },
    medallions: [String],
    citations: [String],
    TrainingMedals: [String],
    RifleManBadge: { type: String, default: '' },
    certificateType: { type: String, enum: ['award', 'certificate'], default: 'award' },
    certificateAward: String,
  },
  lastUpdated: { type: Date, default: Date.now },
  lastGenerated: { type: Date },
  imageUrl: String,
}, { timestamps: true });

const Member = mongoose.model('Member', memberSchema);

async function queryPanther() {
  try {
    console.log('🔍 Connecting to MongoDB at:', MONGO_URL);
    await mongoose.connect(MONGO_URL);
    console.log('✅ Connected to MongoDB\n');

    // Query for Panther
    console.log(`📋 Querying for member ID: ${MEMBER_ID}\n`);
    const member = await Member.findOne({ memberID: MEMBER_ID });

    if (!member) {
      console.log('❌ Member not found!');
      return;
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('👤 MEMBER INFORMATION');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Name: ${member.name}`);
    console.log(`Member ID: ${member.memberID}`);
    console.log(`Discord ID: ${member.discordID}`);
    console.log('\n📊 DATA FIELDS:');
    console.log(`  - Rank: ${member.data?.rank || '(not set)'}`);
    console.log(`  - Corps: ${member.data?.corps || '(not set)'}`);
    console.log(`  - Uniform: ${member.data?.Uniform || '(not set)'}`);
    console.log(`  - Badge: ${member.data?.badge || '(not set)'}`);
    console.log(`  - RifleManBadge: ${member.data?.RifleManBadge || '(not set)'}`);
    console.log(`  - Medallions: ${member.data?.medallions?.join(', ') || '(none)'}`);
    console.log(`  - Citations: ${member.data?.citations?.join(', ') || '(none)'}`);
    console.log(`  - TrainingMedals: ${member.data?.TrainingMedals?.join(', ') || '(none)'}`);
    
    console.log('\n⏱️ METADATA:');
    console.log(`  - Last Updated: ${member.lastUpdated}`);
    console.log(`  - Last Generated: ${member.lastGenerated || 'Never'}`);
    console.log(`  - Image URL: ${member.imageUrl || '(not set)'}`);

    console.log('\n📝 FULL MEMBER DOCUMENT:');
    console.log(JSON.stringify(member.toObject(), null, 2));

    // Check if corps is empty and needs to be assigned
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🎯 CORPS ANALYSIS');
    console.log('═══════════════════════════════════════════════════════════');
    if (!member.data?.corps || member.data.corps === '') {
      console.log('⚠️  Corps field is EMPTY - needs to be assigned');
    } else {
      console.log(`✅ Corps is set to: ${member.data.corps}`);
    }

    // Check corps collection
    console.log('\n🔍 Checking milpac_corps collection...');
    const db = mongoose.connection.db;
    const corpsList = await db.collection('milpac_corps').find({}).toArray();
    console.log(`Found ${corpsList.length} corps in database:`);
    corpsList.forEach(corp => {
      console.log(`  - ${corp._id || corp.name || JSON.stringify(corp)}`);
    });

    // Check for any other documents with Panther's discord ID
    console.log('\n🔍 Checking for other members with same Discord ID...');
    const otherMembers = await Member.find({ discordID: member.discordID });
    console.log(`Found ${otherMembers.length} member(s) with Discord ID ${member.discordID}`);
    otherMembers.forEach(m => {
      console.log(`  - ${m.name} (${m.memberID}): corps = "${m.data?.corps || '(not set)'}" `);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

queryPanther();
