import { MongoClient, Db, ObjectId } from 'mongodb';

const uri = process.env.MONGO_URL || 'mongodb://localhost:27017/milpac';
let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (db) return db;
  if (!client) {
    client = new MongoClient(uri); // removed useUnifiedTopology
    await client.connect();
  }
  db = client.db();
  return db;
}

export async function closeDb() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

// Fetch asset info from DB by collection and ID (handles string or ObjectId)
export async function getAssetInfo(collection: string, id: string) {
  const db = await getDb();
  const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
  // Cast filter as any to satisfy TS for mixed _id types
  return db.collection(collection).findOne(filter as any);
}

// Fetch multiple assets by IDs (handles string or ObjectId)
export async function getAssetsInfo(collection: string, ids: string[]) {
  const db = await getDb();
  const objectIds = ids.map(id => ObjectId.isValid(id) ? new ObjectId(id) : id);
  // Cast filter as any to satisfy TS for mixed _id types
  return db.collection(collection).find({ _id: { $in: objectIds } } as any).toArray();
}
