# 🎖️ Milpac Image Generator

Automatic military personnel uniform image generation system triggered by webhooks.

**Generate professional military uniform images in milliseconds when member data changes.**

---

## 🎯 What This Does

When a soldier gets promoted or earns a medal, their uniform image is **automatically regenerated** with:

- ✅ New rank insignia
- ✅ Updated medals & citations  
- ✅ Correct uniform color & badges
- ✅ Professional Canvas rendering (1398×1000px PNG)

All triggered by a simple webhook from your database API.

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **[SETUP.md](SETUP.md)** | ⚡ Get running in 5 minutes |
| **[PROJECT.md](PROJECT.md)** | 📖 Complete documentation (setup, API, config) |
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | 🏗️ System design & webhooks |

**Start here:** [SETUP.md](SETUP.md) for quick start

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env

# 3. Start MongoDB & Redis
docker-compose up -d mongo redis

# 4. Start server
npm run dev

# 5. Send a test webhook
curl -X POST http://localhost:42070/webhook \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
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
        "citations": ["1year"],
        "TrainingMedals": [],
        "RifleManBadge": ""
      }
    }
  }'
```

Generated image will be saved to `./milpac/12345.png` ✨

---

## 🏗️ Architecture

```
Koda Database API
      ↓
POST /webhook
      ↓
Validate API Key
      ↓
Detect Field Changes
      ↓
Queue Async Job
      ↓
Generate Image (Canvas)
      ↓
Save PNG + Update DB
      ↓
✅ Complete
```

**Key Features:**

- 🔄 **Webhook-driven** — No manual triggers needed
- ⏱️ **Fast** — Selective field change detection (skip if no rank/medal changes)
- 🔁 **Reliable** — Job queue with exponential backoff retry
- 📦 **Scalable** — Supports single records and batch operations
- 🎨 **Configurable** — Object-based placement system (not hard-coded pixels)
- ✅ **Type-safe** — Full TypeScript support

---

## 📡 Webhook Endpoint

### `POST /webhook`

**Headers:**
```
Authorization: Bearer {WEBHOOK_API_KEY}
Content-Type: application/json
```

**Request:**
```json
{
  "event": "member.updated",
  "member": {
    "name": "John Smith",
    "memberID": "12345",
    "discordID": "987654321",
    "changeFields": ["rank", "medals"],
    "data": {
      "rank": "SGT",
      "Uniform": "Blue",
      "badge": "Infantry",
      "medallions": ["Bronze1"],
      "citations": ["campaign", "gallantry"],
      "TrainingMedals": ["ExpR"],
      "RifleManBadge": "PTE"
    }
  }
}
```

**Response:**
```json
{
  "status": "queued",
  "jobId": "job_1a2b3c4d",
  "message": "Image generation queued for MemberID 12345"
}
```

Full API docs → [PROJECT.md](PROJECT.md#-api-documentation)

---

## 🛠️ Tech Stack

- **Node.js 18+** — JavaScript runtime
- **Express.js** — Web framework
- **TypeScript** — Type safety
- **Canvas** — Image rendering
- **BullMQ** — Job queue (Redis-backed)
- **MongoDB** — Data persistence
- **Redis** — Job storage

---

## ⚙️ Configuration

**Key environment variables:**

```env
# Webhook security
WEBHOOK_API_KEY=your_secure_key_here

# Databases
MONGO_URL=mongodb://localhost:27017/milpac
REDIS_URL=redis://localhost:6379

# Image output
IMAGE_OUTPUT_DIR=./milpac

# Job queue
MAX_RETRIES=5
JOB_TIMEOUT_MS=30000
```

See [.env.example](.env.example) for all options.

---

## 📁 Project Structure

```
src/
├── server.ts                 # Express app & webhook endpoint
├── services/                 # Business logic
│   ├── webhook.service.ts
│   ├── change-detector.service.ts
│   ├── image-generator.service.ts
│   ├── queue.service.ts
│   └── storage.service.ts
├── placement/                # Object-based positioning
│   └── placement.config.ts
├── handlers/                 # Route handlers
├── models/                   # Data schemas
└── utility/                  # Helpers

milpac/                       # Generated PNG images
medals.json                   # Medal/citation mappings
```

---

## 🚀 Deployment

### Docker

```bash
docker build -t milpac-generator .
docker run -d -p 42070:42070 \
  -e WEBHOOK_API_KEY=your_key \
  -e MONGO_URL=mongodb://... \
  -e REDIS_URL=redis://... \
  milpac-generator
```

### Docker Compose

```bash
docker-compose up -d
```

See [PROJECT.md](PROJECT.md#-deployment) for full deployment guide.

---

## 📊 What Gets Updated

When a webhook is received, the system checks these fields:

**Regenerates image if changed:**
- `rank` — Military rank
- `Uniform` — Uniform color (Blue/Brown)
- `badge` — Corps badge
- `medallions` — Decorative medals
- `citations` — Service medals
- `TrainingMedals` — Training badges
- `RifleManBadge` — Marksmanship badge

**Ignores (no regen):**
- `name` — Metadata only
- `discordID` — Metadata only
- `memberID` — Metadata only
- Other non-visual fields

This keeps generation **fast** by skipping unnecessary work.

---

## 🐛 Troubleshooting

Common issues? See [Troubleshooting section in PROJECT.md](PROJECT.md#-troubleshooting)

**Quick checks:**

```bash
# Is MongoDB running?
mongosh

# Is Redis running?
redis-cli ping

# Is server running?
curl http://localhost:42070/webhook

# Check logs
tail -f logs/milpac.log
```

---

## 💡 Use Cases

✅ **Automatic Rank Promotions** — Update uniform when soldier is promoted  
✅ **Medal Awards** — Regenerate image when earning decorations  
✅ **Batch Updates** — Process multiple members in one webhook  
✅ **Webhook History** — Track all generation events in MongoDB  
✅ **Retry on Failure** — Automatic retry with exponential backoff  

---

## 🔄 Lifecycle

```
1. Webhook Received
   ↓
2. Validate API Key
   ↓
3. Extract Member Data
   ↓
4. Compare with Stored Data
   ↓
5. If Relevant Fields Changed:
   ├─ Queue Generation Job
   ├─ Render Image (Canvas)
   ├─ Save PNG
   └─ Update MongoDB
   ↓
6. Return Status
```

---

## 📖 Next Steps

1. **New to the project?** → Start with [SETUP.md](SETUP.md)
2. **Want full docs?** → Read [PROJECT.md](PROJECT.md)
3. **Understanding architecture?** → See [ARCHITECTURE.md](ARCHITECTURE.md)
4. **Deploying?** → Check deployment section in [PROJECT.md](PROJECT.md#-deployment)
5. **Customizing placement?** → Edit [src/placement/placement.config.ts](src/placement/placement.config.ts)

---

## 📋 Requirements

- Node.js 18.0.0+
- MongoDB 5.0+
- Redis 6.0+
- 512MB RAM minimum

---

## 🔐 Security

- API key validation on all webhooks
- Optional HMAC-SHA256 signature verification
- Environment-based secrets management
- No hardcoded credentials

---

## 📝 License

ISC

---

## 🤝 Contributing

Found a bug? Have a feature idea?

1. Check [existing issues](https://github.com/your-org/asot-milpac-image-generator/issues)
2. Open a new issue with details
3. Include config (without secrets) and logs if applicable

---

## 📞 Support

- 📖 Read [PROJECT.md](PROJECT.md) for detailed docs
- 🏗️ Check [ARCHITECTURE.md](ARCHITECTURE.md) for system design
- 🚀 Follow [SETUP.md](SETUP.md) for quick start
- 🐛 See troubleshooting in [PROJECT.md](PROJECT.md#-troubleshooting)

---

## 🎉 Ready to Start?

**[→ Go to SETUP.md](SETUP.md) to get running in 5 minutes**

---

**Last Updated:** March 30, 2026  
**Version:** 1.0.0  
**Status:** Production Ready ✅

