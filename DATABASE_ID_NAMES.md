# Database Collection & ID Reference

This document lists all MongoDB collection names and the expected ID fields used by the ASOT Milpac Image Generator.

## Collections & ID Fields

| Collection Name         | Description                | ID Field (_id) Type | Example Value           |
|------------------------|----------------------------|---------------------|------------------------|
| milpac_badges          | Corps badges               | string/ObjectId     | "Infantry" or ObjectId|
| milpac_ranks           | Rank insignia              | string/ObjectId     | "SGT" or ObjectId     |
| milpac_medallions      | Medals                     | string/ObjectId     | "Bronze1"             |
| milpac_citations       | Service ribbons/citations  | string/ObjectId     | "1year"               |
| milpac_training_medals | Training medals/badges     | string/ObjectId     | "ExpR"                |
| milpac_corps           | Corps uniform/collar data  | string/ObjectId     | "Infantry"            |
| members                | Personnel records          | string/ObjectId     | "12345"               |

## Notes
- All lookups are case-insensitive where applicable.
- Some collections use string IDs (e.g., "SGT"), others may use MongoDB ObjectId.
- Asset files are referenced by the `assetFile`, `collarFile`, or `uniformFile` fields in each document.

---

For more, see the asset lookup logic in `src/lib/mongo.ts` and the main README.
