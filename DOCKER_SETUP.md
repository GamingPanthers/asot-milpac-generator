# Docker Setup Guide

This document describes the Docker Compose configuration for the MILPAC Generator application.

## Services

### MongoDB (milpac-mongodb)
- **Image**: mongo:7-alpine
- **Port**: 27017 (internal and exposed)
- **Features**:
  - Replica set enabled for transaction support
  - Health checks every 10 seconds
  - Automatic restart on failure
  - Data persistence with volumes

### Redis (milpac-redis)
- **Image**: redis:7-alpine
- **Port**: 6379 (internal and exposed)
- **Features**:
  - Append-only file (AOF) persistence enabled
  - 512MB memory limit with LRU eviction policy
  - Health checks every 10 seconds
  - Automatic restart on failure

### MILPAC Generator (milpac-generator)
- **Build**: Local Dockerfile (Node.js 18 multi-stage build)
- **Port**: 3000
- **Features**:
  - Built-in health checks (HTTP endpoint)
  - MongoDB connection pooling (max: 10, min: 2, idle timeout: 45s)
  - Environment-based configuration
  - Volume mounts for persistent output and logs
  - Depends on MongoDB and Redis readiness

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

**Important variables for production**:

```env
NODE_ENV=production
MONGO_PASSWORD=your_secure_password
IMAGE_SERVICE_URL=https://your-domain.com
WEB_SERVICE_URL=https://web-domain.com
```

### MongoDB Connection Pooling

The application uses optimized connection pooling:
- **maxPoolSize**: 10 - Maximum number of connections in pool
- **minPoolSize**: 2 - Minimum connections to maintain
- **maxIdleTimeMS**: 45000 - Connection timeout (45 seconds)
- **retryWrites**: true - Automatic retry for failed writes
- **journal**: true - Journaled writes for data durability

## Running the Stack

### Start Services
```bash
docker compose up -d
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f milpac-generator
docker compose logs -f mongodb
docker compose logs -f redis
```

### Health Status
```bash
docker compose ps
```

Wait for all services to show healthy status before making requests.

### Stop Services
```bash
docker compose down
```

### Full Cleanup (remove volumes)
```bash
docker compose down -v
```

## Volume Mounts

### milpac-generator
- `/app/milpac` - Generated MILPAC images
- `/app/logs` - Application logs

### mongodb_data
- MongoDB database files

### mongodb_config
- MongoDB configuration snapshots

### redis_data
- Redis persistence file

## Network

All services connect via `milpac-network` bridge network. Services can reference each other by container name:
- `mongodb:27017`
- `redis:6379`
- `milpac-generator:3000`

## Health Checks

Services include health checks:

**MongoDB**: mongosh admin command
**Redis**: redis-cli ping
**MILPAC Generator**: HTTP health endpoint

Health check failure will mark the service as unhealthy in `docker compose ps`.

## Performance Optimizations

### Connection Pooling
MongoDB connections are pooled (min: 2, max: 10) to optimize resource usage and throughput.

### Query Caching
The application implements a 5-minute TTL query cache for frequently accessed member data.

### Memory Management
Redis uses LRU eviction with 512MB memory limit to prevent unbounded growth.

## Troubleshooting

### MongoDB Connection Issues
```bash
# Test connection
docker compose exec mongodb mongosh --eval "db.adminCommand('ping')"
```

### Redis Connection Issues
```bash
# Test connection
docker compose exec redis redis-cli ping
```

### Generator Service Issues
```bash
# Check logs
docker compose logs milpac-generator

# Rebuild container
docker compose build milpac-generator
docker compose up -d milpac-generator
```

### Port Conflicts
If ports are in use, modify in docker-compose.yml or set via environment:
```bash
MONGODB_PORT=27018 REDIS_PORT=6380 GENERATOR_PORT=3001 docker compose up -d
```

## Production Deployment

For production, consider:

1. **Security**:
   - Change all default passwords in `.env`
   - Enable network encryption
   - Use environment-specific secrets management

2. **Scaling**:
   - Increase MongoDB connection pool if needed
   - Consider multiple generator instances with load balancing
   - Scale Redis if queue backlog grows

3. **Monitoring**:
   - Enable Docker logging driver configuration
   - Set up alerts for service health checks
   - Monitor connection pool utilization

4. **Backups**:
   - Regular MongoDB backup procedures
   - Redis persistence (AOF already enabled)
   - Volume snapshots
