# Milpac Image Generator

**Automatic military personnel uniform image generation system with webhook automation.**

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Features](#features)
4. [Tech Stack](#tech-stack)
5. [Setup & Installation](#setup--installation)
6. [Configuration](#configuration)
7. [API Documentation](#api-documentation)
8. [Data Models](#data-models)
9. [Image Generation](#image-generation)
10. [Development](#development)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

**Milpac Image Generator** is an automated system that generates high-quality military personnel uniform images on-demand. It integrates with Koda's database via webhooks to automatically create uniform images whenever personnel data changes.

### Purpose

- **Automatic Image Generation**: Webhooks trigger image regeneration when rank, medals, or citations change
- **Multiple Output Types**: Generates uniforms, certificates, and medal boxes
- **High Performance**: Object-based placement system ensures scalability
- **Reliable Processing**: Job queue with retry logic ensures no generations are lost
- **Selective Processing**: Only triggers regeneration on relevant field changes

### Use Case

Military organization needs a digital uniform representation for each member. When a member's rank is promoted or earns a medal, the system automatically generates an updated uniform image without manual intervention.

---

## 🏗️ Architecture

### System Flow

```
Koda Database (Custom API)
         │
         │ POST /webhook
         │ {memberID, name, discordID, data}
         ▼
┌──────────────────────────────────────────┐
│     Milpac Image Generator Service       │
│                                          │
│  1. Webhook Receiver                     │
│     ├─ Validate API key & signature      │
│     └─ Parse member data                 │
│                                          │
│  2. Change Detector                      │
│     ├─ Compare with stored data          │
│     └─ Check if rank/medals/citations    │
│        fields changed                    │
│                                          │
│  3. Job Queue (BullMQ)                   │
│     ├─ Enqueue generation job            │
│     ├─ Handle retries                    │
│     └─ Track status                      │
│                                          │
│  4. Image Generator                      │
│     ├─ Render uniform with medals        │
│     ├─ Generated certificates (optional) │
│     ├─ Create medal boxes (optional)     │
│     └─ Use Object-Based Placement        │
│                                          │
│  5. Storage & Update                     │
│     ├─ Save PNG images                   │
│     ├─ Update MongoDB                    │
│     └─ Log generation events             │
└──────────────────────────────────────────┘
         │
         ▼
   /milpac/{memberID}.png
   MongoDB (generation_log)
```

### Components

| Component | Responsibility |
|-----------|-----------------|
| **Webhook Handler** | Receives & validates API requests |
| **Change Detector** | Compares new data vs stored; decides if regen needed |
| **Job Queue** | Manages async processing, retries, batching |
| **Image Generator** | Creates PNG images using Canvas |
| **Placement Engine** | Calculates medal/rank positions (object-based) |
| **Storage Service** | Saves files & updates database |

---

## ✨ Features

### ✅ Implemented

- [x] Webhook-driven image generation
- [x] Multiple identity fields (name, memberID, discordID)
- [x] Selective field change detection
- [x] Job queue with exponential backoff retry
- [x] Single record & batch processing
- [x] Object-based placement configuration
- [x] Canvas-based image rendering (1398×1000px)
- [x] TypeScript for type safety
- [x] Environmental variable configuration
- [x] MongoDB data persistence

### 🚀 Future Enhancements

- [ ] Webhook signature verification (HMAC-SHA256)
- [ ] Job status API endpoint (`GET /jobs/{jobId}`)
- [ ] Web UI for monitoring & manual triggers
- [ ] Image preview before generation
- [ ] Custom medal/ribbon templates
- [ ] Batch webhook processing
- [ ] CI/CD integration

---

## 🛠️ Tech Stack

### Backend
- **Node.js 18+** - JavaScript runtime
- **Express.js** - Web framework
- **TypeScript** - Type-safe development
- **Canvas** - Image rendering engine

### Database
- **MongoDB** - Member data + generation logs
- **Mongoose** - MongoDB ODM

### Job Processing
- **BullMQ** - Job queue management
- **Redis** - Job storage & queue backend

### Utilities
- **Axios** - HTTP client
- **Dotenv** - Environment variable management
- **ESLint** - Code linting

---

## 📦 Setup & Installation

### Prerequisites

- Node.js 18.0.0 or higher
- MongoDB 5.0+
- Redis 6.0+
- Git

### Step 1: Clone Repository

```bash
git clone https://github.com/your-org/asot-milpac-image-generator.git
cd asot-milpac-image-generator
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment

Create `.env` file in root directory:

```bash
# Server
PORT=42070
NODE_ENV=development

# Webhook Security
WEBHOOK_API_KEY=your_secure_api_key_here
WEBHOOK_SIGNATURE_SECRET=your_webhook_secret

# Database
MONGO_URL=mongodb://localhost:27017/milpac
REDIS_URL=redis://localhost:6379

# Image Storage
IMAGE_OUTPUT_DIR=./milpac
TEMP_DIR=./temp

# Job Queue
MAX_RETRIES=5
JOB_TIMEOUT_MS=30000
RETRY_BACKOFF_MS=5000

# Logging
LOG_LEVEL=info
```

### Step 4: Build & Start

```bash
# Compile TypeScript
npm run build

# Start development server
npm run dev

# Or production
npm start
```

Server will be running on `http://localhost:42070`

### Step 5: Verify Installation

```bash
# Test webhook endpoint
curl -X POST http://localhost:42070/webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_secure_api_key_here" \
  -d '{
    "event": "member.updated",
    "member": {
      "name": "John Smith",
      "memberID": "12345",
      "discordID": "987654321",
      "changeFields": ["rank"],
      "data": {
        "rank": "SGT",
        "Uniform": "Blue",
        "badge": "Infantry",
        "medallions": [],
        "citations": [],
        "TrainingMedals": [],
        "RifleManBadge": ""
      }
    }
  }'
```

Expected response:

```json
{
  "status": "queued",
  "jobId": "job_12345",
  "message": "Image generation queued for MemberID 12345"
}
```

---

## ⚙️ Configuration

### Placement Configuration

Edit `src/placement/placement.config.ts` to customize image coordinates:

```typescript
export const PLACEMENT_CONFIG = {
  uniform: {
    canvas: {
      width: 1398,      // Total width
      height: 1000      // Total height
    },
    
    name: {
      x: 475,           // X position
      y: 512,           // Y position
      maxWidth: 120,    // Text width limit
      fontSize: 20,     // Starting font size
      font: "Times New Roman"
    },
    
    medals: {
      lines: [
        {
          id: "first_line",
          y: 511,        // Vertical position
          startX: 1000,  // Starting horizontal
          spacing: 32,   // Space between medals
          maxMedals: 4   // Medals per line
        },
        // ... more lines
      ]
    }
  }
};
```

### Medal Mappings

Edit `medals.json` to define which medals belong to which display line:

```json
{
  "first_line": ["campaign", "gallantry", "crossofvalour"],
  "second_line": ["starofcourage", "beyond", "brokenLance"],
  "third_line": ["1year", "2year", "3year"],
  "training_badges": ["ExpR", "AdvF", "NCO"]
}
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `WEBHOOK_API_KEY` | - | **Required.** API key for webhook validation |
| `WEBHOOK_SIGNATURE_SECRET` | - | **Optional.** For HMAC-SHA256 signature verification |
| `MONGO_URL` | `mongodb://localhost` | MongoDB connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
| `IMAGE_OUTPUT_DIR` | `./milpac` | Where to save generated PNGs |
| `TEMP_DIR` | `./temp` | Temporary file storage |
| `MAX_RETRIES` | `5` | Job retry attempts |
| `JOB_TIMEOUT_MS` | `30000` | Job execution timeout (ms) |
| `RETRY_BACKOFF_MS` | `5000` | Initial retry wait time (ms) |
| `LOG_LEVEL` | `info` | Logging verbosity: debug, info, warn, error |

---

## 📡 API Documentation

### Webhook Endpoint

#### `POST /webhook`

Receives member data updates and queues image generation.

**Headers:**
```
Authorization: Bearer {WEBHOOK_API_KEY}
Content-Type: application/json
```

**Request Body:**
```typescript
{
  "event": "member.updated",
  "timestamp": "2026-03-30T12:30:00Z",
  "batch": false,                           // true for batch ops
  
  "member": {
    "name": "John Smith",
    "memberID": "12345",
    "discordID": "987654321",
    
    // Only send fields that changed
    "changeFields": ["rank", "medals", "citations"],
    
    "data": {
      "rank": "SGT",
      "Uniform": "Blue",
      "badge": "Infantry",
      "RifleManBadge": "PTE",
      "medallions": ["Bronze1", "Silver2"],
      "citations": ["campaign", "gallantry", "1year"],
      "TrainingMedals": ["ExpR", "AdvF", "SASR"]
    }
  },
  
  // Optional: Multiple records for batch
  "members": [
    { "name": "...", "memberID": "...", "data": {...} },
    { "name": "...", "memberID": "...", "data": {...} }
  ]
}
```

**Response (200 OK):**
```json
{
  "status": "queued",
  "jobId": "job_1a2b3c4d",
  "message": "Image generation queued for MemberID 12345",
  "timestamp": "2026-03-30T12:30:01Z"
}
```

**Response (202 Accepted - Skipped):**
```json
{
  "status": "skipped",
  "message": "No relevant fields changed",
  "reason": "Only location field was modified",
  "timestamp": "2026-03-30T12:30:01Z"
}
```

**Response (400 Bad Request):**
```json
{
  "status": "error",
  "error": "Invalid data format",
  "details": "Member data missing required field: rank",
  "timestamp": "2026-03-30T12:30:01Z"
}
```

**Response (401 Unauthorized):**
```json
{
  "status": "error",
  "error": "Invalid API key",
  "timestamp": "2026-03-30T12:30:01Z"
}
```

---

### Change Detection Rules

**Regeneration Triggers** (if ANY of these change):

- `rank` - Military rank
- `Uniform` - Uniform color (Blue/Brown)
- `badge` - Corps badge
- `medallions` - Decorative medallions
- `citations` - Service medals
- `TrainingMedals` - Training badges
- `RifleManBadge` - Rifleman badge

**Ignored Fields** (no regen):

- `name` - Only used in image label
- `discordID` - Metadata only
- `memberID` - Metadata only
- `joindate` - Metadata only
- `milpac_url` - External link only

---

## 📊 Data Models

### Member Schema (MongoDB)

```typescript
{
  _id: ObjectId,
  memberID: String,           // Unique identifier
  name: String,               // Display name
  discordID: String,          // Discord account link
  
  // Military Data
  rank: String,               // Current rank (SGT, CPL, etc.)
  Uniform: String,            // "Blue" | "Brown"
  badge: String,              // Corps badge
  RifleManBadge: String,      // "" | "PTE" | "PTEP"
  medallions: [String],       // Decorative medals
  citations: [String],        // Service medals
  TrainingMedals: [String],   // Training certifications
  
  // Metadata
  joindate: String,           // Join date
  milpac_url: String,         // Original profile link
  
  // Generation History
  lastImageGenerated: Date,
  lastChangeFields: [String],
  imageVersion: Number
}
```

### Generation Job Schema

```typescript
{
  _id: ObjectId,
  jobId: String,              // BullMQ job ID
  memberID: String,           // Member identifier
  type: "single" | "batch",
  status: "pending" | "processing" | "completed" | "failed",
  
  // Trigger Info
  triggeredBy: "webhook",
  changedFields: [String],
  
  // Results
  imageUrl: String,           // Path to generated image
  imageBytesSize: Number,
  generatedAt: Date,
  
  // Error Info (if failed)
  error?: String,
  failureReason?: String,
  retryCount: Number,
  nextRetryAt?: Date,
  
  // Timing
  createdAt: Date,
  completedAt?: Date,
  duration?: Number          // Milliseconds
}
```

---

## 🎨 Image Generation

### Generated Outputs

#### 1. Uniform Image (1398 × 1000px)

What's rendered:

- **Base**: Uniform color (Blue/Brown background)
- **Rank Insignia**: Shoulder/collar rank badge
- **Corps Badge**: Unit/corps identification
- **Name Tape**: Member name (auto-sized to fit)
- **Medallions**: Decorative medals (if any)
- **Training Badges**: Achievement badges overlay
- **Medal Ribbons**: Award citations displayed in rows
- **Rifleman Badge**: Special marksmanship badge (if earned)

Example output: `/milpac/12345.png`

#### 2. Certificate (optional)

Slide-based certificate for rank promotions, awards, etc.

#### 3. Medal Box (optional)

Medal display box showing all earned citations in correct order.

---

## 💻 Development

### Project Structure

```
src/
├── server.ts                    # Express app & endpoints
├── types.ts                     # TypeScript interfaces
├── connectDB.ts                 # MongoDB connection
│
├── services/
│   ├── webhook.service.ts       # Webhook validation & queuing
│   ├── change-detector.service.ts
│   ├── image-generator.service.ts
│   ├── queue.service.ts         # BullMQ management
│   └── storage.service.ts       # File & DB ops
│
├── placement/
│   ├── placement.config.ts      # Coordinate config
│   ├── placement.types.ts       # Placement interfaces
│   └── placement.engine.ts      # Position calculations
│
├── handlers/
│   ├── webhook.handler.ts       # Route handler
│   ├── generation.handler.ts    # Job worker
│   └── error.handler.ts         # Error handling
│
├── models/
│   ├── userData.ts              # Member schema
│   └── generationLog.ts         # Job log schema
│
└── utility/
    ├── data-processor.ts        # Data sanitization
    ├── logger.ts                # Logging utility
    └── validators.ts            # Input validation

public/                          # Static assets (if needed)
milpac/                          # Generated images output
temp/                            # Temporary files
```

### Running Tests

```bash
npm run test
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Code Quality

```bash
npm run lint          # Run ESLint
npm run lint:fix      # Auto-fix issues
npm run format        # Prettier formatting
```

### Building

```bash
npm run build         # Compile TypeScript
npm run dev           # Development (watch mode)
npm start             # Production
```

### Common Development Tasks

**Add a new API endpoint:**
1. Create handler in `src/handlers/`
2. Add route in `src/server.ts`
3. Create service if needed in `src/services/`
4. Add TypeScript types in `src/types.ts`

**Modify placement config:**
1. Update `src/placement/placement.config.ts`
2. Test in development
3. Restart server

**Change medal mappings:**
1. Edit `medals.json`
2. Server reloads automatically in dev
3. Next webhook will use new mappings

---

## 🚀 Deployment

### Docker Deployment

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 42070

CMD ["npm", "start"]
```

**Build & Run:**
```bash
docker build -t milpac-generator .
docker run -d \
  -p 42070:42070 \
  -e WEBHOOK_API_KEY=your_key \
  -e MONGO_URL=mongodb://host \
  -e REDIS_URL=redis://host \
  -v milpac-output:/app/milpac \
  milpac-generator
```

### Docker Compose

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "42070:42070"
    environment:
      MONGO_URL: mongodb://mongo:27017/milpac
      REDIS_URL: redis://redis:6379
      WEBHOOK_API_KEY: ${WEBHOOK_API_KEY}
    depends_on:
      - mongo
      - redis
    volumes:
      - ./milpac:/app/milpac

  mongo:
    image: mongo:5
    volumes:
      - mongo-data:/data/db

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data

volumes:
  mongo-data:
  redis-data:
```

**Deploy:**
```bash
docker-compose up -d
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `WEBHOOK_API_KEY` (32+ random characters)
- [ ] Configure `WEBHOOK_SIGNATURE_SECRET` for HMAC verification
- [ ] Set appropriate `JOB_TIMEOUT_MS` (30s-60s)
- [ ] Configure Redis persistence
- [ ] Set MongoDB replica set (for transactions)
- [ ] Enable SSL/TLS certificates
- [ ] Set up monitoring & alerts
- [ ] Configure log rotation
- [ ] Regular database backups
- [ ] Disable debug logging in production
- [ ] Use environment-specific config

---

## 🐛 Troubleshooting

### Issue: Webhook returns 401 Unauthorized

**Solution:**
- Verify `WEBHOOK_API_KEY` in `.env` matches header
- Check Authorization header format: `Bearer {KEY}`
- Make sure key contains no spaces or quotes

### Issue: Images not generating

**Check:**
1. Redis is running: `redis-cli ping` → should return `PONG`
2. MongoDB is running: Check connection string
3. Job queue is processing: Check BullMQ dashboard or logs
4. Image output directory exists and is writable
5. Check logs: `LOG_LEVEL=debug npm run dev`

### Issue: Job stuck in "processing"

**Solutions:**
1. Check job timeout: Increase `JOB_TIMEOUT_MS` if images take >30s
2. Restart the job queue: `npm run queue:clear`
3. Check server logs for errors
4. Verify enough memory for canvas rendering

### Issue: Slow image generation

**Optimize:**
1. Reduce medal count (complex layout calculations)
2. Cache medal images in memory
3. Increase `RETRY_BACKOFF_MS` to prevent thrashing
4. Check Canvas memory usage: `node --max-old-space-size=4096`
5. Use faster storage (SSD)

### Issue: MongoDB connection errors

**Check:**
```bash
# Test MongoDB connection
mongosh "mongodb://localhost:27017/milpac"

# Verify in .env
echo $MONGO_URL
```

### Issue: Webhook not receiving requests

**Debug:**
```bash
# Check if server is running
curl http://localhost:42070/health

# Test webhook locally
curl -X POST http://localhost:42070/webhook \
  -H "Authorization: Bearer test_key" \
  -H "Content-Type: application/json" \
  -d '{"member": {...}}'
```

### Performance Monitoring

```bash
# Monitor job queue
npm run queue:monitor

# Check Redis memory
redis-cli INFO memory

# Monitor logs
tail -f logs/milpac.log

# Track generation time
LOG_LEVEL=debug npm run dev
```

---

## 📝 Logging

Logs are written to:
- **Console**: Development environment
- **File**: `logs/milpac.log` (production)

**Log Levels:**
- `debug` - Detailed debug information
- `info` - General information
- `warn` - Warning messages
- `error` - Error messages

**Example logs:**
```
[2026-03-30 12:30:01] INFO: Webhook received for memberID 12345
[2026-03-30 12:30:01] INFO: Change detected in fields: rank, medallions
[2026-03-30 12:30:01] INFO: Job queued: job_1a2b3c4d
[2026-03-30 12:30:05] INFO: Image generated: 12345.png (1.2 MB)
[2026-03-30 12:30:05] INFO: MongoDB updated for memberID 12345
```

---

## 📄 License

ISC

---

## 👥 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check existing issues first
- Include logs and configuration (without secrets)

---

## 🔄 Version History

### v1.0.0 (Current)
- Webhook-driven image generation
- Job queue with retry logic
- Object-based placement configuration
- Support for single & batch processing
- MongoDB integration
- TypeScript support

---

## 🚦 Environment Setup Quick Reference

```bash
# 1. Install Node.js 18+
node --version

# 2. Install MongoDB
brew install mongodb-community  # macOS
sudo apt install mongodb        # Linux

# 3. Install Redis
brew install redis              # macOS
sudo apt install redis-server   # Linux

# 4. Start services
brew services start redis       # macOS
brew services start mongodb-community

# 5. Clone & setup
git clone <repo>
cd <repo>
npm install

# 6. Create .env
cp .env.example .env
# Edit .env with your configuration

# 7. Start
npm run dev
```

---

**Last Updated**: March 30, 2026  
**Maintainer**: ASOT Development Team

