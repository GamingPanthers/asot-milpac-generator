# ⚙️ Configuration Guide

This document is the **authoritative reference** for all environment variables used by the ASOT Milpac Image Generator.

**For detailed setup instructions, see [SETUP.md](SETUP.md).**

---

## 📋 All Environment Variables

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| **PORT** | number | No | 42070 | HTTP server listening port |
| **NODE_ENV** | string | Yes | development | Environment: `development` or `production` |
| **WEBHOOK_API_KEY** | string | Yes | — | Secret key for webhook authentication (min 32 chars recommended) |
| **MONGO_URL** | string | Yes | mongodb://localhost:27017/milpac | MongoDB connection string (atlas, local, or custom) |
| **REDIS_URL** | string | Yes | redis://localhost:6379 | Redis connection string (for job queue) |
| **IMAGE_OUTPUT_DIR** | string | No | ./milpac | Directory where generated PNG files are saved |
| **IMAGE_WIDTH** | number | No | 1398 | Generated image width in pixels |
| **IMAGE_HEIGHT** | number | No | 1000 | Generated image height in pixels |
| **IMAGE_SERVICE_URL** | string | No | http://localhost:42070 | Public URL for accessing generated images |
| **MAX_RETRIES** | number | No | 5 | Max retry attempts for failed jobs (exponential backoff) |
| **JOB_TIMEOUT** | number | No | 30000 | Job timeout in milliseconds |
| **MAX_CONCURRENT_JOBS** | number | No | 5 | Number of jobs to process in parallel |
| **LOG_LEVEL** | string | No | info | Logging level: `error`, `warn`, `info`, or `debug` |
| **API_TIMEOUT** | number | No | 30000 | API request timeout in milliseconds |

---

## 🔗 Quick Links

- **[SETUP.md](SETUP.md)** — Step-by-step configuration during installation
- **[PROJECT.md](PROJECT.md)** — Complete documentation with detailed explanations
- **[SETUP.md#environment-configuration](SETUP.md#environment-configuration)** — More environment variable examples
- **[README.md](README.md)** — Quick start guide

---

## 📌 Common Configuration Scenarios

### Local Development
```env
PORT=42070
NODE_ENV=development
WEBHOOK_API_KEY=local-dev-key-unsafe
MONGO_URL=mongodb://localhost:27017/milpac
REDIS_URL=redis://localhost:6379
LOG_LEVEL=debug
```

### Docker Compose
```env
NODE_ENV=development
WEBHOOK_API_KEY=dev-key-change-in-prod
MONGO_URL=mongodb://mongo:27017/milpac
REDIS_URL=redis://redis:6379
LOG_LEVEL=info
```

### Production
```env
PORT=42070
NODE_ENV=production
WEBHOOK_API_KEY=your-strong-random-key-here
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/milpac
REDIS_URL=redis://:password@redis.example.com:6379
IMAGE_SERVICE_URL=https://api.yourdomain.com
LOG_LEVEL=info
MAX_CONCURRENT_JOBS=10
```

---

## 🛡️ Security Best Practices

**API Key:**
- Use strong, random keys (min 32 characters)
- Generate with: `openssl rand -hex 32`
- Change frequently in production
- Never commit to Git or expose in logs

**Sensitive Variables:**
- Use secret managers (HashiCorp Vault, AWS Secrets Manager, etc.)
- Never hardcode credentials
- Rotate keys regularly

**Connection Strings:**
- Use environment-specific URLs
- Enable MongoDB authentication in production
- Enable Redis authentication if exposed to network

---

## ✅ Validation

The system validates configuration on startup:

**Required keys** (production):
- `WEBHOOK_API_KEY`
- `MONGO_URL`
- `REDIS_URL`

**Optional keys:**
- All other variables have sensible defaults

If required vars are missing on startup, the server will exit with error message.

---

See [PROJECT.md#environment-configuration](PROJECT.md#environment-configuration) for more detailed explanations.
