const mongoose = require('mongoose');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const MEMBER_ID = '69c387d12489d9690529ddfd';

async function exploreDatabase() {
  try {
    console.log('🔍 Connecting to MongoDB at:', MONGO_URL);
    await mongoose.connect(MONGO_URL);
    console.log('✅ Connected to MongoDB\n');

    const admin = mongoose.connection.getClient().db('admin');
    
    // List all databases
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📚 AVAILABLE DATABASES');
    console.log('═══════════════════════════════════════════════════════════');
    const databases = await admin.admin().listDatabases();
    const dbNames = databases.databases.map(db => db.name);
    console.log('Databases:', dbNames.join(', '), '\n');

    // Search in each database for our member
    for (const dbName of dbNames) {
      if (dbName === 'admin' || dbName === 'config' || dbName === 'local') continue;
      
      console.log(`\n🔎 Searching in database: "${dbName}"`);
      console.log('─'.repeat(60));
      
      const db = mongoose.connection.client.db(dbName);
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      console.log(`Collections: ${collectionNames.join(', ')}\n`);

      for (const collName of collectionNames) {
        const coll = db.collection(collName);
        
        // Find member by ID
        const doc = await coll.findOne({ memberID: MEMBER_ID });
        if (doc) {
          console.log(`✅ FOUND in "${dbName}"."${collName}":`);
          console.log(JSON.stringify(doc, null, 2));
          continue;
        }

        // Find member by name containing "Panther"
        const docByName = await coll.findOne({ name: { $regex: 'Panther', $options: 'i' } });
        if (docByName) {
          console.log(`✅ FOUND (by name) in "${dbName}"."${collName}":`);
          console.log(JSON.stringify(docByName, null, 2));
          continue;
        }

        // Check if this is a member or user collection
        const count = await coll.countDocuments();
        console.log(`  📋 "${collName}" - ${count} documents`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

exploreDatabase();
