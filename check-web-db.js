const mongoose = require('mongoose');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const MEMBER_ID = '69c387d12489d9690529ddfd';

async function checkWebDatabase() {
  try {
    console.log('🔍 Connecting to MongoDB at:', MONGO_URL);
    await mongoose.connect(MONGO_URL);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.client.db('asot_milpac');
    
    // From milpacs collection - use _id directly since that's how it's stored
    const ObjectId = require('mongodb').ObjectId;
    let milpac = null;
    
    // Try as string first
    milpac = await db.collection('milpacs').findOne({ _id: MEMBER_ID });
    
    // If not found, try as ObjectId
    if (!milpac) {
      try {
        milpac = await db.collection('milpacs').findOne({ _id: new ObjectId(MEMBER_ID) });
      } catch (e) {
        // Not a valid ObjectId format
      }
    }

    // Also search by memberID or name
    if (!milpac) {
      milpac = await db.collection('milpacs').findOne({ name: 'Panther' });
    }
    
    // From members collection  
    const member = await db.collection('members').findOne({ memberID: MEMBER_ID });
    
    // From backup
    const backup = await db.collection('backups').findOne({ originalId: MEMBER_ID });

    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 DETAILED COMPARISON REPORT - PANTHER (ID: 69c387d12489d9690529ddfd)');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('SOURCE 1: milpacs collection (Military Personnel Database)');
    console.log('─'.repeat(60));
    if (milpac) {
      console.log(`✅ Name: ${milpac.name}`);
      console.log(`✅ Current Rank: ${milpac.rankName} (${milpac.rankCode})`);
      console.log(`✅ Corps: ${milpac.corps}`);
      console.log(`✅ Unit: ${milpac.unit}`);
      console.log(`✅ Billet: ${milpac.billet}`);
      console.log(`✅ Active Duty: ${milpac.activeDuty}`);
      console.log(`✅ Last Updated: ${milpac.updatedAt}`);
      console.log(`✅ Discord ID: ${milpac.discordUid}`);
    } else {
      console.log('❌ Not found in milpacs collection');
    }

    console.log('\n\nSOURCE 2: members collection (Milpac Generation Database)');
    console.log('─'.repeat(60));
    if (member) {
      console.log(`✅ Name: ${member.name}`);
      console.log(`✅ Discord ID: ${member.discordID}`);
      console.log(`✅ Rank: ${member.data?.rank}`);
      console.log(`⚠️  Corps: "${member.data?.corps || '(MISSING!)'}" `);
      console.log(`📝 Uniform: "${member.data?.Uniform || '(not set)'}" `);
      console.log(`📝 Badge: "${member.data?.badge || '(not set)'}" `);
      console.log(`📝 Citations: ${member.data?.citations?.length || 0} items`);
      console.log(`✅ Last Updated: ${member.lastUpdated}`);
      console.log(`✅ Last Generated: ${member.lastGenerated}`);
    } else {
      console.log('❌ Not found in members collection');
    }

    console.log('\n\nSOURCE 3: Backup (Pre-Update snapshot)');
    console.log('─'.repeat(60));
    if (backup) {
      console.log(`✅ Name: ${backup.name}`);
      console.log(`✅ Rank at backup: ${backup.rank}`);
      console.log(`✅ Corps (in backup): ${backup.snapshot?.corps}`);
      console.log(`✅ Unit (in backup): ${backup.snapshot?.unit}`);
      console.log(`✅ Backed up at: ${backup.backedUpAt}`);
      console.log(`ℹ️  Backup type: ${backup.backupType}`);
    } else {
      console.log('❌ No backup found');
    }

    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('🎯 FINDINGS & RECOMMENDATIONS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    if (milpac && member) {
      console.log(`1️⃣  PRIMARY SOURCE (milpacs collection):`);
      console.log(`   Corps = "${milpac.corps}"`);
      console.log(`   Rank = ${milpac.rankName}`);
      console.log(`   Unit = ${milpac.unit}`);
      
      if (milpac.corps !== (member?.data?.corps)) {
        console.log(`\n2️⃣  DATA MISMATCH DETECTED:`);
        console.log(`   ❌ members.data.corps = "${member?.data?.corps || '(EMPTY!)'}"`);
        console.log(`   ✅ milpacs.corps = "${milpac?.corps}"`);
        console.log(`   → The members collection is OUT OF SYNC with the source`);
      }

      if (backup && backup.snapshot?.corps !== milpac?.corps) {
        console.log(`\n3️⃣  RECENT CORPS CHANGE DETECTED:`);
        console.log(`   Before (backup): "${backup.snapshot?.corps}"`);
        console.log(`   After (current): "${milpac?.corps}"`);
        console.log(`   Changed at: ${backup.backedUpAt}`);
      }

      console.log(`\n4️⃣  CORRECT CORPS FOR PANTHER:`);
      console.log(`   ✅ Should be assigned to: "${milpac?.corps}"`);
      
      console.log(`\n5️⃣  ACTION REQUIRED:`);
      console.log(`   → Update members.data.corps field:`);
      console.log(`      FROM: "${member?.data?.corps || '(empty)'}" `);
      console.log(`      TO:   "${milpac?.corps}"`);
      console.log(`   → Sync command: db.members.updateOne(`);
      console.log(`        { memberID: "${MEMBER_ID}" },`);
      console.log(`        { \$set: { "data.corps": "${milpac?.corps}" } }`);
      console.log(`      )`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkWebDatabase();
