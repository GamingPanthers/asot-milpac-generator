# 🚀 ASOT Milpac Generator - Setup & Deployment Guide

## 📋 Quick Navigation

- [Local Development Setup](#local-development-setup)
- [Docker Setup](#docker-setup)
- [Production Deployment](#production-deployment)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Troubleshooting Installation](#troubleshooting-installation)

---

## 💻 Local Development Setup

### Prerequisites

```bash
# Check Node.js version (need 18.0.0+)
node --version
# Expected: v18.x.x or v20.x.x

# Check npm version (need 9.0.0+)
npm --version
# Expected: 9.x.x or 10.x.x

# Check if Docker is installed (optional for local dev)
docker --version
redis-cli --version
mongosh --version
```

### Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/Mommers-Co/asot-milpac-generator.git
cd asot-milpac-generator

# Or if already cloned, ensure you're on the correct branch
git checkout main
git pull origin main
```

### Step 2: Install Dependencies

```bash
# Clear npm cache (optional but recommended)
npm cache clean --force

# Install all dependencies
npm install

# Verify installation
npm list --depth=0
```

Expected output should include:
```
asot-milpac-generator@1.0.0
├── bullmq@^5.1.1
├── canvas@^3.2.3
├── dotenv@^16.3.1
├── express@^4.18.2
├── mongoose@^7.5.0
├── redis@^4.6.10
├── sharp@^0.34.5
└── ... (other dependencies)
```

### Step 3: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
# or
code .env  # VS Code

# Essential variables to update:
# WEBHOOK_API_KEY=dev-key-change-in-production
# MONGO_URL=mongodb://localhost:27017/milpac
# REDIS_URL=redis://localhost:6379
# NODE_ENV=development
# LOG_LEVEL=debug (for development)
```

**Example `.env` for local development:**
```env
# Server
PORT=42070
NODE_ENV=development

# Security (use a proper key in production)
WEBHOOK_API_KEY=local-dev-secret-key-12345

# Database
MONGO_URL=mongodb://localhost:27017/milpac
REDIS_URL=redis://localhost:6379

# Image Generation
IMAGE_OUTPUT_DIR=./milpac
IMAGE_WIDTH=1398
IMAGE_HEIGHT=1000
IMAGE_SERVICE_URL=http://localhost:42070

# Job Queue
MAX_RETRIES=3
JOB_TIMEOUT=30000
MAX_CONCURRENT_JOBS=2

# Logging
LOG_LEVEL=debug
```

### Step 4: Start MongoDB & Redis

#### Option A: Using Docker Compose (Recommended)

```bash
# Start MongoDB and Redis in background
docker-compose up -d mongo redis

# Verify services are running
docker-compose ps

# You should see:
# NAME                COMMAND             STATUS
# asot-milpac-generator-mongo-1   mongoserver   Up 2 seconds
# asot-milpac-generator-redis-1   redis qrver   Up 2 seconds

# View logs
docker-compose logs mongo
docker-compose logs redis

# Stop services (when done)
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

#### Option B: Manual Installation (macOS/Linux)

```bash
# MongoDB
# macOS with Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Linux (Ubuntu/Debian)
sudo apt-get install -y mongodb
sudo systemctl start mongodb

# Redis
# macOS
brew install redis
brew services start redis

# Linux (Ubuntu/Debian)
sudo apt-get install -y redis-server
sudo systemctl start redis-server
```

#### Option C: Manual Installation (Windows with WSL)

```bash
# Install Windows Subsystem for Linux (WSL2)
wsl --install

# Inside WSL
sudo apt-get update
sudo apt-get install -y mongodb redis-server

# Start services
sudo systemctl start mongodb
sudo systemctl start redis-server
```

### Step 5: Verify Database Connections

```bash
# Test MongoDB connection
mongosh --quiet --eval "db.adminCommand('ping')"
# Expected: { ok: 1 }

# Test Redis connection
redis-cli ping
# Expected: PONG

# Or use the health endpoint (after server starts)
curl http://localhost:42070/health | jq .
```

### Step 6: Start Development Server

```bash
# Start the server in development mode
npm run dev

# You should see output like:
# ✓ Server starting on port: 42070
# ✓ Environment: development
# ✓ Connected to MongoDB
# ✓ Test webhook endpoint: POST http://localhost:42070/webhook
# ✓ Images available at: http://localhost:42070/milpac/{memberId}.png
```

### Step 7: Test the Server

```bash
# 1. Health Check
curl http://localhost:42070/health

# Expected:
# {
#   "status": "success",
#   "message": "Server is running",
#   "dependencies": {
#     "mongodb": "healthy",
#     "redis": "healthy"
#   }
# }

# 2. Send Test Webhook
WEBHOOK_KEY=$(grep WEBHOOK_API_KEY .env | cut -d'=' -f2)

curl -X POST http://localhost:42070/webhook \
  -H "Authorization: Bearer $WEBHOOK_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "member.updated",
    "member": {
      "name": "Test Member",
      "memberID": "test-001",
      "discordID": "123456789",
      "changeFields": ["rank"],
      "data": {
        "rank": "SGT",
        "Uniform": "Blue",
        "badge": "Infantry"
      }
    }
  }'

# Expected: 200 OK with job queued response

# 3. Check Job Status
# Use the jobId from previous response
curl http://localhost:42070/status/job_xxxxx

# 4. View Queue Stats
curl -X GET http://localhost:42070/queue/stats \
  -H "Authorization: Bearer $WEBHOOK_KEY"
```

### Step 8: Development Workflow

```bash
# Watch for TypeScript errors
npm run type-check

# Run linting
npm run lint

# Run tests
npm test

# View logs in real-time
tail -f logs/milpac.log

# Stop server
# Press Ctrl+C in the terminal
```

---

## 🐳 Docker Setup

### Single Container Development

```bash
# Build image
docker build -t asot-milpac-generator:dev .

# Run container with local volumes
docker run -d \
  --name milpac-gen \
  -p 42070:42070 \
  -e WEBHOOK_API_KEY=my-secret-key \
  -e MONGO_URL=mongodb://mongo:27017/milpac \
  -e REDIS_URL=redis://redis:6379 \
  -v $(pwd)/milpac:/app/milpac \
  -v $(pwd)/logs:/app/logs \
  --link mongo:mongo \
  --link redis:redis \
  asot-milpac-generator:dev

# View logs
docker logs -f milpac-gen

# Stop container
docker stop milpac-gen

# Clean up
docker rm milpac-gen
```

### Docker Compose (Multi-Container)

```bash
# Start all services (MongoDB, Redis, Generator)
docker-compose up -d

# View services
docker-compose ps

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f generator
docker-compose logs -f mongo
docker-compose logs -f redis

# Stop services
docker-compose stop

# Stop and remove
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Customizing Docker Compose

Edit `docker-compose.yml`:

```yaml
version: '3.8'
services:
  generator:
    build: .
    container_name: milpac-generator
    ports:
      - "42070:42070"
    environment:
      NODE_ENV: development
      WEBHOOK_API_KEY: ${WEBHOOK_API_KEY}
      MONGO_URL: mongodb://mongo:27017/milpac
      REDIS_URL: redis://redis:6379
      LOG_LEVEL: debug
    volumes:
      - ./milpac:/app/milpac
      - ./logs:/app/logs
    depends_on:
      - mongo
      - redis
    restart: unless-stopped
    networks:
      - milpac-network

  mongo:
    image: mongo:7.0
    container_name: milpac-mongo
    volumes:
      - mongo-data:/data/db
    environment:
      MONGO_INITDB_DATABASE: milpac
    ports:
      - "27017:27017"
    networks:
      - milpac-network

  redis:
    image: redis:7-alpine
    container_name: milpac-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - milpac-network

volumes:
  mongo-data:
  redis-data:

networks:
  milpac-network:
    driver: bridge
```

---

## 🚀 Production Deployment

### Pre-Deployment Checklist

```bash
# Code Quality
☐ npm run lint           # Passes linting
☐ npm run type-check     # No TypeScript errors
☐ npm test               # All tests pass
☐ npm run build          # Builds successfully

# Configuration
☐ WEBHOOK_API_KEY is set to strong, random value
☐ NODE_ENV=production
☐ MONGO_URL points to production MongoDB
☐ REDIS_URL points to production Redis
☐ IMAGE_SERVICE_URL set to public domain/IP
☐ LOG_LEVEL=info (not debug)
☐ All env vars reviewed for correctness

# Security
☐ API keys not committed to Git
☐ .env file is .gitignored
☐ HTTPS configured on load balancer
☐ MongoDB authentication enabled
☐ Redis authentication enabled (if exposed)
☐ Firewall rules restrict webhook endpoint
```

### Docker Compose Production Deployment

```bash
# 1. Create production .env file
cat > .env.production << EOF
NODE_ENV=production
WEBHOOK_API_KEY=your-strong-random-key-here
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/milpac
REDIS_URL=redis://:password@redis.example.com:6379
IMAGE_SERVICE_URL=https://api.example.com
LOG_LEVEL=info
MAX_CONCURRENT_JOBS=10
EOF

# 2. Set environment variables
export $(cat .env.production | xargs)

# 3. Build and start
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 4. Verify services
docker-compose ps

# 5. Check health
curl https://api.example.com/health

# 6. Monitor logs
docker-compose logs -f --tail=100
```

**Example `docker-compose.prod.yml`:**

```yaml
version: '3.8'
services:
  generator:
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:42070/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G
        reservations:
          cpus: '1'
          memory: 512M
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "10"
```

### Kubernetes Deployment

```bash
# 1. Create namespace
kubectl create namespace milpac

# 2. Create secrets
kubectl create secret generic generator-secrets \
  --from-literal=webhook-api-key=your-key \
  -n milpac

# 3. Create ConfigMap
kubectl create configmap generator-config \
  --from-literal=mongo-url=mongodb+srv://... \
  --from-literal=redis-url=redis://... \
  -n milpac

# 4. Deploy
kubectl apply -f k8s/deployment.yaml -n milpac
kubectl apply -f k8s/service.yaml -n milpac

# 5. Monitor
kubectl logs -f deployment/asot-milpac-generator -n milpac
kubectl get pods -n milpac
kubectl describe pod <pod-name> -n milpac

# 6. Scale
kubectl scale deployment asot-milpac-generator --replicas=5 -n milpac
```

**Example Kubernetes Deployment** (`k8s/deployment.yaml`):

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: asot-milpac-generator
  namespace: milpac
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: asot-milpac-generator
  template:
    metadata:
      labels:
        app: asot-milpac-generator
    spec:
      serviceAccountName: milpac-service-account
      containers:
      - name: generator
        image: your-registry/asot-milpac-generator:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 42070
          name: http
        env:
        - name: NODE_ENV
          value: "production"
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
        - name: LOG_LEVEL
          value: "info"
        - name: MAX_CONCURRENT_JOBS
          value: "10"
        livenessProbe:
          httpGet:
            path: /health
            port: 42070
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
        readinessProbe:
          httpGet:
            path: /health
            port: 42070
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        volumeMounts:
        - name: logs
          mountPath: /app/logs
      volumes:
      - name: logs
        emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: asot-milpac-generator
  namespace: milpac
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 42070
    protocol: TCP
    name: http
  selector:
    app: asot-milpac-generator
```

### AWS Deployment (ECS + Fargate)

```bash
# 1. Build and push image to ECR
aws ecr create-repository --repository-name asot-milpac-generator

docker build -t asot-milpac-generator .
docker tag asot-milpac-generator:latest \
  {ACCOUNT_ID}.dkr.ecr.{REGION}.amazonaws.com/asot-milpac-generator:latest
docker push {ACCOUNT_ID}.dkr.ecr.{REGION}.amazonaws.com/asot-milpac-generator:latest

# 2. Update ECS task definition with image
# See task-definition.json

# 3. Deploy to ECS cluster
aws ecs update-service \
  --cluster milpac-prod \
  --service asot-milpac-generator \
  --force-new-deployment

# 4. Monitor
aws ecs describe-services --cluster milpac-prod --services asot-milpac-generator
```

---

## ⚙️ Environment Configuration

### All Available Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 42070 | HTTP server port |
| `NODE_ENV` | Yes | development | Environment (development, production) |
| `WEBHOOK_API_KEY` | Yes | — | API key for webhook authentication |
| `MONGO_URL` | Yes | mongodb://localhost:27017/milpac | MongoDB connection string |
| `REDIS_URL` | Yes | redis://localhost:6379 | Redis connection string |
| `IMAGE_OUTPUT_DIR` | No | ./milpac | Output directory for PNG files |
| `IMAGE_WIDTH` | No | 1398 | Generated image width (px) |
| `IMAGE_HEIGHT` | No | 1000 | Generated image height (px) |
| `IMAGE_SERVICE_URL` | No | http://localhost:42070 | Public URL for images |
| `MAX_RETRIES` | No | 5 | Job retry attempts |
| `JOB_TIMEOUT` | No | 30000 | Job timeout in ms |
| `MAX_CONCURRENT_JOBS` | No | 5 | Parallel jobs to process |
| `LOG_LEVEL` | No | info | Logging level (error, warn, info, debug) |
| `API_TIMEOUT` | No | 30000 | API request timeout in ms |

### MongoDB Connection Strings

```bash
# Local development
MONGO_URL=mongodb://localhost:27017/milpac

# Local with authentication
MONGO_URL=mongodb://username:password@localhost:27017/milpac

# MongoDB Atlas (cloud)
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/milpac

# Docker Compose
MONGO_URL=mongodb://mongo:27017/milpac

# Docker named network
MONGO_URL=mongodb://mongo-container-name:27017/milpac
```

### Redis Connection Strings

```bash
# Local development
REDIS_URL=redis://localhost:6379

# Local with authentication
REDIS_URL=redis://:password@localhost:6379

# Remote Redis
REDIS_URL=redis://redis.example.com:6379

# Redis with TLS (production)
REDIS_URL=rediss://:password@redis.example.com:6379

# Docker Compose
REDIS_URL=redis://redis:6379
```

---

## 📊 Database Setup

### MongoDB Collections

The application requires these collections in MongoDB database `milpac`:

```javascript
// Connect to MongoDB
mongosh mongodb://localhost:27017/milpac

// Create collections with indexes
db.createCollection("members");
db.members.createIndex({ memberID: 1 }, { unique: true });
db.members.createIndex({ imagePath: 1 });

db.createCollection("milpac_ranks");
db.milpac_ranks.createIndex({ _id: 1 });

db.createCollection("milpac_badges");
db.milpac_badges.createIndex({ _id: 1 });

db.createCollection("milpac_medallions");
db.milpac_medallions.createIndex({ _id: 1 });

db.createCollection("milpac_citations");
db.milpac_citations.createIndex({ _id: 1 });

db.createCollection("milpac_training_medals");
db.milpac_training_medals.createIndex({ _id: 1 });

db.createCollection("milpac_corps");
db.milpac_corps.createIndex({ _id: 1 });

db.createCollection("milpac_image_data");
db.milpac_image_data.createIndex({ memberID: 1 });
db.milpac_image_data.createIndex({ timestamp: 1 });
```

### Sample Data

```javascript
// Sample rank
db.milpac_ranks.insertOne({
  _id: "SGT",
  name: "Sergeant",
  assetFile: "sgt_chevrons.png",
  position: { x: 100, y: 50 }
});

// Sample badge
db.milpac_badges.insertOne({
  _id: "Infantry",
  name: "Infantry Corps",
  assetFile: "infantry_badge.png",
  position: { x: 150, y: 100 }
});

// Sample member
db.members.insertOne({
  memberID: "12345",
  name: "John Smith",
  discordID: "98765",
  rank: "SGT",
  Uniform: "Blue",
  badge: "Infantry",
  medallions: [],
  citations: [],
  TrainingMedals: [],
  RifleManBadge: ""
});
```

---

## 🔧 Troubleshooting Installation

### Issue: Cannot find module 'canvas'

```bash
# Solution 1: Rebuild native modules
npm rebuild canvas

# Solution 2: Check build tools are installed
# macOS
xcode-select --install

# Linux (Ubuntu/Debian)
sudo apt-get install build-essential python3

# Windows
# Install Visual Studio Build Tools
```

### Issue: MongoDB connection failed

```bash
# Check if MongoDB is running
mongosh --eval "db.adminCommand('ping')"

# If not running, start MongoDB
docker-compose up -d mongo

# Check MongoDB logs
docker-compose logs mongo
```

### Issue: Redis connection failed

```bash
# Check if Redis is running
redis-cli ping

# If not running, start Redis
docker-compose up -d redis

# Check Redis logs
docker-compose logs redis
```

### Issue: Port 42070 already in use

```bash
# Find process using port
lsof -i :42070

# Kill process
kill -9 <PID>

# Or use different port
PORT=42071 npm run dev
```

### Issue: Permission denied on milpac/ directory

```bash
# Create directory
mkdir -p milpac/uniform

# Fix permissions
chmod -R 755 milpac/
chmod -R 755 logs/
```

### Issue: Out of memory

```bash
# Increase Node.js heap size
NODE_OPTIONS="--max-old-space-size=512" npm run dev
```

### Issue: Image generation timeout

```bash
# Increase job timeout
JOB_TIMEOUT=60000 npm run dev

# Or increase globally in .env
echo "JOB_TIMEOUT=60000" >> .env
```

---

## 📊 Health Check Endpoints

### Manual Health Verification

```bash
# 1. Health Check
curl -s http://localhost:42070/health | jq '.dependencies'

# Expected output:
# {
#   "mongodb": "healthy",
#   "redis": "healthy"
# }

# 2. Queue Stats
WEBHOOK_KEY=$(grep WEBHOOK_API_KEY .env | cut -d'=' -f2)
curl -s http://localhost:42070/queue/stats \
  -H "Authorization: Bearer $WEBHOOK_KEY" | jq '.data'

# Expected output:
# {
#   "waiting": 0,
#   "active": 0,
#   "completed": 0,
#   "failed": 0
# }

# 3. Test Webhook
curl -s -X POST http://localhost:42070/webhook \
  -H "Authorization: Bearer $WEBHOOK_KEY" \
  -H "Content-Type: application/json" \
  -d '{"event":"member.updated","member":{"name":"Test","memberID":"test-1","discordID":"123","data":{"rank":"SGT"}}}' | jq '.'
```

---

**Last Updated:** April 2026  
**Version:** 1.0.0
