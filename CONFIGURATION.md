# Configuration Guide

This document explains all environment variables and configuration options for the ASOT Milpac Image Generator.

## Environment Variables

| Variable              | Description                                 | Example                                  |
|----------------------|---------------------------------------------|------------------------------------------|
| WEBHOOK_API_KEY      | API key for webhook authentication          | mysecretkey                              |
| MONGO_URL            | MongoDB connection string                   | mongodb://localhost:27017/milpac         |
| REDIS_URL            | Redis connection string                     | redis://localhost:6379                   |
| IMAGE_OUTPUT_DIR     | Directory for generated images              | ./milpac                                 |
| MAX_RETRIES          | Max job retries in queue                    | 5                                        |
| JOB_TIMEOUT_MS       | Job timeout in milliseconds                 | 30000                                    |
| LOG_LEVEL            | Logging verbosity (info, debug, warn, etc.) | info                                     |

See `.env.example` for a full list and defaults.

## Image Generation
- `IMAGE_WIDTH` and `IMAGE_HEIGHT` control the output PNG size.
- Placement and asset logic is object-based, not hard-coded.

## Job Queue
- BullMQ is used for job management (Redis-backed).
- `MAX_CONCURRENT_JOBS` can be set for parallelism.

## Security
- All webhooks require a valid API key.
- Optionally, HMAC-SHA256 signatures can be enabled for extra security.

---

For more details, see [README.md](README.md) or [PROJECT.md](PROJECT.md).
