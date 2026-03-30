# 🏗️ Milpac Image Generator - Architecture

Complete system design and webhook integration documentation.

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Koda Database (External API)                   │
│                    Sent on member data change                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │ POST /webhook
                             │ {memberID, name, rank, medals, ...}
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Milpac Image Generator (Node.js + Express)             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. WEBHOOK RECEIVER (Express Handler)                             │
│     ├─ Validate Authorization Header (Bearer token)                │
│     ├─ Validate JSON payload structure                             │
│     └─ Parse memberID, name, rank, medals, citations             │
│                                                                     │
│  2. CHANGE DETECTOR (Member Service)                               │
│     ├─ Fetch existing member data from MongoDB                     │
│     ├─ Compare: rank, medals, citations, badges                   │
│     └─ Decide: regenerate? → Queue job or skip                    │
│                                                                     │
│  3. JOB QUEUE (BullMQ + Redis)                                     │
│     ├─ Enqueue high-priority generation jobs                      │
│     ├─ Handle retries (exponential backoff)                       │
│     ├─ Track job status (pending→active→completed)                │
│     └─ Persist jobs in Redis (survives server restart)            │
│                                                                     │
│  4. IMAGE GENERATOR (Canvas Service)                               │
│     ├─ Load Canvas 2D context                                     │
│     ├─ Draw uniform base (color + texture)                        │
│     ├─ Render rank insignia                                       │
│     ├─ Place medals in grid layout                                │
│     ├─ Add citations & badges                                     │
│     └─ Output PNG buffer (1398×1000px)                            │
│                                                                     │
│  5. STORAGE SERVICE (File System)                                  │
│     ├─ Save PNG to disk: ./milpac/{memberID}.png                 │
│     └─ Update member record: {lastGenerated, imageUrl}            │
│                                                                     │
│  6. LOGGING (MongoDB + Files)                                      │
│     ├─ Store generation_log entries (success/failed)              │
│     └─ Write logs to disk (logs/*.log)                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
         │                           │                      │
         ▼                           ▼                      ▼
   ┌──────────────┐        ┌───────────────────┐    ┌──────────────┐
   │  MongoDB     │        │      Redis        │    │  File System │
   │  (Members)   │        │   (Job Queue)     │    │  (Images)    │
   │  (Logs)      │        │                   │    │              │
   └──────────────┘        └───────────────────┘    └──────────────┘
```

---

## 📡 Webhook Integration

### Webhook Flow

1. **Member Data Change** (External API)
   - User promotion, medal awarded, rank change
   - Koda database sends webhook to `/webhook`

2. **Validation** (Security Layer)
   ```
   Authorization: Bearer {API_KEY}
   Content-Type: application/json
   ```

3. **Change Detection**
   - Compare new data with stored data
   - Only trigger regen if: rank, medals, citations, badges changed
   - Skip if no relevant field changed

4. **Queue Processing**
   - Create unique job ID
   - Enqueue async generation task
   - Return 200 OK with job ID to caller

5. **Background Processing**
   - Worker picks up job from queue
   - Generates image (Canvas)
   - Saves PNG to disk
   - Updates MongoDB records
   - Logs result

### Webhook Payload Format

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
      "medallions": ["Service", "Valor"],
      "citations": ["1year"],
      "TrainingMedals": ["ExpR"],
      "RifleManBadge": ""
    }
  }
}
```

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/webhook` | Receive webhook from Koda DB |
| GET | `/status/{jobId}` | Check generation job status |
| GET | `/queue/stats` | View queue statistics |
| GET | `/health` | Health check |

---

## 🔄 Data Flow

### Member Update Trigger

```
External API Webhook
    ↓
Express Router: POST /webhook
    ↓
WebhookHandler.handleWebhook()
    ├─ Validate authorization
    ├─ Validate payload structure
    └─ Call processWebhook()
        ├─ Get existing member from MongoDB
        ├─ Detect changes
        ├─ Save member (insert/update)
        ├─ Create GenerationJob
        └─ Queue job with BullMQ
            ↓
        Redis Queue (persistence)
            ↓
        BullMQ Worker picks up job
            ├─ Call JobProcessor.processGenerationJob()
            │   ├─ Generate PNG image (Canvas)
            │   ├─ Save to disk: ./milpac/{memberID}.png
            │   ├─ Update member: lastGenerated, imageUrl
            │   └─ Log success
            │
            └─ Or on error:
                ├─ Retry (max 5 attempts, exponential backoff)
                ├─ Log failure
                └─ Alert on persistent failure
```

---

## 🗄️ Database Schema

### Members Collection

```typescript
{
  _id: ObjectID,
  memberID: string (unique, indexed),
  name: string,
  discordID: string,
  data: {
    rank: string,
    Uniform: string,
    badge: string,
    medallions: string[],
    citations: string[],
    TrainingMedals: string[],
    RifleManBadge: string
  },
  lastUpdated: Date,
  lastGenerated: Date,
  imageUrl: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Generation Logs Collection

```typescript
{
  _id: ObjectID,
  memberID: string (indexed),
  jobId: string (unique),
  timestamp: Date (indexed, TTL: 30 days),
  status: 'success' | 'failed',
  executionTime: number (ms),
  error?: string,
  imageSize?: number (bytes)
}
```

---

## ⚙️ Configuration

### Environment Variables

```bash
# Server
PORT=42070
NODE_ENV=development

# Security
WEBHOOK_API_KEY=your_32_char_min_key

# Databases
MONGO_URL=mongodb://localhost:27017/milpac
REDIS_URL=redis://localhost:6379

# Image Generation
IMAGE_WIDTH=1398
IMAGE_HEIGHT=1000
IMAGE_OUTPUT_DIR=./milpac

# Job Queue
MAX_RETRIES=5
JOB_TIMEOUT=30000
MAX_CONCURRENT_JOBS=5

# Logging
LOG_LEVEL=info
```

---

## 🎨 Image Generation Details

### Canvas Settings
- **Dimensions**: 1398×1000 pixels
- **Format**: PNG (8-bit)
- **Render Time**: ~100-200ms per image

### Placement System (Object-Based)

```javascript
{
  rank: { x: 50, y: 100 },
  medals: { 
    x: 50, y: 250, 
    spacing: 5, 
    maxColumns: 8 
  },
  citations: { 
    x: 50, y: 550, 
    spacing: 5, 
    maxColumns: 8 
  },
  badges: { 
    x: 50, y: 800, 
    spacing: 10, 
    maxColumns: 4 
  }
}
```

**Grid Calculation**:
- Column: `index % maxColumns`
- Row: `floor(index / maxColumns)`
- Position: `startPos + (columnIdx × itemWidth) + spacing`

### Color System

| Uniform | Color |
|---------|-------|
| Blue | `#0033CC` |
| Green | `#006600` |
| Desert | `#CCAA66` |
| White | `#EEEEEE` |

| Medal | Color |
|-------|-------|
| Service | `#FFD700` (Gold) |
| Valor | `#FF6B6B` (Red) |
| Commendation | `#4ECDC4` (Teal) |
| Achievement | `#45B7D1` (Blue) |

---

## 🚀 Performance Optimizations

### 1. **Selective Field Change Detection**
- Only trigger regeneration if certain fields changed
- Ignore non-visual field updates
- Saves ~80% of unnecessary processing

### 2. **Async Job Queue (BullMQ)**
- Webhook returns 200 OK immediately
- Image generation happens in background
- Worker pool handles concurrency

### 3. **Job Retry Logic**
- Exponential backoff: `2^attempt seconds`
- Max 5 retries before failure
- Handles temporary database/image errors

### 4. **TTL on Logs**
- Generation logs expire after 30 days
- Prevents unbounded MongoDB growth
- Automatic cleanup via MongoDB TTL index

### 5. **Connection Pooling**
- MongoDB connection reuse
- Redis persistent connection
- Worker thread pool (max 5 concurrent)

---

## 🔒 Security

### Authorization
- Bearer token validation on every webhook
- API key must be >= 32 characters
- Constant-time comparison (prevents timing attacks)

### Input Validation
- Payload structure validation
- Field type checking
- Size limits on arrays (medals, citations)
- Member ID format validation

### Rate Limiting (Optional Enhancement)
```typescript
// Future: Add rate limiting by memberID
const MAX_REQUESTS_PER_MINUTE = 10;
const REQUESTS_PER_IP = 100;
```

---

## 🐛 Error Handling

### Retryable Errors
- MongoDB connection timeout
- Redis connection lost
- Canvas render failure (OOM)

### Non-Retryable Errors
- Invalid webhook payload
- Unauthorized API key
- Invalid member data structure

### Logging Strategy
```
ERROR: Failed to generate image
DEBUG: Change detected { field, oldValue, newValue }
INFO: Image generated { memberID, size }
WARN: Webhook received without auth header
```

---

## 📈 Monitoring & Metrics

### Queue Statistics

```json
{
  "active": 2,
  "waiting": 15,
  "completed": 1023,
  "failed": 3,
  "delayed": 0
}
```

### Health Endpoints
- `GET /health` - Server status
- `GET /queue/stats` - Queue metrics
- `GET /status/{jobId}` - Job status

### Logging
- **Console**: Real-time output during development
- **File (combined.log)**: All events
- **File (error.log)**: Errors only
- **Rotation**: 5MB files, max 10 (combined) / 5 (error)

---

## 🔄 Scaling Considerations

### Horizontal Scaling
1. Deploy multiple instances behind load balancer
2. All instances connect to shared MongoDB + Redis
3. BullMQ handles distributed worker pool
4. Sticky sessions not required (stateless)

### Vertical Scaling
- Increase `MAX_CONCURRENT_JOBS` for more worker threads
- Allocate more RAM (increase Canvas buffer)
- Monitor CPU usage during image generation

### Data Retention
- Members: Keep indefinitely (indexed by memberID)
- Logs: 30 days TTL (automatic cleanup)
- Images: Keep on disk indefinitely

---

## 🛠️ Development Workflow

### Local Testing
1. Start MongoDB & Redis (docker-compose)
2. Run `npm run dev` (ts-node development server)
3. Send test webhook via curl
4. Monitor logs in console
5. Check generated files in `./milpac/`

### Production Deployment
1. Build: `npm run build` (TypeScript → JavaScript)
2. Start: `npm start` (Node.js runner)
3. Externalize config via environment
4. Enable PM2 or systemd for process management
5. Set up monitoring (APM, logs aggregation)

---

## 📚 Related Documentation

- [SETUP.md](SETUP.md) - 5-minute quick start
- [PROJECT.md](PROJECT.md) - Complete feature documentation
- [README.md](README.md) - Project overview
