curl http://localhost:42070/webhook
tail -f logs/milpac.log

<p align="center">
  <img src="https://em-content.zobj.net/source/microsoft-teams/363/military-medal_1f396-fe0f.png" width="80" alt="Military Medal"/>
</p>

<h1 align="center">ASOT Milpac Image Generator</h1>

<p align="center"><b>Automated, military-precision uniform image generation for personnel records</b></p>

<p align="center">
  <img src="https://img.shields.io/badge/status-Production%20Ready-brightgreen?style=flat-square&logo=codeforces"/>
  <img src="https://img.shields.io/badge/version-1.0.0-blue?style=flat-square&logo=typescript"/>
  <img src="https://img.shields.io/badge/last%20updated-April%202026-lightgrey?style=flat-square&logo=github"/>
</p>

---

<p align="center">
  <img src="https://img.icons8.com/ios-filled/100/4a90e2/military-helmet.png" width="60" alt="Helmet"/>
</p>

<p align="center">
<b>"No soldier left behind—every promotion, every medal, every detail, instantly reflected in their digital uniform."</b>
</p>

---

# 🪖 Mission Brief

A robust, automated system for generating professional military personnel uniform images based on live data from MongoDB. When a member’s rank, medals, or qualifications change, a new uniform image is instantly rendered and saved—no manual work required.

---


## 🏅 Features


<ul>
  <li>🎯 <b>Fully database-driven</b> asset lookups (no static mapping)</li>
  <li>🚨 <b>Webhook-triggered, event-driven</b> image generation</li>
  <li>🎖️ <b>Accurate overlays</b> for rank, medals, badges, and name badge</li>
  <li>🖼️ <b>High-quality PNG output</b> (1398×1000px) using node-canvas and sharp</li>
  <li>🛡️ <b>TypeScript, Express, MongoDB, Redis, BullMQ, and Docker</b> support</li>
  <li>📋 <b>Detailed logging</b> and robust error handling</li>
</ul>

---


## 🚀 Quick Deployment

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


## 🏗️ Command Structure

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

---


## 🛠️ Arsenal

- **Node.js 18+** — JavaScript runtime
- **Express.js** — Web framework
- **TypeScript** — Type safety
- **Canvas** — Image rendering
- **Sharp** — Image compositing
- **BullMQ** — Job queue (Redis-backed)
- **MongoDB** — Data persistence
- **Redis** — Job storage
- **Docker** — Containerization

---


## ⚙️ Field Manual

Key environment variables:

```env
WEBHOOK_API_KEY=your_secure_key_here
MONGO_URL=mongodb://localhost:27017/milpac
REDIS_URL=redis://localhost:6379
IMAGE_OUTPUT_DIR=./milpac
MAX_RETRIES=5
JOB_TIMEOUT_MS=30000
```

See `.env.example` for all options.

---


## 📁 Barracks Layout

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


## 📡 Orders Inbound (Webhook)

### `POST /webhook`

**Headers:**
```
Authorization: Bearer {WEBHOOK_API_KEY}
Content-Type: application/json
```

**Request Example:**
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

**Response Example:**
```json
{
  "status": "queued",
  "jobId": "job_1a2b3c4d",
  "message": "Image generation queued for MemberID 12345"
}
```

---


## 📊 What Triggers a Uniform Change?

Regenerates image if changed:
- `rank` — Military rank
- `Uniform` — Uniform color (Blue/Brown)
- `badge` — Corps badge
- `medallions` — Decorative medals
- `citations` — Service medals
- `TrainingMedals` — Training badges
- `RifleManBadge` — Marksmanship badge

Ignores (no regen):
- `name`, `discordID`, `memberID`, and other non-visual fields

---


## 🐛 Field Diagnostics

See [PROJECT.md](PROJECT.md#-troubleshooting) for common issues and solutions.

---


## 💡 Tactical Scenarios

- Automatic rank promotions
- Medal awards
- Batch updates
- Webhook history
- Retry on failure

---


## 🔄 Operation Flow

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


## 📋 Minimum Enlistment Requirements

- Node.js 18.0.0+
- MongoDB 5.0+
- Redis 6.0+
- 512MB RAM minimum

---


## 🔐 Security Protocols

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


## 🎉 Ready to Deploy?

**[→ Go to SETUP.md](SETUP.md) to get running in 5 minutes**

---

**Last Updated:** April 1, 2026  
**Version:** 1.0.0  
**Status:** Production Ready ✅

