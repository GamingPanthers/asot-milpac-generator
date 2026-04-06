# Database Queries Documentation

## Overview

This document outlines all database queries used in the ASOT MILPAC Generator system. The system primarily queries from the `milpacs` collection (authoritative source) and uses MongoDB for data persistence.

---

## Collections

### Primary Collections

#### `milpacs` ⭐ (Authoritative Source)
- **Database:** asot_milpac
- **Purpose:** Stores all military personnel data (ranks, corps, awards, qualifications, citations)
- **Primary Key:** `_id` (ObjectId)
- **Description:** The single source of truth for all member data

#### `members` (Legacy)
- **Database:** asot_milpac
- **Purpose:** Previously used for generation, now deprecated in favor of milpacs
- **Note:** Kept for backward compatibility but not actively synced

#### `milpac_qualifications`
- **Database:** asot_milpac
- **Purpose:** Stores qualification/badge metadata and asset file paths
- **Fields:** assetFile, name

#### `milpac_certificates`
- **Database:** asot_milpac
- **Purpose:** Stores certificate/ribbon metadata and asset file paths
- **Fields:** assetFile, name

#### `milpac_awards`
- **Database:** asot_milpac
- **Purpose:** Stores award/medal metadata and asset file paths
- **Fields:** assetFile, name

---

## Query Patterns

### 1. Generate MILPAC Image Query

**File:** `scripts/generate-milpac.ts`

**Purpose:** Fetch a single member's complete data for image generation

**Query:**
```javascript
db.collection('milpacs').findOne({ _id: new ObjectId(memberID) })
```

**Parameters:**
- `memberID` (string): The member's ID (converted to ObjectId)

**Returns:**
```javascript
{
  _id: ObjectId,
  name: string,
  rankName: string,
  rankCode: string,
  corps: string,           // e.g., "Infantry Corp", "Army Aviation Corp"
  unit: string,
  billet: string,
  discordUid: string,
  activeDuty: boolean,
  awards: [string],        // Array of award names
  qualifications: [string],// Array of qualification names
  certificates: [string],  // Array of certificate IDs
  medallions: [string],
  citations: [string],
  TrainingMedals: [string],
  serviceHistory: Array,
  deploymentHistory: Array
}
```

**Example:**
```typescript
const milpac = await db?.collection('milpacs').findOne({ 
  _id: new mongoose.Types.ObjectId('69c387d12489d9690529ddfd') 
});
// Returns Panther's complete record
```

---

### 2. Job Processing Query

**File:** `src/services/jobProcessor.ts`

**Purpose:** Fetch fresh member data when processing generation jobs from queue

**Query:**
```javascript
db.collection('milpacs').findOne({ _id: new ObjectId(memberID) })
```

**Same as Query Pattern #1 above**

**Usage in Context:**
```typescript
static async processGenerationJob(job: Job<GenerationJob>): Promise<any> {
  const { memberID } = job.data;
  const milpac = await db?.collection('milpacs').findOne({ 
    _id: new mongoose.Types.ObjectId(memberID) 
  } as any);
}
```

---

### 3. Asset Information Lookup

**File:** `src/services/uniformGenerator.ts`

**Purpose:** Fetch asset metadata (image filenames) for qualifications, certificates, and awards

**Query Pattern:**
```typescript
getAssetsInfo(collectionName: string, assetNames: string[])
```

**Collections Used:**
- `milpac_qualifications` - For training badges
- `milpac_certificates` - For ribbons/citations
- `milpac_awards` - For medals

**Example:**
```typescript
// Get qualification assets
const qualAssets = await getAssetsInfo('milpac_qualifications', 
  ['Advanced Medical Course', 'Rifleman Proficiency']
);

// Returns: [
//   { assetFile: 'medical_course', name: 'Advanced Medical Course', ... },
//   { assetFile: 'rifleman', name: 'Rifleman Proficiency', ... }
// ]
```

**Asset File Mapping:**
- Qualifications → `/images/qualifications/{assetFile}.png`
- Certificates → `/images/certificates/{assetFile}.png`
- Awards → `/images/awards/{assetFile}.png`

---

### 4. Rank Data Lookup

**File:** `src/services/milpacData.ts`

**Purpose:** Lookup rank information from milpac-data.json (in-memory cache, not a database query)

**Method:**
```typescript
milpacData.getRank(identifier: string)
```

**Identifier Types:** Full name, code, or abbreviation

**Returns:**
```typescript
{
  name: string,        // e.g., "Flight Lieutenant"
  abbr: string,        // e.g., "FLT"
  code: string,        // e.g., "FLT"
  points: number,
  billet?: string
}
```

**Example:**
```typescript
const rankInfo = milpacData.getRank('Flight Lieutenant');
// Returns: { name: 'Flight Lieutenant', abbr: 'FLT', code: 'FLT', points: 225 }

// Rank image file lookup
const rankPath = path.join(__dirname, '../../images', 'ranks', `${rankInfo.code}.png`);
// Returns: /images/ranks/FLT.png
```

---

## Data Transformation Pipeline

### Input → Milpacs → Generator → Output

```
User requests generation
    ↓
Query milpacs collection (authoritative source)
    ↓
Normalize corps: "Army Aviation Corp" → "Aviation"
    ↓
Map corps to uniform: "Aviation" → "blue_uniform"
    ↓
Fetch assets from milpac_qualifications, assets, milpac_awards
    ↓
Render image using canvas
    ↓
Save to disk: /milpac/uniform/{memberID}.png
```

---

## Query Examples

### Example 1: Generate Panther's MILPAC

```typescript
// 1. Fetch member from milpacs
const milpac = await db?.collection('milpacs').findOne({
  _id: new mongoose.Types.ObjectId('69c387d12489d9690529ddfd')
});

// 2. Extract and normalize corps
const corpsNormalized = milpac.corps
  .replace('Army ', '')
  .replace(' Corp', '')
  .trim();
// Result: "Aviation"

// 3. Map to uniform selection
const uniformMap = {
  'Aviation': 'blue_uniform',
  'Infantry': 'brown_uniform',
  // ...
};
const uniform = uniformMap[corpsNormalized];
// Result: "blue_uniform"

// 4. Generate image
const buffer = await uniformGeneratorService.generateUniform('69c387d12489d9690529ddfd', memberData);
```

### Example 2: Fetch All Qualifications for a Member

```typescript
// From milpacs record
const qualifications = ['Advanced Medical Course', 'Rifleman Proficiency', ...];

// Query asset info
const qualAssets = await getAssetsInfo('milpac_qualifications', qualifications);

// Map to asset files
qualAssets.forEach(asset => {
  const imagePath = path.join(__dirname, 'images', 'qualifications', `${asset.assetFile}.png`);
  // Load and draw image at position (50, 180 + index * 100)
});
```

### Example 3: Get Rank Details

```typescript
// From milpacs: rankName = "Flight Lieutenant"
const rankInfo = milpacData.getRank('Flight Lieutenant');

// rankInfo = { name: 'Flight Lieutenant', code: 'FLT', abbr: 'FLT', points: 225 }

// Load rank insignia image
const rankPath = path.join(__dirname, 'images', 'ranks', 'FLT.png');
const rankImage = await loadImage(rankPath);
ctx.drawImage(rankImage, 0, 0, 1398, 1000);
```

---

## Corps to Uniform Mapping

```typescript
private corpsToUniformMap: { [key: string]: string } = {
  // Blue Uniform
  'Army Aviation': 'blue_uniform',
  'Army Aviation Corp': 'blue_uniform',
  'Aviation': 'blue_uniform',
  
  // Brown Uniform
  'Infantry': 'brown_uniform',
  'Infantry Corp': 'brown_uniform',
  'Engineering': 'brown_uniform',
  'Engineers': 'brown_uniform',
  'Engineers Corp': 'brown_uniform',
  'Engineering Corp': 'brown_uniform',
  'Artillery': 'brown_uniform',
  'Artillery Corp': 'brown_uniform',
  'Armor': 'brown_uniform',
  'Armour': 'brown_uniform',
  'Armour Corp': 'brown_uniform',
  'Armor Corp': 'brown_uniform',
  'Medical': 'brown_uniform',
  'Medical Corp': 'brown_uniform',
  'Support': 'brown_uniform',
  'Support Corp': 'brown_uniform',
  'Command': 'brown_uniform',
  'Command Corp': 'brown_uniform',
  'Zeus': 'brown_uniform',
  'Zeus Corp': 'brown_uniform'
};
```

---

## File and Image Asset Queries

### Rank Images
- **Query:** Direct file system check using rank code
- **Path:** `/images/ranks/{rankCode}.png`
- **Example:** `/images/ranks/FLT.png` for Flight Lieutenant

### Qualification Images  
- **Query:** `getAssetsInfo('milpac_qualifications', names)`
- **Path:** `/images/qualifications/{assetFile}.png`
- **Example:** `/images/qualifications/medical_course.png`

### Certificate Images
- **Query:** `getAssetsInfo('milpac_certificates', names)`
- **Path:** `/images/certificates/{assetFile}.png`
- **Example:** `/images/certificates/service_citation_1yr.png`

### Award/Medal Images
- **Query:** `getAssetsInfo('milpac_awards', names)`
- **Path:** `/images/awards/{assetFile}.png`
- **Example:** `/images/awards/bronze_medallion.png`

### Uniform Images
- **Path:** `/images/uniform/{uniformType}.png`
- **Types:** 
  - `blue_uniform.png` (Army Aviation)
  - `brown_uniform.png` (All other corps)

### Border Frame
- **Path:** `/images/border.png`

---

## MongoDB Connection

### Configuration

```typescript
// From src/config.ts
MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/asot_milpac'
```

### Connection

```typescript
await mongoose.connect(config.MONGO_URL, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
} as any);

const db = mongoose.connection.db;
```

---

## Synchronization

### Direct Synchronization (Not Required Anymore)

> **Note:** Previously required manual syncing from milpacs to members collection. This is **NO LONGER NEEDED** as the generator now queries milpacs directly.

**Legacy Sync Script:** `scripts/sync-members-raw.ts`
- Used to: Update members collection from milpacs (one-time only)
- Status: Deprecated - manual use only if needed

---

## Performance Considerations

### Indexing

**Recommended Indexes:**
```javascript
db.milpacs.createIndex({ _id: 1 })           // Primary lookup
db.milpacs.createIndex({ name: 1 })          // Search by name
db.milpacs.createIndex({ corps: 1 })         // Filter by corps
db.milpacs.createIndex({ discordUid: 1 })    // Search by Discord ID
db.milpac_qualifications.createIndex({ name: 1 })
db.milpac_certificates.createIndex({ name: 1 })
db.milpac_awards.createIndex({ name: 1 })
```

### Query Patterns
- **Primary Query:** `milpacs._id` - Indexed, single document lookup (Fast ✓)
- **Asset Queries:** Collection queries by name - Should be indexed (Check indexes)
- **In-Memory:** Rank data loaded once at startup into memory

---

## Error Handling

### Common Query Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Member not found` | Invalid memberID | Verify memberID exists in milpacs |
| `Qualification not found` | Asset missing | Check milpac_qualifications collection |
| `Rank not found` | Invalid rank name | Verify rank exists in milpac-data.json |
| `Asset file not found` | Missing image | Check /images directory has file |

---

## Future Improvements

- [ ] Add query caching layer for frequently accessed members
- [ ] Implement batch queries for multiple members
- [ ] Add query monitoring/logging for performance tracking
- [ ] Cache asset metadata in memory during service startup
- [ ] Add database connection pooling optimization

