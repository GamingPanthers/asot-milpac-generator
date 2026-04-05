# 🪖 ASOT Milpac Generator - Complete Project Documentation

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Folder Structure](#folder-structure)
3. [API Endpoints](#api-endpoints)
4. [Service Architecture](#service-architecture)
5. [Configuration & Setup](#configuration--setup)
6. [Development Guide](#development-guide)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)
9. [Database Collections & Data Flow](#database-collections--data-flow)

---

## 🎯 Project Overview

**ASOT Milpac Generator** is an automated military uniform image generation service that:

- **Listens** for member data changes via webhooks from the asot-milpac-web service
- **Detects** if visual-relevant fields have changed (rank, medals, badges, etc.)
- **Queues** image generation jobs asynchronously using BullMQ
- **Renders** high-quality PNG uniform images using Node Canvas
- **Persists** generated images and metadata to MongoDB
- **Integrates** seamlessly with the web service for real-time updates

### Key Characteristics

✅ **Fully Database-Driven** — All asset lookups are dynamic from MongoDB  
✅ **Event-Driven Architecture** — Webhook-triggered processing with async job queue  
✅ **Fault-Tolerant** — Automatic retries, error logging, and graceful degradation  
✅ **Production-Ready** — TypeScript, comprehensive logging, Docker support  
✅ **Scalable** — BullMQ + Redis for distributed job processing  

---

## 📁 Folder Structure

```
asot-milpac-generator/
│
├── 📄 package.json                 # NPM dependencies and scripts
├── 📄 tsconfig.json                # TypeScript configuration
├── 📄 jest.config.js               # Jest testing configuration
├── 📄 README.md                    # Quick start guide
├── 📄 CONFIGURATION.md             # Environment variables reference
├── 📄 DATABASE_ID_NAMES.md         # MongoDB collections reference
├── 📄 PROJECT.md                   # This file (comprehensive docs)
├── 📄 docker-compose.yml           # Docker services (MongoDB, Redis)
├── 📄 Dockerfile                   # Container image definition
│
├── 📂 src/                         # TypeScript source code (compiled to dist/)
│   │
│   ├── 📄 index.ts                 # Application entrypoint
│   │                                # - Express server initialization
│   │                                # - Route registration
│   │                                # - Graceful shutdown handlers
│   │
│   ├── 📂 config/
│   │   └── 📄 index.ts             # Configuration loader & validators
│   │                                # - Environment variable parsing
│   │                                # - Default values
│   │                                # - Config validation
│   │
│   ├── 📂 routes/
│   │   └── 📄 index.ts             # Express route definitions
│   │                                # POST   /webhook               (webhook receiver)
│   │                                # GET    /status/:jobId          (job status check)
│   │                                # GET    /queue/stats            (queue statistics)
│   │                                # GET    /health                 (health check)
│   │
│   ├── 📂 middleware/
│   │   └── 📄 webhookHandler.ts    # Webhook validation & processing
│   │                                # - Authorization validation
│   │                                # - Payload validation
│   │                                # - Change field detection
│   │                                # - Job queuing logic
│   │
│   ├── 📂 services/
│   │   ├── 📄 database.ts          # MongoDB connection service (singleton)
│   │   ├── 📄 queue.ts             # BullMQ job queue wrapper
│   │   ├── 📄 jobProcessor.ts      # Job execution & logging
│   │   ├── 📄 imageGenerator.ts    # Canvas-based image rendering
│   │   ├── 📄 member.ts            # Member data service
│   │   ├── 📄 milpacData.ts        # Asset lookup service
│   │   ├── 📄 storage.ts           # File system operations
│   │   └── 📄 webIntegration.ts    # Communication with web service
│   │
│   ├── 📂 lib/
│   │   └── 📄 mongo.ts             # MongoDB asset queries & helpers
│   │                                # - Asset retrieval from collections
│   │                                # - Case-insensitive lookups
│   │
│   ├── 📂 models/
│   │   ├── 📄 index.ts             # Mongoose model exports
│   │   └── 📄 milpacImageData.ts   # MongoDB collection schema
│   │
│   ├── 📂 types/
│   │   ├── 📄 index.ts             # Shared type definitions
│   │   ├── 📄 milpac.ts            # Milpac-specific types
│   │   └── 📄 pngjs.d.ts           # PNG.js type definitions
│   │
│   ├── 📂 utils/
│   │   └── 📄 logger.ts            # Winston logging setup
│   │                                # - Configurable log levels
│   │                                # - File & console output
│   │
│   └── 📂 __tests__/
│       └── 📄 config.test.ts       # Jest unit tests
│
├── 📂 scripts/
│   ├── 📄 generate-milpac.ts       # Script to generate single uniform
│   ├── 📄 sync-milpac-image-data.ts # Sync image metadata
│   └── 📄 generate-milpac-image-data.ts # Batch image data generation
│
├── 📂 images/                      # Asset image files (PNG/JPG)
│   ├── 📂 corps-badges/            # Corps insignia images
│   ├── 📂 embellishments/          # Shoulder boards, insignia details
│   ├── 📂 medallions/              # Medal images
│   ├── 📂 ranks/                   # Military rank insignia (SGT, LT, etc.)
│   ├── 📂 ribbons/                 # Merit ribbons
│   ├── 📂 training/                # Training badge categories
│   │   ├── armoured-crewman/
│   │   ├── cqb/
│   │   ├── fixed-wing/
│   │   ├── fo-and-jtac/
│   │   ├── idf/
│   │   ├── medical/
│   │   ├── nco/
│   │   ├── parradrop-halo/
│   │   ├── rotary/
│   │   ├── special-forces/
│   │   └── weapons/
│   └── 📂 uniform/                 # Base uniform template images
│
├── 📂 milpac/                      # Generated uniform output directory
│   └── 📂 uniform/                 # Generated PNG files ({memberID}.png)
│       └── 12345.png               # Example: Generated uniform for member 12345
│
├── 📂 public/
│   ├── 📄 medals.json              # Medal metadata (non-database, reference)
│   ├── 📄 milpac-data.json         # Member milpac data (non-database, reference)
│   └── 📂 fonts/                   # TrueType fonts for text rendering
│
├── 📂 logs/                        # Generated application logs
│   └── milpac.log                  # Main application log file
│
└── 📂 dist/                        # Compiled JavaScript (generated by tsc)
    └── [compiled JS files]
```

### Key Directory Descriptions

| Directory | Purpose |
|-----------|---------|
| **src/** | TypeScript source code (organized by concern: routes, services, middleware) |
| **images/** | Asset library for uniform generation (ranks, medals, badges, training icons) |
| **milpac/uniform/** | Output directory for generated uniform PNG files |
| **public/fonts/** | TrueType fonts for rendering member names on uniforms |
| **scripts/** | Utility scripts for batch operations and data generation |
| **dist/** | Compiled JavaScript output (created by `npm run build`) |

---

## 🔌 API Endpoints

All endpoints are prefixed with `http://localhost:42070` (default port configurable via `PORT` env var).

### 1️⃣ POST /webhook

**Purpose:** Receive member update notifications and trigger uniform generation

**Authorization:**
```
Authorization: Bearer {WEBHOOK_API_KEY}
```

**Request Headers:**
```
Content-Type: application/json
```

**Request Body - Schema:**
```typescript
{
  event: "member.updated" | "certificate.requested",
  member: {
    name: string,
    memberID: string,
    discordID: string,
    changeFields?: string[],  // Optional: fields that changed (optimization)
    data: {
      rank?: string,
      Uniform?: string,        // "Blue", "Brown", etc.
      badge?: string,          // Corps badge name
      medallions?: string[],   // Medal IDs
      citations?: string[],    // Ribbon/citation IDs
      TrainingMedals?: string[], // Training badge IDs
      RifleManBadge?: string,  // Marksmanship badge
      [key: string]: any       // Other fields (ignored for image generation)
    }
  }
}
```

**Request Example:**
```json
{
  "event": "member.updated",
  "member": {
    "name": "John Smith",
    "memberID": "12345",
    "discordID": "987654321",
    "changeFields": ["rank", "medallions"],
    "data": {
      "rank": "SGT",
      "Uniform": "Blue",
      "badge": "Infantry",
      "medallions": ["Bronze1", "Silver2"],
      "citations": ["campaign", "gallantry"],
      "TrainingMedals": ["ExpR", "CQB"],
      "RifleManBadge": "PTE"
    }
  }
}
```

**Response - Success (200):**
```json
{
  "status": "queued",
  "message": "Image generation queued for MemberID 12345",
  "code": 200,
  "data": {
    "jobId": "job_550e8400-e29b-41d4-a716-446655440000",
    "memberID": "12345",
    "queued": true
  }
}
```

**Response - Skipped (200):**
```json
{
  "status": "skipped",
  "message": "No relevant field changes detected. Image generation skipped.",
  "code": 200,
  "data": {
    "memberID": "12345",
    "reason": "No visual changes"
  }
}
```

**Response - Unauthorized (401):**
```json
{
  "status": "error",
  "message": "Unauthorized",
  "code": 401,
  "error": "Invalid or missing authorization header"
}
```

**Response - Invalid Payload (400):**
```json
{
  "status": "error",
  "message": "Invalid webhook payload",
  "code": 400,
  "error": "Missing required member fields: name, memberID, discordID, data"
}
```

**Trigger Fields (when changed, image regenerates):**
- `rank` — Military rank (SGT, LT, CPT, etc.)
- `Uniform` — Uniform type/color (Blue, Brown)
- `badge` — Corps badge name
- `medallions` — Array of medal IDs
- `citations` — Array of citation/ribbon IDs
- `TrainingMedals` — Array of training medal IDs
- `RifleManBadge` — Marksmanship qualification badge

**Ignored Fields (no regen):**
- `name`, `discordID`, `memberID`, and other non-visual attributes

---

### 2️⃣ GET /status/:jobId

**Purpose:** Check the status of a queued or completed generation job

**Path Parameters:**
```
jobId: string (format: "job_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx")
```

**Response - In Progress (200):**
```json
{
  "status": "success",
  "message": "Job status retrieved",
  "data": {
    "jobId": "job_550e8400-e29b-41d4-a716-446655440000",
    "status": "active",
    "memberID": "12345",
    "imageUrl": null
  }
}
```

**Response - Completed (200):**
```json
{
  "status": "success",
  "message": "Job status retrieved",
  "data": {
    "jobId": "job_550e8400-e29b-41d4-a716-446655440000",
    "status": "completed",
    "memberID": "12345",
    "imageUrl": "http://localhost:42070/milpac/uniform/12345.png"
  }
}
```

**Response - Failed (200):**
```json
{
  "status": "success",
  "message": "Job status retrieved",
  "data": {
    "jobId": "job_550e8400-e29b-41d4-a716-446655440000",
    "status": "failed",
    "memberID": "12345",
    "error": "Asset not found: milpac_ranks with ID 'INVALID_RANK'"
  }
}
```

**Response - Not Found (404):**
```json
{
  "status": "error",
  "message": "Job not found",
  "code": 404
}
```

---

### 3️⃣ GET /queue/stats

**Purpose:** Get real-time job queue statistics (requires authorization)

**Authorization:**
```
Authorization: Bearer {WEBHOOK_API_KEY}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Queue stats retrieved",
  "data": {
    "waiting": 5,
    "active": 2,
    "completed": 1250,
    "failed": 3,
    "delayed": 0,
    "paused": 0,
    "totalJobs": 1260
  }
}
```

**Response - Unauthorized (401):**
```json
{
  "status": "error",
  "message": "Unauthorized",
  "code": 401,
  "error": "Invalid or missing authorization header"
}
```

---

### 4️⃣ GET /health

**Purpose:** Health check endpoint (no auth required)

**Response - All Systems Healthy (200):**
```json
{
  "status": "success",
  "message": "Server is running",
  "timestamp": "2026-04-06T10:30:45.123Z",
  "dependencies": {
    "mongodb": "healthy",
    "redis": "healthy"
  }
}
```

**Response - Degraded (200):**
```json
{
  "status": "success",
  "message": "Server is running",
  "timestamp": "2026-04-06T10:30:45.123Z",
  "dependencies": {
    "mongodb": "unhealthy",
    "redis": "healthy"
  }
}
```

---

## 🏛️ Service Architecture

### High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      asot-milpac-web Service                    │
│                    (Member data changes here)                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ POST /webhook
                         │ {member data + changeFields}
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  asot-milpac-generator Service                  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  1. Webhook Handler (route: POST /webhook)             │  │
│  │     - Validate API key                                 │  │
│  │     - Validate payload structure                       │  │
│  │     - Detect field changes                             │  │
│  │     - Queue generation job if needed                   │  │
│  └──────────────────────┬──────────────────────────────────┘  │
│                         │                                       │
│                         │ Add Job                               │
│                         ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  2. Job Queue (BullMQ + Redis)                         │  │
│  │     - Persistent queue storage                         │  │
│  │     - Automatic retries (exponential backoff)          │  │
│  │     - Job state tracking                               │  │
│  └──────────────────────┬──────────────────────────────────┘  │
│                         │                                       │
│                         │ Dequeue & Process                     │
│                         ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  3. Job Processor                                      │  │
│  │     - Read member data from MongoDB                    │  │
│  │     - Fetch asset information from collections         │  │
│  │     - Call Image Generator service                     │  │
│  │     - Save rendered PNG to disk                        │  │
│  │     - Update member record with image metadata         │  │
│  │     - Log generation result                            │  │
│  │     - Notify web service (optional, non-blocking)      │  │
│  └──────────────────────┬──────────────────────────────────┘  │
│                         │                                       │
│                         ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  4. Image Generator Service                            │  │
│  │     - Render uniform canvas (1398×1000px)              │  │
│  │     - Load & composite base uniform image              │  │
│  │     - Overlay rank insignia                            │  │
│  │     - Overlay medals & badges                          │  │
│  │     - Overlay name text with font                      │  │
│  │     - Convert canvas to PNG buffer                     │  │
│  └──────────────────────┬──────────────────────────────────┘  │
│                         │                                       │
│                         ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  5. Storage Service                                    │  │
│  │     - Save PNG to milpac/uniform/{memberID}.png        │  │
│  │     - Return file path for record keeping              │  │
│  └──────────────────────┬──────────────────────────────────┘  │
│                         │                                       │
│                         ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  6. MongoDB Operations                                 │  │
│  │     - Update members collection with image path        │  │
│  │     - Store generation log in milpac_image_data        │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                         │
                         │ Optional: Notify of completion
                         │ (via webIntegration service)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      asot-milpac-web Service                    │
│                  (Display updated uniform image)                │
└─────────────────────────────────────────────────────────────────┘
```

### Core Services

#### 1. **WebhookHandler** (src/middleware/webhookHandler.ts)
- **Responsibility:** Validates and processes incoming webhook requests
- **Key Methods:**
  - `validateAuthorization(req)` — Checks Authorization header against WEBHOOK_API_KEY
  - `validatePayload(payload)` — Validates required fields and structure
  - `handleWebhook(req, res)` — Main webhook processing logic
  - `getJobStatus(req, res)` — Returns job status and image URL
  - `getQueueStats(req, res)` — Returns queue statistics

#### 2. **QueueService** (src/services/queue.ts)
- **Responsibility:** Manages BullMQ job queue operations
- **Key Methods:**
  - `addJob(job)` — Enqueues a generation job
  - `getJobStatus(jobId)` — Retrieves job state and result data
  - `getQueueStats()` — Returns queue metrics (waiting, active, completed, failed)
  - `registerProcessor(handler)` — Registers the job processing function
- **Features:**
  - Automatic retries with exponential backoff
  - Redis-backed persistence
  - Event-driven callbacks for monitoring

#### 3. **JobProcessor** (src/services/jobProcessor.ts)
- **Responsibility:** Executes individual generation jobs
- **Key Methods:**
  - `processGenerationJob(job)` — Main job execution logic
  - `logGeneration(log)` — Persists generation metrics to MongoDB
- **Flow:**
  1. Read member data from database
  2. Call ImageGenerator to render uniform
  3. Save PNG file via StorageService
  4. Update member record with image metadata
  5. Notify asot-milpac-web service (non-blocking)
  6. Log execution metrics

#### 4. **ImageGeneratorService** (src/services/imageGenerator.ts)
- **Responsibility:** Renders military uniform images using Node Canvas
- **Key Methods:**
  - `generateUniform(memberID, data)` — Main rendering function
- **Process:**
  1. Load base uniform image (from milpac_corps collection)
  2. Retrieve all relevant assets (rank, medals, badges) from MongoDB
  3. Create 1398×1000px canvas
  4. Composite images in correct z-order:
     - Base uniform
     - Rank insignia
     - Badges (corps, training)
     - Medals & ribbons
     - Name text (using TrueType font)
  5. Convert to PNG buffer

#### 5. **StorageService** (src/services/storage.ts)
- **Responsibility:** File system operations for generated images
- **Key Methods:**
  - `saveImage(memberID, buffer, folder)` — Writes PNG buffer to disk
  - `getImagePath(memberID)` — Returns path to generated image
- **Output Directory:** `milpac/uniform/{memberID}.png`

#### 6. **MemberService** (src/services/member.ts)
- **Responsibility:** Member data operations
- **Key Methods:**
  - `getMemberData(memberID)` — Fetch member from MongoDB
  - `updateMemberImage(memberID, imagePath)` — Update member with image metadata

#### 7. **MilpacDataService** (src/services/milpacData.ts)
- **Responsibility:** Asset lookup and validation
- **Key Methods:**
  - `getRank(rankID)` — Query milpac_ranks collection
  - `getMedal(medalID)` — Query milpac_medallions collection
  - `getBadge(badgeID)` — Query milpac_badges collection

#### 8. **WebIntegrationService** (src/services/webIntegration.ts)
- **Responsibility:** Communication with asot-milpac-web service
- **Key Methods:**
  - `notifyImageGeneration(memberID, imageUrl)` — Optional callback after generation
  - Note: Failures are logged but don't block job success

#### 9. **DatabaseService** (src/services/database.ts)
- **Responsibility:** MongoDB connection pooling and lifecycle
- **Key Methods:**
  - `connect()` — Establish MongoDB connection
  - `disconnect()` — Graceful connection closure
  - `isConnected()` — Check connection status
- **Pattern:** Singleton instance for app-wide use

---

## ⚙️ Configuration & Setup

### Environment Variables

Create a `.env` file in the project root. See [CONFIGURATION.md](CONFIGURATION.md) for detailed descriptions.

```bash
# Server
PORT=42070
NODE_ENV=development

# Security
WEBHOOK_API_KEY=your-secret-api-key-change-in-production

# Database Connections
MONGO_URL=mongodb://localhost:27017/milpac
REDIS_URL=redis://localhost:6379

# Image Generation
IMAGE_OUTPUT_DIR=./milpac
IMAGE_WIDTH=1398
IMAGE_HEIGHT=1000
IMAGE_SERVICE_URL=http://localhost:42070

# Job Queue
MAX_RETRIES=5
JOB_TIMEOUT=30000
MAX_CONCURRENT_JOBS=5

# Logging
LOG_LEVEL=info
```

### Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your values

# 3. Start MongoDB and Redis (Docker)
docker-compose up -d mongo redis

# 4. Verify database connection (optional)
npm run health  # or manually test /health endpoint

# 5. Start development server
npm run dev

# 6. Test webhook endpoint
curl -X POST http://localhost:42070/webhook \
  -H "Authorization: Bearer $(cat .env | grep WEBHOOK_API_KEY | cut -d'=' -f2)" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "member.updated",
    "member": {
      "name": "Test User",
      "memberID": "test123",
      "discordID": "discord123",
      "data": {
        "rank": "SGT",
        "Uniform": "Blue",
        "badge": "Infantry"
      }
    }
  }'
```

### Docker Deployment

```bash
# Build image
docker build -t asot-milpac-generator:latest .

# Run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f generator

# Stop services
docker-compose down
```

---

## 👨‍💻 Development Guide

### Project Scripts

```bash
# Development
npm run dev              # Start with ts-node (hot reload not available)

# Production
npm run build            # Compile TypeScript to JavaScript
npm start                # Run compiled JavaScript

# Testing & Code Quality
npm test                 # Run Jest tests
npm run lint             # Run ESLint
npm run type-check       # Check TypeScript types without compilation

# Utilities
npm run generate-milpac  # Generate a uniform image for a member (CLI script)
```

### Code Organization Principles

1. **Services are Singletons** — Database, Queue, and other infrastructure are singleton instances
2. **Error Handling is Comprehensive** — All async operations have try-catch with logging
3. **Logging is Structured** — Winston logger with contextual metadata
4. **Types are Strict** — Full TypeScript coverage, no `any` types where possible
5. **Configuration is Externalized** — All config via environment variables
6. **Async/Await is Preferred** — No callback hell or unmanaged promises

### Adding a New Service

1. **Create the service file** in `src/services/`
   ```typescript
   export class MyService {
     private static instance: MyService;

     private constructor() {}

     static getInstance(): MyService {
       if (!MyService.instance) {
         MyService.instance = new MyService();
       }
       return MyService.instance;
     }

     async someMethod(): Promise<void> {
       // Implementation
     }
   }

   export default MyService.getInstance();
   ```

2. **Add to routes** if it has a public API
3. **Update types** in `src/types/index.ts`
4. **Add logging** using the logger utility
5. **Add tests** in `src/__tests__/`

### Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test src/__tests__/config.test.ts

# Run with coverage
npm test -- --coverage
```

Example test structure:
```typescript
describe('ConfigurationService', () => {
  it('should load environment variables', () => {
    expect(config.PORT).toEqual(42070);
  });

  it('should validate required config', () => {
    expect(() => validateConfig()).not.toThrow();
  });
});
```

### Debugging

#### View Logs
```bash
# Follow real-time logs
tail -f logs/milpac.log

# View last 100 lines
tail -100 logs/milpac.log

# Search for errors
grep "ERROR" logs/milpac.log
```

#### Check Queue Status
```bash
curl -X GET http://localhost:42070/queue/stats \
  -H "Authorization: Bearer $(cat .env | grep WEBHOOK_API_KEY | cut -d'=' -f2)"
```

#### Check Job Status
```bash
curl -X GET http://localhost:42070/status/job_xxxxx
```

#### Health Check
```bash
curl http://localhost:42070/health | jq .
```

---

## 🚀 Deployment

### Production Checklist

- [ ] Set strong `WEBHOOK_API_KEY` in `.env` (or use secret manager)
- [ ] Set `NODE_ENV=production`
- [ ] Configure `MONGO_URL` to point to production MongoDB
- [ ] Configure `REDIS_URL` to point to production Redis
- [ ] Set `IMAGE_SERVICE_URL` to public domain/IP
- [ ] Configure `LOG_LEVEL=info` (not debug)
- [ ] Set up log rotation for `logs/milpac.log`
- [ ] Configure MongoDB backups
- [ ] Set up monitoring alerts for queue depth
- [ ] Test webhook security (API key validation)
- [ ] Configure CORS if needed

### Docker Compose Deployment

```yaml
# docker-compose.yml (example for production)
version: '3.8'
services:
  generator:
    build: .
    ports:
      - "42070:42070"
    environment:
      NODE_ENV: production
      WEBHOOK_API_KEY: ${WEBHOOK_API_KEY}
      MONGO_URL: ${MONGO_URL}
      REDIS_URL: ${REDIS_URL}
    depends_on:
      - mongo
      - redis
    volumes:
      - ./milpac:/app/milpac
      - ./logs:/app/logs
    restart: unless-stopped

  mongo:
    image: mongo:7.0
    volumes:
      - mongo-data:/data/db
    environment:
      MONGO_INITDB_DATABASE: milpac

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data

volumes:
  mongo-data:
  redis-data:
```

### Kubernetes Deployment

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: asot-milpac-generator
spec:
  replicas: 3
  selector:
    matchLabels:
      app: asot-milpac-generator
  template:
    metadata:
      labels:
        app: asot-milpac-generator
    spec:
      containers:
      - name: generator
        image: asot-milpac-generator:latest
        ports:
        - containerPort: 42070
        env:
        - name: WEBHOOK_API_KEY
          valueFrom:
            secretKeyRef:
              name: generator-secrets
              key: webhook-api-key
        - name: MONGO_URL
          valueFrom:
            configMapKeyRef:
              name: generator-config
              key: mongo-url
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: generator-config
              key: redis-url
        livenessProbe:
          httpGet:
            path: /health
            port: 42070
          initialDelaySeconds: 30
          periodSeconds: 10
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. **"MongoDB connection failed"**

**Symptoms:** `✗ MongoDB connection failed` in logs

**Solutions:**
```bash
# Check if MongoDB is running
docker-compose ps

# Check MongoDB logs
docker-compose logs mongo

# Verify connection string
echo $MONGO_URL

# Test connection manually
mongosh "mongodb://localhost:27017/milpac"
```

#### 2. **"Redis connection failed"**

**Symptoms:** `Failed to connect to Redis` in logs

**Solutions:**
```bash
# Check if Redis is running
docker-compose ps

# Check Redis logs
docker-compose logs redis

# Test connection
redis-cli ping  # Should return PONG

# Verify connection string
echo $REDIS_URL
```

#### 3. **"Webhook received timeout"**

**Symptoms:** Webhook requests hang, response takes >30s

**Causes:**
- Image generation taking too long
- Database queries slow
- Asset files missing or corrupted

**Solutions:**
```bash
# Increase timeout
JOB_TIMEOUT=60000 npm run dev

# Check image generation time in logs
grep "Generation job completed" logs/milpac.log

# Verify assets exist
ls -la images/ranks/
ls -la images/medallions/
```

#### 4. **"Job fails with asset not found"**

**Symptoms:** `Asset not found: milpac_ranks with ID 'SGT'`

**Solutions:**
```bash
# Verify collection exists in MongoDB
mongosh
> use milpac
> db.milpac_ranks.findOne({_id: "SGT"})

# Check asset path in database
db.milpac_ranks.findOne({_id: "SGT"}, {assetFile: 1})

# Verify asset file exists
ls -la images/ranks/SGT*
```

#### 5. **"Invalid webhook payload"**

**Symptoms:** 400 error response: `Missing required member fields`

**Solutions:**
- Ensure payload has: `event`, `member.name`, `member.memberID`, `member.discordID`, `member.data`
- Check request Content-Type header is `application/json`
- Validate JSON syntax (use JSONLint)

**Example:**
```json
{
  "event": "member.updated",
  "member": {
    "name": "John Smith",          // ✓ Required
    "memberID": "12345",           // ✓ Required
    "discordID": "98765",          // ✓ Required
    "changeFields": ["rank"],      // Optional
    "data": {                      // ✓ Required
      "rank": "SGT",
      "Uniform": "Blue",
      "badge": "Infantry"
    }
  }
}
```

#### 6. **"Unauthorized" webhook error**

**Symptoms:** 401 response: `Invalid or missing authorization header`

**Solutions:**
```bash
# Verify API key in .env
cat .env | grep WEBHOOK_API_KEY

# Ensure Authorization header is present
curl -H "Authorization: Bearer$(cat .env | grep WEBHOOK_API_KEY | cut -d'=' -f2)" \
  http://localhost:42070/webhook

# Check for typos
# Format should be: Authorization: Bearer {KEY}
# NOT: Authorization: {KEY}
# NOT: Authorization: Basic {ENCODED}
```

#### 7. **"Server crashed on startup"**

**Symptoms:** Exit code 1, logs show error

**Solutions:**
```bash
# Check configuration validation
npm run type-check

# Verify all required env vars are set
env | grep -E 'WEBHOOK_API_KEY|MONGO_URL|REDIS_URL'

# Run with debug logging
LOG_LEVEL=debug npm run dev

# Check stderr for detailed error
npm run dev 2>&1 | head -50
```

#### 8. **"Generated image is blank or corrupted"**

**Symptoms:** PNG file exists but displays as blank

**Causes:**
- Asset image files are corrupted or in wrong format
- Canvas rendering error (check logs)
- File write permissions issue

**Solutions:**
```bash
# Verify PNG file is valid
file milpac/uniform/12345.png

# Check file size (should be > 50KB typically)
ls -lh milpac/uniform/12345.png

# View image in terminal (requires imagemagick)
identify milpac/uniform/12345.png

# Check generation logs for errors
grep "memberID.*12345" logs/milpac.log

# Re-generate uniform via webhook
curl -X POST http://localhost:42070/webhook \
  -H "Authorization: Bearer ..." \
  -d '{...member data...}'
```

### Debug Mode

Enable verbose logging:
```bash
LOG_LEVEL=debug npm run dev
```

This will output:
- All HTTP requests (`GET /status/:jobId`)
- Database operations
- Queue operations
- Canvas rendering steps

---

## 📊 Database Collections & Data Flow

### MongoDB Collections

See [DATABASE_ID_NAMES.md](DATABASE_ID_NAMES.md) for detailed collection information.

**Collections Used:**

| Collection | Purpose | ID Type | Used By |
|-----------|---------|---------|---------|
| `members` | Member records (name, rank, medals) | String/ObjectId | JobProcessor |
| `milpac_ranks` | Rank insignia metadata | String (e.g., "SGT") | ImageGenerator |
| `milpac_badges` | Corps badge metadata | String (e.g., "Infantry") | ImageGenerator |
| `milpac_medallions` | Medal metadata | String | ImageGenerator |
| `milpac_citations` | Citation/ribbon metadata | String | ImageGenerator |
| `milpac_training_medals` | Training badge metadata | String | ImageGenerator |
| `milpac_corps` | Corps uniform/collar metadata | String | ImageGenerator |
| `milpac_image_data` | Generation logs (custom schema) | ObjectId | JobProcessor |

### Data Flow Example

**Scenario:** Member promoted from PTE to SGT

1. **Web Service Updates Member** in MongoDB `members` collection
   ```json
   { _id: "12345", name: "John Smith", rank: "SGT", ... }
   ```

2. **Web Service Sends Webhook** to Generator
   ```json
   {
     "event": "member.updated",
     "member": {
       "memberID": "12345",
       "name": "John Smith",
       "changeFields": ["rank"],
       "data": { "rank": "SGT", ... }
     }
   }
   ```

3. **Generator Detects Change** in `changeFields`
   - `rank` is in `TRIGGER_FIELDS` → Generate new image

4. **Generator Queues Job** in BullMQ (Redis)
   ```json
   {
     "jobId": "job_xxxxx",
     "memberID": "12345",
     "data": { "rank": "SGT", ... }
   }
   ```

5. **Job Processor Executes**
   - Fetch member from MongoDB
   - Fetch rank asset: `milpac_ranks.findOne({_id: "SGT"})`
   - Fetch other assets (medals, badges, etc.)
   - Call ImageGenerator with all assets

6. **ImageGenerator Renders Image**
   - Load base uniform from `milpac_corps`
   - Overlay SGT rank insignia
   - Overlay medals, badges, name
   - Convert to PNG buffer (1398×1000px)

7. **StorageService Saves PNG**
   - Write to `milpac/uniform/12345.png`

8. **Logging & Notification**
   - Insert log entry in `milpac_image_data`
   - Update member record with image metadata
   - Notify web service (optional callback)

### Asset Lookup Flow

```
ImageGenerator requests rank "SGT"
        ↓
MilpacDataService.getRank("SGT")
        ↓
MongoLib.getAssetInfo("milpac_ranks", "SGT")
        ↓
MongoDB Query:
  db.milpac_ranks.findOne(
    { _id: "SGT" },
    { assetFile: 1 }
  )
        ↓
Result:
  {
    _id: "SGT",
    assetFile: "sergeant_chevrons.png",
    position: { x: 100, y: 50 },
    ...
  }
        ↓
Load image: images/ranks/sergeant_chevrons.png
        ↓
Composite onto canvas at (100, 50)
```

---

## 📝 Additional Resources

- [README.md](README.md) — Quick start and feature overview
- [CONFIGURATION.md](CONFIGURATION.md) — Environment variables reference
- [DATABASE_ID_NAMES.md](DATABASE_ID_NAMES.md) — MongoDB collections reference
- [Webhook Handler Source](src/middleware/webhookHandler.ts)
- [Job Processor Source](src/services/jobProcessor.ts)
- [Image Generator Source](src/services/imageGenerator.ts)

---

## 📞 Support & Reporting Issues

When reporting issues, include:

1. **Logs** (sanitized of sensitive data)
   ```bash
   tail -50 logs/milpac.log
   ```

2. **Configuration** (without API keys)
   ```bash
   env | grep -v WEBHOOK_API_KEY | grep -E '^(NODE_ENV|PORT|IMAGE|MONGO|REDIS|LOG)'
   ```

3. **Webhook Request & Response**
   ```json
   {
     "request": { "event": "...", "member": {...} },
     "response": { "status": "...", "message": "..." }
   }
   ```

4. **Error Stack Trace** from logs

---

**Last Updated:** April 2026  
**Version:** 1.0.0  
**Status:** Production Ready ✅

