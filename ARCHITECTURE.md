# 🏛️ ASOT Milpac Generator - Architecture & Design Document

## 📋 Table of Contents

1. [System Architecture](#system-architecture)
2. [Design Patterns](#design-patterns)
3. [Technology Stack](#technology-stack)
4. [Request Flow Diagrams](#request-flow-diagrams)
5. [Data Models](#data-models)
6. [Error Handling Strategy](#error-handling-strategy)
7. [Performance Considerations](#performance-considerations)
8. [Security Architecture](#security-architecture)
9. [Scalability & Future Enhancements](#scalability--future-enhancements)

---

## 🏗️ System Architecture

### Multi-Tier Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Presentation Layer                      │
│                  (HTTP REST API - Express.js)                   │
│                                                                 │
│  Routes: /webhook, /status/:jobId, /queue/stats, /health       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTP Request/Response
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    Business Logic Layer                         │
│                    (Service Classes)                            │
│                                                                 │
│  ┌─────────────────────┐  ┌──────────────────────────────────┐ │
│  │ Webhook Handler     │  │ Image Generator Service          │ │
│  │ - Validation        │  │ - Canvas rendering               │ │
│  │ - Authorization     │  │ - Asset composition              │ │
│  │ - Change Detection  │  │ - PNG serialization              │ │
│  └─────────────────────┘  └──────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────┐  ┌──────────────────────────────────┐ │
│  │ Job Processor       │  │ Member Service                   │ │
│  │ - Job execution     │  │ - Member queries                 │ │
│  │ - Result logging    │  │ - Data updates                   │ │
│  │ - Error handling    │  │ - Image metadata                 │ │
│  └─────────────────────┘  └──────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────┐  ┌──────────────────────────────────┐ │
│  │ Storage Service     │  │ Web Integration Service          │ │
│  │ - File I/O          │  │ - Web service callbacks          │ │
│  │ - Directory mgmt    │  │ - Notification handling          │ │
│  └─────────────────────┘  └──────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Service Dependencies
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                      Data Access Layer                          │
│                                                                 │
│  ┌──────────────────────┐        ┌────────────────────────┐   │
│  │ MongoDB Wrapper      │        │ BullMQ Queue Manager  │   │
│  │ (mongoose + queries) │        │ (job persistence)    │   │
│  └──────────────────────┘        └────────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Network I/O
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                 External Services & Storage                     │
│                                                                 │
│  ┌──────────────────────┐        ┌────────────────────────┐   │
│  │ MongoDB Server       │        │ Redis Server           │   │
│  │ (collections)        │        │ (job queue storage)    │   │
│  └──────────────────────┘        └────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ File System (milpac/uniform/ directory)                 │  │
│  │ Asset Files (images/ directory)                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ asot-milpac-web Service (optional webhook callbacks)    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Execution Context Model

```
Express.js Thread Pool (Node.js cluster)
│
├─ HTTP Request Handler (async)
│  │
│  ├─ Parse & Validate Request
│  ├─ Authenticate (API Key check)
│  ├─ Validate Payload
│  ├─ Detect Field Changes
│  └─ Queue Job (async)
│     │
│     └─ Return 200 Response (job queued)
│
├─ BullMQ Worker Pool (separate)
│  │
│  ├─ Dequeue Job
│  ├─ Fetch Member Data (MongoDB)
│  ├─ Fetch Assets (MongoDB queries)
│  ├─ Generate Image (CPU-intensive, canvas)
│  ├─ Save PNG (File I/O)
│  ├─ Update MongoDB
│  └─ Notify Web Service (optional, HTTP)
│
└─ Event Listeners
   ├─ Queue error events
   ├─ Queue timeout events
   └─ Process signals (SIGTERM, SIGINT)
```

---

## 🎨 Design Patterns

### 1. **Singleton Pattern**

All service classes use the singleton pattern to ensure single instances across the application:

```typescript
export class DatabaseService {
  private static instance: DatabaseService;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }
}

// Usage
import databaseService from './services/database';
```

**Benefits:**
- Single point of database connection
- Prevents connection leaks
- Thread-safe in Node.js single-threaded event loop
- Easy to mock in tests

### 2. **Dependency Injection (Functional)**

Services receive dependencies through parameter injection:

```typescript
// In JobProcessor.processGenerationJob()
const imageBuffer = await imageGeneratorService.generateUniform(memberID, data);
const imagePath = await storageService.saveImage(memberID, imageBuffer, 'uniform');
await memberService.updateMemberImage(memberID, imagePath);

// Each service is injected via imports, decoupling from construction
```

### 3. **Strategy Pattern**

Different image generation strategies could be implemented:

```typescript
interface ImageGenerationStrategy {
  generateUniform(memberID: string, data: MemberData): Promise<Buffer>;
}

// Current implementation - Canvas-based
class CanvasImageGenerator implements ImageGenerationStrategy {
  async generateUniform(memberID: string, data: MemberData): Promise<Buffer> {
    // Canvas rendering logic
  }
}

// Future: SVG-based generator
class SVGImageGenerator implements ImageGenerationStrategy {
  async generateUniform(memberID: string, data: MemberData): Promise<Buffer> {
    // SVG rendering logic
  }
}
```

### 4. **Factory Pattern**

Service creation is abstracted:

```typescript
class ServiceFactory {
  static createImageGenerator(): ImageGeneratorService {
    return new CanvasImageGenerator();
  }

  static createQueue(): QueueService {
    return QueueService.getInstance();
  }
}
```

### 5. **Observer Pattern**

BullMQ events are observed for monitoring:

```typescript
// In QueueService
private setupQueueEvents(): void {
  this.queue.on('completed', (job: Job) => {
    logger.info('Job completed', { jobId: job.id });
  });

  this.queue.on('failed', (job: Job, error: Error) => {
    logger.error('Job failed', { jobId: job.id, error: error.message });
  });

  this.queue.on('error', (error: Error) => {
    logger.error('Queue error', { error: error.message });
  });
}
```

### 6. **Middleware Pattern**

Express middleware handles cross-cutting concerns:

```typescript
// Logging middleware
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// Static file serving
app.use('/milpac', express.static(config.IMAGE_OUTPUT_DIR));

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', { error: err.message });
  res.status(500).json({ status: 'error' });
});
```

### 7. **Async Handler Pattern**

All async route handlers use a wrapper for consistent error handling:

```typescript
const asyncHandler = (fn: (req: Request, res: Response) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
};

// Usage
router.post('/webhook', asyncHandler(async (req: Request, res: Response) => {
  await WebhookHandler.handleWebhook(req, res);
}));
```

**Benefits:**
- Prevents unhandled promise rejections
- Centralizes error handling
- Consistent error responses

---

## 🛠️ Technology Stack

### Core Runtime
- **Node.js 18+** — JavaScript runtime with ES modules
- **TypeScript 5.2** — Static type checking and modern syntax

### Web Framework
- **Express.js 4.18** — HTTP server framework
  - Lightweight, flexible routing
  - Extensive middleware ecosystem
  - Built-in static file serving

### Image Processing
- **Canvas (node-canvas)** — Node.js Canvas API
  - Render military uniform design
  - Composite rank insignia, medals, badges
  - Render text (member names) with TrueType fonts
- **Sharp 0.34** — Image processing library
  - Optimize PNG output
  - Resize, crop, convert formats
- **PNG.js** — Pure JavaScript PNG decoder

### Database & Persistence
- **MongoDB 5.0+** — Document database
  - Collections: members, milpac_ranks, milpac_medallions, etc.
  - Flexible schema for military data
  - Scalable, distributed-ready
- **Mongoose 7.5** — MongoDB object modeling
  - Schema validation
  - Query builders
  - Middleware hooks

### Job Queue & Async Processing
- **BullMQ 5.1** — Job queue library
  - Built on Redis
  - Automatic retries with exponential backoff
  - Job status tracking
  - Event-driven processing
- **Redis 6.0+** — In-memory data store
  - Job persistence
  - Queue state management
  - Session caching (if needed)
- **ioredis** — Redis client for BullMQ

### Logging & Monitoring
- **Winston 3.10** — Logging library
  - Structured logging with metadata
  - Multiple transports (console, file)
  - Log level control
  - JSON output support

### Development & Testing
- **Jest 29.7** — Testing framework
  - Unit test execution
  - Mocking capabilities
  - Coverage reporting
- **ts-node 10.9** — TypeScript execution (dev)
- **ESLint** — Code linting
- **TypeScript Compiler** — Type checking

### Utilities
- **uuid 9.0** — UUID generation (job IDs)
- **dotenv 16.3** — Environment configuration
- **Docker & Docker Compose** — Containerization

---

## 📊 Request Flow Diagrams

### Webhook Request Flow (Detailed)

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. Webhook Request Arrives                                       │
│                                                                  │
│ POST /webhook                                                   │
│ Authorization: Bearer {API_KEY}                                │
│ Content-Type: application/json                                 │
│ Body: {event, member, changeFields, data}                      │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. Authentication & Validation (WebhookHandler)                 │
│                                                                  │
│ ├─ validateAuthorization()                                      │
│ │  ├─ Extract token from Authorization header                  │
│ │  ├─ Compare against WEBHOOK_API_KEY                          │
│ │  └─ Return 401 if invalid                                    │
│ │                                                               │
│ ├─ validatePayload()                                           │
│ │  ├─ Check required fields (event, member, data)              │
│ │  ├─ Validate event type (member.updated, certificate.req)   │
│ │  ├─ Validate member fields                                  │
│ │  └─ Validate changeFields array                             │
│ │                                                               │
│ └─ Return 400 if validation fails                              │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. Change Detection (WebhookHandler)                             │
│                                                                  │
│ ├─ Extract changeFields from request                            │
│ │                                                               │
│ ├─ If changeFields NOT provided:                               │
│ │  └─ Assume all fields may have changed                       │
│ │                                                               │
│ ├─ Filter changeFields against TRIGGER_FIELDS:                 │
│ │  ├─ TRIGGER_FIELDS = [                                       │
│ │  │  "rank", "Uniform", "badge", "medallions",               │
│ │  │  "citations", "TrainingMedals", "RifleManBadge"          │
│ │  │ ]                                                          │
│ │  │                                                            │
│ │  └─ Check: hasRelevantChange = changeFields.some(f =>        │
│ │             TRIGGER_FIELDS.includes(f))                      │
│ │                                                               │
│ └─ Store decision for next step                                │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. Conditional Job Queuing                                       │
│                                                                  │
│ if (hasRelevantChange) {                                         │
│   ├─ Create GenerationJob object:                               │
│   │  ├─ jobId = v4() (unique UUID)                              │
│   │  ├─ memberID = member.memberID                              │
│   │  ├─ name = member.name                                      │
│   │  └─ data = member.data (full member data)                   │
│   │                                                              │
│   ├─ Call queueService.addJob(job)                              │
│   │                                                              │
│   └─ In Success: Return 200 response { status: "queued", ... }  │
│                                                                  │
│ } else {                                                         │
│   └─ Return 200 response { status: "skipped", ... }             │
│ }                                                                │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│ 5. Response Returned (< 100ms typically)                         │
│                                                                  │
│ 200 OK                                                          │
│ {                                                               │
│   "status": "queued",                                           │
│   "message": "Image generation queued for MemberID 12345",      │
│   "code": 200,                                                  │
│   "data": {                                                     │
│     "jobId": "job_xxxxx",                                       │
│     "memberID": "12345",                                        │
│     "queued": true                                              │
│   }                                                             │
│ }                                                               │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               ▼ (Async, parallel)
┌──────────────────────────────────────────────────────────────────┐
│ 6. Job Processing (happens in background)                       │
│                                                                  │
│ BullMQ Worker Pool                                              │
│ │                                                               │
│ ├─ Dequeue job when worker available                           │
│ │                                                               │
│ ├─ JobProcessor.processGenerationJob(job)                      │
│ │  ├─ Fetch member from MongoDB                                │
│ │  ├─ Fetch assets (rank, medals, badges) from MongoDB         │
│ │  ├─ Call imageGeneratorService.generateUniform()             │
│ │  ├─ Get PNG buffer                                           │
│ │  ├─ Save to milpac/uniform/{memberID}.png                    │
│ │  ├─ Update member.imagePath in MongoDB                       │
│ │  ├─ Insert log in milpac_image_data collection               │
│ │  └─ Notify web service (optional, non-blocking)              │
│ │                                                               │
│ ├─ If successful:                                              │
│ │  └─ Return result, job marked COMPLETED                      │
│ │                                                               │
│ └─ If error:                                                   │
│    ├─ Log error                                                │
│    ├─ Retry with exponential backoff (up to MAX_RETRIES)       │
│    └─ If all retries fail, mark FAILED                         │
└──────────────────────────────────────────────────────────────────┘
```

### Status Check Flow

```
Client Request: GET /status/job_xxxxx
        │
        ▼
    Express Route Handler
        │
        ├─ Validate jobId parameter
        │
        ├─ Call queueService.getJobStatus(jobId)
        │
        ├─ Query BullMQ for job state
        │
        └─ Resolve image URL if completed
                │
                ├─ If COMPLETED: imageUrl = "/milpac/uniform/{memberID}.png"
                ├─ If ACTIVE: imageUrl = null
                └─ If FAILED: imageUrl = null, include error
        │
        ▼
    Return Response
        {
          "status": "success",
          "data": {
            "jobId": "job_xxxxx",
            "status": "completed|active|failed",
            "imageUrl": "http://localhost:42070/milpac/uniform/12345.png"
          }
        }
```

---

## 📦 Data Models

### Webhook Request Model

```typescript
interface WebhookPayload {
  event: "member.updated" | "certificate.requested";
  member: {
    name: string;
    memberID: string;
    discordID: string;
    changeFields?: string[];  // Fields that changed (optimization hint)
    data: {
      rank?: string;
      Uniform?: string;
      badge?: string;
      medallions?: string[];
      citations?: string[];
      TrainingMedals?: string[];
      RifleManBadge?: string;
      [key: string]: any;
    };
  };
}
```

### Generation Job Model

```typescript
interface GenerationJob {
  jobId: string;           // UUID, job identifier
  memberID: string;        // Member's unique ID
  name: string;            // Member's name
  data: {
    rank?: string;
    Uniform?: string;
    badge?: string;
    medallions?: string[];
    citations?: string[];
    TrainingMedals?: string[];
    RifleManBadge?: string;
    [key: string]: any;
  };
}
```

### Asset Model (MongoDB)

```typescript
interface AssetDocument {
  _id: string;           // Asset ID (e.g., "SGT", "Infantry")
  assetFile: string;     // Image filename (e.g., "sgt_chevrons.png")
  position?: {           // Optional z-index and positioning
    x: number;
    y: number;
    zIndex?: number;
  };
  position?: {           // Positioning hints
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  [key: string]: any;    // Additional metadata
}
```

### Member Model

```typescript
interface MemberData {
  _id: string;
  name: string;
  memberID: string;
  discordID: string;
  rank?: string;
  Uniform?: string;
  badge?: string;
  medallions?: string[];
  citations?: string[];
  TrainingMedals?: string[];
  RifleManBadge?: string;
  imagePath?: string;    // Updated by JobProcessor
  imageUpdatedAt?: Date; // Updated by JobProcessor
  [key: string]: any;
}
```

### Generation Log Model

```typescript
interface GenerationLog {
  _id?: ObjectId;
  memberID: string;
  jobId: string;
  timestamp: Date;
  status: "success" | "failed";
  executionTime: number;  // Milliseconds
  imageSize?: number;     // Bytes (if successful)
  error?: string;         // Error message (if failed)
}
```

### API Response Model

```typescript
interface ApiResponse<T = any> {
  status: "success" | "error" | "queued" | "skipped";
  message: string;
  code: number;
  data?: T;
  error?: string;
}
```

---

## 🛡️ Error Handling Strategy

### Error Classification

```
Errors in the system are categorized as:

1. VALIDATION ERRORS (4xx HTTP)
   ├─ Missing Authorization header → 401
   ├─ Invalid API key → 401
   ├─ Malformed JSON payload → 400
   ├─ Missing required fields → 400
   └─ Invalid event type → 400

2. NOT FOUND ERRORS (404 HTTP)
   ├─ Job not found → 404 /status/:jobId
   ├─ Member not found → Queued, logged as job failure
   └─ Asset not found → Queued, logged as job failure

3. SYSTEM ERRORS (5xx HTTP)
   ├─ MongoDB connection failure → 500 (on startup)
   ├─ Redis connection failure → 500 (on startup)
   ├─ Unhandled exception in route → 500
   └─ File system write error → Logged, job fails & retries

4. JOB PROCESSING ERRORS (logged, not exposed in HTTP)
   ├─ Asset lookup failure
   ├─ Canvas rendering error
   ├─ Image generation timeout
   └─ Web service notification failure (non-critical)
```

### Error Handling Flow

```
Error Occurs
        │
        ├─ In Express Route Handler
        │  ├─ Caught by asyncHandler wrapper
        │  ├─ Passed to error middleware
        │  └─ Respond with 500 JSON
        │
        ├─ In BullMQ Job Processor
        │  ├─ Caught in try-catch
        │  ├─ Logged with context
        │  ├─ Job fails
        │  ├─ BullMQ retries (exponential backoff)
        │  └─ If all retries fail, mark FAILED
        │
        └─ Unhandled Promise Rejection
           ├─ Logged by uncaughtException handler
           ├─ Process may exit (safety)
           └─ Supervisor (docker, kubernetes) restarts

Logging includes:
├─ Timestamp
├─ Error message
├─ Stack trace (development)
├─ Context (jobId, memberID, request details)
└─ Severity level (error, warn, info, debug)
```

### Error Response Examples

```json
// 401 Unauthorized
{
  "status": "error",
  "message": "Unauthorized",
  "code": 401,
  "error": "Invalid or missing authorization header"
}

// 400 Bad Request
{
  "status": "error",
  "message": "Invalid webhook payload",
  "code": 400,
  "error": "Missing required member fields: name, memberID"
}

// 500 Internal Server Error
{
  "status": "error",
  "message": "Internal server error",
  "code": 500
}
```

---

## ⚡ Performance Considerations

### Request Latency Targets

```
Webhook Request:
├─ Validation & Auth check: 5-10ms
├─ Payload parsing & validation: 5-10ms
├─ Change field detection: < 1ms
├─ Job creation & queuing: 10-20ms
└─ Total: ~30ms (P95)

Status Check Request:
├─ Job lookup in Redis: 1-5ms
├─ State determination: < 1ms
└─ Total: ~5ms

Image Generation (async, not in request path):
├─ MongoDB asset lookups: 50-200ms
├─ Canvas rendering: 200-500ms (varies with complexity)
├─ PNG encode: 100-300ms
├─ File write: 50-100ms
├─ MongoDB update: 20-50ms
└─ Total: 500-1500ms (P99)
```

### Optimization Strategies

**1. Caching**
```typescript
// Asset caching in memory (consider for future)
class CachedAssetService {
  private cache = new Map<string, AssetDocument>();

  async getAsset(collection: string, id: string): Promise<AssetDocument> {
    const key = `${collection}:${id}`;
    
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const asset = await mongoService.findAsset(collection, id);
    this.cache.set(key, asset);
    return asset;
  }
}
```

**2. Connection Pooling**
- MongoDB connection pooling (Mongoose default: 10 connections)
- Redis connection reuse via ioredis

**3. Job Batching**
- Process multiple jobs in parallel (MAX_CONCURRENT_JOBS)
- BullMQ handles worker pool distribution

**4. Image Optimization**
- PNG compression during encoding
- Lazy-load fonts only when needed
- Reuse canvas instances where possible

**5. Database Indexing**
```
MongoDB recommended indexes:
├─ members: _id (primary), memberID (unique)
├─ milpac_ranks: _id (primary)
├─ milpac_badges: _id (primary)
├─ milpac_medallions: _id (primary)
└─ milpac_image_data: memberID, timestamp
```

### Memory Management

```
Typical Memory Usage:
├─ Node.js runtime: ~30MB
├─ Express server: ~20MB
├─ Mongoose connection pool: ~10MB
├─ BullMQ queues: ~20MB (varies with queue size)
├─ Active job processing: ~100-200MB (per job)
│  └─ Canvas buffer (~2MB)
│  └─ PNG buffer (~1-2MB)
│  └─ Asset images loaded in memory
└─ Total baseline: ~100MB

Scalability:
└─ Set NODE_OPTIONS="--max-old-space-size=512" for 512MB heap
└─ Monitor with: top, htop, node --prof, clinic.js
```

---

## 🔐 Security Architecture

### Authentication & Authorization

```
Webhook Security:
├─ All webhooks MUST include Authorization header
│  └─ Format: "Authorization: Bearer {WEBHOOK_API_KEY}"
│
├─ API key validation on every webhook
│  └─ Constant-time comparison (timing attack resistant)
│
├─ API key should be:
│  ├─ Generated with crypto.randomBytes(32).toString('hex')
│  ├─ At least 32 characters
│  ├─ Rotated regularly in production
│  └─ Never logged or exposed in debug output
│
└─ Future enhancement: HMAC-SHA256 signatures
   └─ Sign request body with shared secret
   └─ Verify signature on recipient side
```

### Data Protection

```
In Transit:
├─ Use HTTPS in production (not shown in example)
├─ TLS 1.2+ required
└─ Certificate pinning (optional)

At Rest:
├─ MongoDB credentials in environment variables (not in code)
├─ No sensitive data logged (API keys, tokens)
├─ Image files on disk have restricted permissions
└─ Generated PNGs are public (intentional)
```

### Input Validation

```
Webhook Payload Validation:
├─ Schema validation (event, member required)
├─ Type checking (arrays vs strings)
├─ Size limits (prevent outrageous payloads)
├─ XSS prevention (no script injection risk, data is clean)
└─ NoSQL injection prevention
   └─ Use Mongoose schema validation, not raw strings
```

### API Key Management

```
Best Practices:
├─ Never commit .env or secrets to Git
├─ Use environment variables or secret managers
├─ Rotate keys regularly in production
├─ Use strong, random API keys (not predictable strings)
├─ Limit webhook endpoint exposure to internal networks
├─ Implement rate limiting (future enhancement)
│  └─ Prevent webhook spam/DOS attacks
└─ Log all authentication failures
   └─ Monitor for brute force attempts
```

---

## 🚀 Scalability & Future Enhancements

### Current Scalability

```
Single Instance Capacity:
├─ Max concurrent images: 5 (MAX_CONCURRENT_JOBS)
├─ Queue throughput: ~20 images/minute (5 concurrent × 12s avg)
├─ Estimated load: ~1200 uniforms/hour per instance
│
└─ Bottleneck: Canvas rendering (CPU-bound)
   └─ Can be optimized with C++ bindings or GPU rendering
```

### Horizontal Scaling

```
Multi-Instance Deployment:
├─ Shared Redis (job queue)
│  └─ All instances read from same queue
│
├─ Shared MongoDB (asset data, members)
│  └─ All instances access same collections
│
├─ Distributed file storage (optional)
│  ├─ Current: Local filesystem (single instance)
│  ├─ Future: S3, Azure Blob Storage, NFS
│  └─ Allows images from any instance
│
├─ Load balancer (nginx, cloud LB)
│  └─ Round-robin webhook requests to instances
│
└─ Parallel job processing:
   ├─ Instance 1: Processing job A
   ├─ Instance 2: Processing job B
   ├─ Instance 3: Processing job C
   └─ All updating same MongoDB collections
```

### Future Enhancements

**1. Caching Layer**
```typescript
// Cache frequently-used assets in memory
// Invalidate cache on asset updates
interface CacheEntry {
  asset: AssetDocument;
  loadedAt: Date;
  ttl: number; // 1 hour default
}
```

**2. GPU Rendering**
```typescript
// Use headless Chrome or GPU Canvas for faster rendering
// Consider: Skia (native), OpenGL, WebGPU
```

**3. Image Pre-processing**
```typescript
// Validate assets at startup
// Pre-load frequently-used assets
// Cache rendered element layers
```

**4. Webhook Retries**
```typescript
// Implement exponential backoff for web service callbacks
// Persistent webhook delivery queue
```

**5. Rate Limiting**
```typescript
// Prevent webhook spam
// Per-member ID rate limits
// Per-API-key rate limits
```

**6. Analytics & Monitoring**
```typescript
// Prometheus metrics
// Grafana dashboards
// APM integration (New Relic, DataDog)
```

**7. Bulk Operations**
```typescript
// Batch generation requests
// Scheduled batch jobs (nightly regeneration)
// CLI for manual regeneration
```

**8. Image Versioning**
```typescript
// Keep historical versions
// Rollback capability
// Image diff detection
```

### Deployment Patterns

**Development**
```
Single Instance
├─ Local MongoDB
├─ Local Redis
└─ File system storage
```

**Staging**
```
Docker Compose
├─ 1 Generator instance
├─ MongoDB container
├─ Redis container
└─ Local volumes
```

**Production - Small Scale**
```
Docker Compose on VPS
├─ 2-3 Generator instances
├─ Managed MongoDB (Atlas, Cloud MongoDB)
├─ Managed Redis (ElastiCache, Upstash)
└─ S3/Azure Blob for images
```

**Production - Large Scale**
```
Kubernetes Cluster
├─ 5-20 Generator pod replicas
├─ Managed MongoDB (per-region)
├─ Managed Redis (cluster mode)
├─ S3/Azure Blob with CDN
├─ Prometheus & Grafana
└─ Auto-scaling based on queue depth
```

---

## 📚 References

- [PROJECT.md](PROJECT.md) — Complete project documentation
- [CONFIGURATION.md](CONFIGURATION.md) — Environment variables
- [DATABASE_ID_NAMES.md](DATABASE_ID_NAMES.md) — MongoDB collections
- [README.md](README.md) — Quick start guide

---

**Last Updated:** April 2026  
**Version:** 1.0.0
