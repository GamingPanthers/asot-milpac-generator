# 🚀 Quick Start Setup Guide

Get the Milpac Image Generator running in 5 minutes.

---

## Prerequisites

Before you begin, make sure you have:

- **Node.js 18+** — [Download](https://nodejs.org/)
  ```bash
  node --version  # Should be v18.0.0 or higher
  ```

- **MongoDB 5+** — [Download](https://www.mongodb.com/try/download/community)
  ```bash
  mongod --version  # Verify installation
  ```

- **Redis 6+** — [Download](https://redis.io/download)
  ```bash
  redis-server --version  # Verify installation
  ```

---

## Step 1: Clone or Download Project

```bash
# Clone from GitHub
git clone https://github.com/your-org/asot-milpac-image-generator.git
cd asot-milpac-image-generator

# Or download ZIP and extract
unzip asot-milpac-image-generator.zip
cd asot-milpac-image-generator
```

---

## Step 2: Install Dependencies

```bash
npm install
```

This installs all required packages from `package.json` (~500MB, takes 2-3 min).

---

## Step 3: Create Environment File

**Copy the template:**

```bash
cp .env.example .env
```

**Edit `.env` and set values:**

```bash
# Required values
WEBHOOK_API_KEY=your_secure_key_here_32_chars_min
MONGO_URL=mongodb://localhost:27017/milpac
REDIS_URL=redis://localhost:6379
PORT=42070

# Optional (can keep defaults)
LOG_LEVEL=info
MAX_RETRIES=5
```

> **🔒 Security Tip:** Generate a strong API key:
> ```bash
> openssl rand -base64 32
> # or
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

## Step 4: Start Services (Databases)

### macOS (with Homebrew)

```bash
# Start MongoDB
brew services start mongodb-community

# Start Redis
brew services start redis

# Verify they're running
brew services list
```

### Linux (systemd)

```bash
# Start MongoDB
sudo systemctl start mongod

# Start Redis
sudo systemctl start redis-server

# Verify
sudo systemctl status mongod redis-server
```

### Windows (Command Prompt as Admin)

```cmd
# MongoDB
mongod --dbpath "C:\data\db"

# Redis (in another terminal)
redis-server
```

### Docker Compose (Easiest)

```bash
# Launch MongoDB + Redis together
docker-compose up -d mongo redis

# Check they're running
docker-compose ps
```

---

## Step 5: Build & Start Server

```bash
# Compile TypeScript
npm run build

# Start development server
npm run dev

# You should see:
# ✓ Connected to MongoDB
# ✓ Connected to Redis
# ✓ Server starting on port: 42070
```

---

## Step 6: Verify Installation

```bash
# Test the webhook endpoint
curl -X POST http://localhost:42070/webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_api_key_here" \
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
        "TrainingMedals": ["ExpR"],
        "RifleManBadge": ""
      }
    }
  }'
```

**Expected response (200 OK):**

```json
{
  "status": "queued",
  "jobId": "job_abc123",
  "message": "Image generation queued for MemberID 12345"
}
```

✅ **Success!** Server is running and ready.

---

## Next Steps

1. **Review Configuration:**
   - Edit `src/placement/placement.config.ts` to customize image positions
   - Update `medals.json` for your medal structure

2. **Connect to Your API:**
   - Use the webhook URL: `http://your-server:42070/webhook`
   - Send Authorization header: `Bearer {WEBHOOK_API_KEY}`
   - Send member data in JSON format (see API docs in PROJECT.md)

3. **Monitor Jobs:**
   - Check generated images in `./milpac/` folder
   - View logs: `tail -f logs/milpac.log`

4. **Deploy to Production:**
   - See Docker & Deployment section in PROJECT.md

---

## Troubleshooting

### Server won't start - "Cannot find module"

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Or if using npm7+
npm ci
```

### "MongoDB connection refused"

```bash
# Check if MongoDB is running
mongosh

# If not, start it
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux
```

### "Redis connection refused"

```bash
# Check if Redis is running
redis-cli ping

# Should return: PONG

# If not, start it
brew services start redis              # macOS
sudo systemctl start redis-server      # Linux
```

### "ENOENT: no such file or directory, mkdir './milpac'"

```bash
# Create required directories
mkdir -p milpac temp logs
```

### Port already in use (42070)

```bash
# Change PORT in .env
# Or kill the process using port 42070

# macOS/Linux
lsof -i :42070
kill -9 <PID>

# Windows
netstat -ano | findstr :42070
taskkill /PID <PID> /F
```

---

## File Locations

| Item | Location |
|------|----------|
| Generated Images | `./milpac/` |
| Temporary Files | `./temp/` |
| Logs | `./logs/milpac.log` |
| Source Code | `./src/` |
| Config | `./src/placement/placement.config.ts` |
| Medals Mapping | `./medals.json` |

---

## Common Commands

```bash
# Development (watch mode)
npm run dev

# Production build
npm run build
npm start

# Lint code
npm run lint

# Format code
npm run format

# Stop servers
npm run stop

# Clear old jobs
npm run queue:clear
```

---

## Environment Checklist

Before going live, verify:

- [ ] `.env` file exists and has all required values
- [ ] `WEBHOOK_API_KEY` is strong (32+ characters)
- [ ] MongoDB is running: `mongosh` connects successfully
- [ ] Redis is running: `redis-cli ping` returns `PONG`
- [ ] Port 42070 is available
- [ ] `./milpac/`, `./temp/`, `./logs/` directories exist
- [ ] `npm run build` completes without errors
- [ ] `npm run dev` starts without errors
- [ ] Webhook endpoint returns 200 status

---

## What's Next?

- 📖 Read [PROJECT.md](PROJECT.md) for full documentation
- 🏗️ Review [ARCHITECTURE.md](ARCHITECTURE.md) for system design
- 🔧 Customize `placement.config.ts` for your uniform layout
- 📡 Connect your custom API to start sending webhooks

---

**🎉 You're ready to use Milpac Image Generator!**

Got stuck? Check the troubleshooting section above or open an issue on GitHub.

