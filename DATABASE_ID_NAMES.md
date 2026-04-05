# 📊 Database Collection & ID Reference

This document is the **authoritative reference** for MongoDB collections used by the ASOT Milpac Image Generator.

---

## Collections & ID Fields

| Collection Name | Description | ID Field Type | Example Value |
|-----------------|-------------|--------|--------|
| `members` | Personnel records (name, rank, medals, etc.) | string/ObjectId | "12345" |
| `milpac_ranks` | Military rank insignia data | string/ObjectId | "SGT", "CPT" |
| `milpac_badges` | Corps badge/insignia data | string/ObjectId | "Infantry", "Armor" |
| `milpac_medallions` | Medal decorations data | string/ObjectId | "Bronze1", "Silver2" |
| `milpac_citations` | Service ribbons/citations data | string/ObjectId | "campaign", "gallantry" |
| `milpac_training_medals` | Training badge/qualification data | string/ObjectId | "ExpR", "CQB" |
| `milpac_corps` | Corps uniform/collar template data | string/ObjectId | "Infantry", "Armor" |
| `milpac_image_data` | Image generation logs (schema in PROJECT.md) | ObjectId | Auto-generated |

---

## 📝 Collection Document Structure

Each collection document contains:

**Standard Fields:**
- `_id` — Unique identifier (primary key)
- `assetFile` — Image filename (e.g., "sgt_chevrons.png", "infantry_badge.png")
- `name` — Human-readable name (optional)
- `position` — Rendering position data (x, y, zIndex) (optional)

**Asset Location:**
- Asset files are stored in the `images/` directory
- Reference path pattern: `images/{category}/{assetFile}`
- Example: `images/ranks/sgt_chevrons.png`, `images/badges/infantry_badge.png`

---

## 🔍 Lookup Behavior

**Case Handling:**
- Most lookups are case-insensitive
- IDs are trimmed (leading/trailing whitespace removed)
- Allows flexible input from the web service

**Missing Assets:**
- If an asset is not found, generation queues anyway
- Job fails during processing with clear error message
- Check logs for asset ID that couldn't be found

---

## 🔗 Related Documentation

- **[PROJECT.md#database-collections--data-flow](PROJECT.md#database-collections--data-flow)** — Detailed data flow examples
- **[PROJECT.md#data-models](PROJECT.md#data-models)** — JSON schema definitions
- **[SETUP.md#database-setup](SETUP.md#database-setup)** — Create collections & indexes
- **[API_REFERENCE.md](API_REFERENCE.md)** — Request/response models

---

## 📋 Database Initialization

See [SETUP.md#database-setup](SETUP.md#database-setup) for scripts to create collections, indexes, and sample data.

```javascript
// Quick reference - create essential collections:
db.createCollection("members");
db.createCollection("milpac_ranks");
db.createCollection("milpac_badges");
db.createCollection("milpac_medallions");
db.createCollection("milpac_citations");
db.createCollection("milpac_training_medals");
db.createCollection("milpac_corps");
db.createCollection("milpac_image_data");

// Add indexes
db.milpac_ranks.createIndex({ _id: 1 });
db.members.createIndex({ memberID: 1 }, { unique: true });
// ... see SETUP.md for full index recommendations
```

---

## 🎯 Tips

- All `_id` values should be strings or ObjectIds (consistent type per collection)
- Asset files must exist in the `images/` directory with correct filenames
- Missing assets will cause job failures (logged with clear error)
- To debug asset lookups, check logs for "Asset not found" messages

---

For comprehensive information about data flow, see [PROJECT.md](PROJECT.md).
