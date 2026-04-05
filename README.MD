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



## 📚 Documentation Guide

**Not sure where to start? See [DOCUMENTATION_MAP.md](DOCUMENTATION_MAP.md) for a navigation guide by use case.**

We maintain comprehensive documentation organized by use case:

| Document | Purpose | For Whom |
|----------|---------|----------|
| [SETUP.md](SETUP.md) | 🚀 **Installation & Deployment** — Local dev, Docker, K8s, production | Getting started, deploying |
| [PROJECT.md](PROJECT.md) | 📖 **Complete Project Guide** — Folder structure, full API docs, data flows | Understanding the system |
| [API_REFERENCE.md](API_REFERENCE.md) | 📡 **API Endpoint Reference** — Request/response schemas, curl examples | Building webhooks |
| [ARCHITECTURE.md](ARCHITECTURE.md) | 🏛️ **System Architecture** — Design patterns, performance, scalability | Deep technical knowledge |
| [CONFIGURATION.md](CONFIGURATION.md) | ⚙️ **Environment Variables** — All config options and their values | Setup & configuration |
| [DATABASE_ID_NAMES.md](DATABASE_ID_NAMES.md) | 📊 **MongoDB Collections** — All database schemas and IDs | Database design |

**Quick Navigation:**
- 👤 **First time?** → Start with [SETUP.md](SETUP.md)
- 🔌 **Integrating webhooks?** → See [API_REFERENCE.md](API_REFERENCE.md)
- 🏗️ **Understanding architecture?** → Read [ARCHITECTURE.md](ARCHITECTURE.md)
- 📋 **Need all details?** → Check [PROJECT.md](PROJECT.md)

---


## 📡 Webhook Integration

**See [API_REFERENCE.md#-post-webhook](API_REFERENCE.md#-post-webhook) for complete webhook documentation and examples.**

**Quick Example:**
```bash
curl -X POST http://localhost:42070/webhook \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "member.updated",
    "member": {
      "name": "John Smith",
      "memberID": "12345",
      "discordID": "987654321",
      "data": {"rank": "SGT", "Uniform": "Blue", "badge": "Infantry"}
    }
  }'
```

**Trigger Fields** (regenerate image):
- `rank`, `Uniform`, `badge`, `medallions`, `citations`, `TrainingMedals`, `RifleManBadge`

**Ignored Fields** (no image regeneration):
- `name`, `discordID`, `memberID`, other non-visual fields

---


## 🐛 Troubleshooting

See [SETUP.md#-troubleshooting-installation](SETUP.md#-troubleshooting-installation) for installation issues or [PROJECT.md#-troubleshooting](PROJECT.md#-troubleshooting) for runtime issues.

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


## 📞 Need Help?

**All documentation is organized at the top of this page.** Choose what applies to you:

- **Getting started?** → [SETUP.md](SETUP.md) (5-min quick start)
- **Building webhooks?** → [API_REFERENCE.md](API_REFERENCE.md) (curl examples, schemas)
- **Understanding the system?** → [ARCHITECTURE.md](ARCHITECTURE.md) (design patterns, flow)
- **Need everything?** → [PROJECT.md](PROJECT.md) (comprehensive guide)
- **Configuration issues?** → [CONFIGURATION.md](CONFIGURATION.md) (all env vars)
- **Database questions?** → [DATABASE_ID_NAMES.md](DATABASE_ID_NAMES.md) (MongoDB collections)

---

**Last Updated:** April 1, 2026  
**Version:** 1.0.0  
**Status:** Production Ready ✅

