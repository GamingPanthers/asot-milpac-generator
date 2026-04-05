# 📡 ASOT Milpac Generator - API Reference

## 🔗 Endpoints Overview

| Method | Endpoint | Auth Required | Purpose |
|--------|----------|---------------|---------|
| `POST` | `/webhook` | ✅ Yes | Submit member data for uniform generation |
| `GET` | `/status/:jobId` | ❌ No | Check generation job status |
| `GET` | `/queue/stats` | ✅ Yes | View job queue statistics |
| `GET` | `/health` | ❌ No | Health check & dependency status |

---

## 📮 POST /webhook

### Purpose
Receive member data changes and queue uniform generation jobs.

### Request

**URL:**
```
POST /webhook
```

**Headers (Required):**
```
Authorization: Bearer {WEBHOOK_API_KEY}
Content-Type: application/json
```

**Response Time:** ~30-50ms

**Body Schema:**
```typescript
{
  event: "member.updated" | "certificate.requested",
  member: {
    name: string,              // Member's display name
    memberID: string,          // Unique member identifier
    discordID: string,         // Discord user ID
    changeFields?: string[],   // Optional: fields that changed
    data: {
      rank?: string,           // Military rank (e.g., "SGT", "CPT")
      Uniform?: string,        // Uniform type (e.g., "Blue", "Brown")
      badge?: string,          // Corps badge (e.g., "Infantry")
      medallions?: string[],   // Medal IDs (e.g., ["Bronze1", "Silver2"])
      citations?: string[],    // Ribbon IDs (e.g., ["campaign"])
      TrainingMedals?: string[], // Training badge IDs
      RifleManBadge?: string,  // Marksmanship qualification
      [key: string]: any       // Other fields (ignored for generation)
    }
  }
}
```

### Response Codes

#### 200 OK - Queued
```json
{
  "status": "queued",
  "message": "Image generation queued for MemberID 12345",
  "code": 200,
  "data": {
    "jobId": "job_550e8400-e29b-41d4-a716-446655440000",
    "memberID": "12345",
    "queued": true
  }
}
```

#### 200 OK - Skipped (No Changes)
```json
{
  "status": "skipped",
  "message": "No relevant field changes detected. Image generation skipped.",
  "code": 200,
  "data": {
    "memberID": "12345",
    "reason": "No visual changes"
  }
}
```

#### 400 Bad Request - Invalid Payload
```json
{
  "status": "error",
  "message": "Invalid webhook payload",
  "code": 400,
  "error": "Missing required member fields: name, memberID, discordID, data"
}
```

#### 401 Unauthorized
```json
{
  "status": "error",
  "message": "Unauthorized",
  "code": 401,
  "error": "Invalid or missing authorization header"
}
```

#### 500 Internal Server Error
```json
{
  "status": "error",
  "message": "Internal server error",
  "code": 500,
  "error": "Database connection failed"
}
```

### Examples

#### Example 1: Basic Promotion

**Request:**
```bash
curl -X POST http://localhost:42070/webhook \
  -H "Authorization: Bearer my-api-key-12345" \
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
        "citations": [],
        "TrainingMedals": [],
        "RifleManBadge": ""
      }
    }
  }'
```

**Response:**
```bash
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "queued",
  "message": "Image generation queued for MemberID 12345",
  "code": 200,
  "data": {
    "jobId": "job_3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "memberID": "12345",
    "queued": true
  }
}
```

#### Example 2: Award with Multiple Changes

**Request:**
```bash
curl -X POST http://localhost:42070/webhook \
  -H "Authorization: Bearer my-api-key-12345" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "member.updated",
    "member": {
      "name": "Jane Doe",
      "memberID": "54321",
      "discordID": "123456789",
      "changeFields": ["medallions", "citations"],
      "data": {
        "rank": "LT",
        "Uniform": "Brown",
        "badge": "Armor",
        "medallions": ["Bronze1", "Silver1"],
        "citations": ["campaign", "gallantry"],
        "TrainingMedals": ["ExpR", "CQB"],
        "RifleManBadge": "CPT"
      }
    }
  }'
```

**Response:**
```json
{
  "status": "queued",
  "message": "Image generation queued for MemberID 54321",
  "data": {
    "jobId": "job_8d5f3c2b-1a9e-47d2-9876-543210fedcba",
    "memberID": "54321",
    "queued": true
  }
}
```

#### Example 3: No Relevant Changes (Skipped)

**Request:**
```bash
curl -X POST http://localhost:42070/webhook \
  -H "Authorization: Bearer my-api-key-12345" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "member.updated",
    "member": {
      "name": "John Smith",
      "memberID": "12345",
      "discordID": "987654321",
      "changeFields": ["discordID"],
      "data": {
        "rank": "SGT",
        "Uniform": "Blue",
        "badge": "Infantry"
      }
    }
  }'
```

**Response:**
```json
{
  "status": "skipped",
  "message": "No relevant field changes detected. Image generation skipped.",
  "code": 200,
  "data": {
    "memberID": "12345",
    "reason": "No visual changes"
  }
}
```

#### Example 4: Error - Missing Authorization

**Request:**
```bash
curl -X POST http://localhost:42070/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "member.updated",
    "member": {"name": "John", "memberID": "123", ...}
  }'
```

**Response:**
```json
{
  "status": "error",
  "message": "Unauthorized",
  "code": 401,
  "error": "Invalid or missing authorization header"
}
```

### Trigger Fields

The following fields trigger image regeneration:
- `rank` — Military rank changes (PTE → SGT → CPT, etc.)
- `Uniform` — Uniform type/color (Blue ↔ Brown)
- `badge` — Corps affiliation
- `medallions` — Medal awards/removals
- `citations` — Service ribbon changes
- `TrainingMedals` — Training qualification badges
- `RifleManBadge` — Marksmanship badge

Fields that **do NOT** trigger regeneration:
- `name` — Name changes don't affect visual uniform
- `discordID` — Discord ID is not displayed
- `memberID` — ID changes don't affect uniform design
- Any other non-visual fields

---

## 📊 GET /status/:jobId

### Purpose
Check the current status of a uniform generation job.

### Request

**URL:**
```
GET /status/job_550e8400-e29b-41d4-a716-446655440000
```

**Headers:** None required

**Response Time:** ~5-10ms

### Response Codes

#### 200 OK - Job Found

**In Progress:**
```json
{
  "status": "success",
  "message": "Job status retrieved",
  "code": 200,
  "data": {
    "jobId": "job_550e8400-e29b-41d4-a716-446655440000",
    "status": "active",
    "memberID": "12345",
    "imageUrl": null
  }
}
```

**Completed (Ready to Display):**
```json
{
  "status": "success",
  "message": "Job status retrieved",
  "code": 200,
  "data": {
    "jobId": "job_550e8400-e29b-41d4-a716-446655440000",
    "status": "completed",
    "memberID": "12345",
    "imageUrl": "http://localhost:42070/milpac/uniform/12345.png"
  }
}
```

**Failed (Permanent Error):**
```json
{
  "status": "success",
  "message": "Job status retrieved",
  "code": 200,
  "data": {
    "jobId": "job_550e8400-e29b-41d4-a716-446655440000",
    "status": "failed",
    "memberID": "12345",
    "error": "Asset not found: milpac_ranks with ID 'INVALID_RANK'"
  }
}
```

**Delayed (Retrying):**
```json
{
  "status": "success",
  "message": "Job status retrieved",
  "code": 200,
  "data": {
    "jobId": "job_550e8400-e29b-41d4-a716-446655440000",
    "status": "delayed",
    "memberID": "12345",
    "imageUrl": null,
    "retryAttempt": 2,
    "maxRetries": 5
  }
}
```

#### 404 Not Found
```json
{
  "status": "error",
  "message": "Job not found",
  "code": 404
}
```

### Examples

#### Example 1: Check In-Progress Job

**Request:**
```bash
curl http://localhost:42070/status/job_3fa85f64-5717-4562-b3fc-2c963f66afa6
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "jobId": "job_3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "active",
    "memberID": "12345"
  }
}
```

**Interpretation:** Job is currently being processed. Check again in a few seconds.

#### Example 2: Check Completed Job

**Request:**
```bash
curl http://localhost:42070/status/job_3fa85f64-5717-4562-b3fc-2c963f66afa6
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "jobId": "job_3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "completed",
    "memberID": "12345",
    "imageUrl": "http://localhost:42070/milpac/uniform/12345.png"
  }
}
```

**Interpretation:** Image is ready! Display it at the `imageUrl`.

#### Example 3: Check Failed Job

**Request:**
```bash
curl http://localhost:42070/status/job_3fa85f64-5717-4562-b3fc-2c963f66afa6
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "jobId": "job_3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "failed",
    "memberID": "12345",
    "error": "Asset not found: milpac_ranks with ID 'INVALID_RANK'"
  }
}
```

**Interpretation:** Generation failed permanently. Investigate the error (likely bad data in MongoDB).

### Possible Job States

| State | Description | Retry? | Action |
|-------|-------------|--------|--------|
| `waiting` | Queued, not yet started | N/A | Wait for available worker |
| `active` | Currently processing | N/A | Wait for completion |
| `completed` | Successfully generated | N/A | Image URL available, display it |
| `failed` | Error, no more retries | ❌ No | Check error message, fix data |
| `delayed` | Retrying after failure | ✅ Yes | Wait, auto-retry in progress |

---

## 📈 GET /queue/stats

### Purpose
View job queue statistics and system health metrics.

### Request

**URL:**
```
GET /queue/stats
```

**Headers (Required):**
```
Authorization: Bearer {WEBHOOK_API_KEY}
```

**Response Time:** ~10-20ms

### Response

**200 OK:**
```json
{
  "status": "success",
  "message": "Queue stats retrieved",
  "code": 200,
  "data": {
    "waiting": 5,
    "active": 2,
    "completed": 1250,
    "failed": 3,
    "delayed": 1,
    "paused": 0,
    "totalJobs": 1261
  }
}
```

**401 Unauthorized:**
```json
{
  "status": "error",
  "message": "Unauthorized",
  "code": 401,
  "error": "Invalid or missing authorization header"
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `waiting` | number | Jobs queued but not yet started |
| `active` | number | Jobs currently being processed |
| `completed` | number | Successfully completed jobs (lifetime) |
| `failed` | number | Failed jobs (lifetime) |
| `delayed` | number | Jobs currently delayed/retrying |
| `paused` | number | Paused jobs (usually 0) |
| `totalJobs` | number | Sum of above (active metrics only) |

### Examples

#### Example 1: Healthy Queue
```bash
curl -X GET http://localhost:42070/queue/stats \
  -H "Authorization: Bearer my-api-key-12345"
```

**Response:**
```json
{
  "data": {
    "waiting": 0,
    "active": 0,
    "completed": 1000,
    "failed": 0,
    "delayed": 0,
    "totalJobs": 0
  }
}
```

**Interpretation:** System is idle, all previous jobs completed successfully.

#### Example 2: Active Load
```bash
curl -X GET http://localhost:42070/queue/stats \
  -H "Authorization: Bearer my-api-key-12345"
```

**Response:**
```json
{
  "data": {
    "waiting": 12,
    "active": 5,
    "completed": 2500,
    "failed": 2,
    "delayed": 0,
    "totalJobs": 17
  }
}
```

**Interpretation:** System is processing 5 jobs, 12 waiting in queue. Good throughput.

#### Example 3: High Failure Rate (Alert)
```bash
curl -X GET http://localhost:42070/queue/stats \
  -H "Authorization: Bearer my-api-key-12345"
```

**Response:**
```json
{
  "data": {
    "waiting": 25,
    "active": 3,
    "completed": 500,
    "failed": 47,
    "delayed": 8,
    "totalJobs": 36
  }
}
```

**Interpretation:** High failure count (47). Investigate error logs for pattern.

---

## 🏥 GET /health

### Purpose
Health check endpoint for monitoring and load balancer probes.

### Request

**URL:**
```
GET /health
```

**Headers:** None required

**Response Time:** ~20-50ms (includes dependency checks)

### Response

**200 OK - All Healthy:**
```json
{
  "status": "success",
  "message": "Server is running",
  "timestamp": "2026-04-06T10:30:45.123Z",
  "dependencies": {
    "mongodb": "healthy",
    "redis": "healthy"
  }
}
```

**200 OK - Degraded (MongoDB Down):**
```json
{
  "status": "success",
  "message": "Server is running",
  "timestamp": "2026-04-06T10:30:45.123Z",
  "dependencies": {
    "mongodb": "unhealthy",
    "redis": "healthy"
  }
}
```

**200 OK - Degraded (Not Initialized):**
```json
{
  "status": "success",
  "message": "Server is running",
  "timestamp": "2026-04-06T10:30:45.123Z",
  "dependencies": {
    "mongodb": "not initialized",
    "redis": "healthy"
  }
}
```

### Dependency Status Values

| Status | Meaning |
|--------|---------|
| `healthy` | Connection OK, responding |
| `unhealthy` | Connection attempt failed |
| `not initialized` | Service not yet initialized |
| `unknown` | Unable to determine status |

### Examples

#### Example 1: Kubernetes Liveness Probe

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 42070
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

#### Example 2: Load Balancer Health Check

```bash
# Nginx upstream health check
upstream milpac_generator {
  server localhost:42070;
  check interval=3000 rise=2 fall=5 timeout=1000 type=http;
  check_http_send "GET /health HTTP/1.0\r\n\r\n";
  check_http_expect_alive http_2xx;
}
```

#### Example 3: Monitoring Script

```bash
#!/bin/bash
# Check health every 30 seconds

while true; do
  response=$(curl -s http://localhost:42070/health)
  mongodb=$(echo $response | jq '.dependencies.mongodb')
  redis=$(echo $response | jq '.dependencies.redis')
  
  if [[ "$mongodb" != "\"healthy\"" ]]; then
    echo "WARNING: MongoDB is $mongodb"
    # Send alert
  fi
  
  if [[ "$redis" != "\"healthy\"" ]]; then
    echo "WARNING: Redis is $redis"
    # Send alert
  fi
  
  sleep 30
done
```

---

## 🔑 Authentication

### API Key Format

```
Authorization: Bearer {WEBHOOK_API_KEY}
```

**Example:**
```bash
curl -H "Authorization: Bearer my-secret-key-abc123" \
  http://localhost:42070/webhook
```

### Obtaining Your API Key

The API key is set via the `WEBHOOK_API_KEY` environment variable:

```bash
# View your API key
grep WEBHOOK_API_KEY .env

# Generate a new strong API key
openssl rand -hex 32
# Output: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1

# Update .env
echo "WEBHOOK_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1" >> .env

# Restart server to apply changes
npm run dev
```

### Security Notes

✅ **Do:**
- Keep API key secret
- Rotate keys regularly
- Use strong, random keys (32+ characters)
- Store in secure vault or environment variables
- Use HTTPS in production

❌ **Don't:**
- Commit keys to Git
- Share keys in logs
- Use guessable keys
- Use same key across environments
- Log or expose in responses

---

## 🎯 Common Integration Patterns

### Pattern 1: Fire & Forget

Web service sends webhook, doesn't wait for response:

```javascript
// asot-milpac-web: Send update
async function notifyUniformGenerator(memberData) {
  try {
    await fetch('http://generator.api/webhook', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WEBHOOK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: 'member.updated',
        member: memberData
      })
    });
    // Don't wait for actual generation
    // Generator will handle asynchronously
  } catch (error) {
    logger.error('Failed to queue generation', error);
  }
}
```

### Pattern 2: Check Status Loop

Web service polls for job completion:

```javascript
// asot-milpac-web: Poll until ready
async function waitForUniformGeneration(jobId, maxWaitMs = 30000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    const response = await fetch(`http://generator.api/status/${jobId}`);
    const data = await response.json();
    
    if (data.data.status === 'completed') {
      return data.data.imageUrl; // Ready!
    }
    
    if (data.data.status === 'failed') {
      throw new Error(data.data.error);
    }
    
    // Still processing, wait 1 second and try again
    await new Promise(r => setTimeout(r, 1000));
  }
  
  throw new Error('Generation timeout');
}
```

### Pattern 3: Webhook Callback

Generator notifies web service when complete:

```javascript
// asot-milpac-generator: Send callback (optional)
// After generation completes, call web service webhook:

POST http://web.api/webhooks/image-ready
{
  "event": "image.generated",
  "memberID": "12345",
  "imageUrl": "http://generator.api/milpac/uniform/12345.png",
  "jobId": "job_xxxxx"
}
```

### Pattern 4: Real-time Updates (WebSocket)

Web service maintains WebSocket connection:

```javascript
// asot-milpac-web: Subscribe to updates
const socket = new WebSocket('ws://generator.api/updates');

socket.addEventListener('message', (event) => {
  const update = JSON.parse(event.data);
  
  if (update.type === 'image.generated') {
    // Update UI immediately
    document.getElementById(`avatar-${update.memberID}`)
      .src = update.imageUrl;
  }
});
```

---

## 📊 Rate Limiting & Throughput

### Recommended Limits

```
Webhook Rate:
- Per API key: 100 requests/second
- Per member: 10 requests/minute (prevent spam)
- Total queue: 10,000 jobs max

Response Times (P95):
- Webhook submission: 50ms
- Status check: 10ms
- Queue stats: 20ms
- Health check: 40ms

Image Generation Time:
- Average: 500-1000ms
- P95: 1500ms
- P99: 2000ms
```

### Monitoring Tips

```bash
# Monitor incoming webhook rate
tail -f logs/milpac.log | grep "POST /webhook"

# Monitor queue depth
watch -n 5 'curl -s http://localhost:42070/queue/stats \
  -H "Authorization: Bearer KEY" | jq .data.waiting'

# Monitor success rate
tail -f logs/milpac.log | grep -c "status.*completed"
tail -f logs/milpac.log | grep -c "status.*failed"
```

---

## 🚨 Error Reference

### HTTP Status Codes

| Code | Meaning | Common Cause |
|------|---------|--------------|
| 200 | OK | Request processed successfully |
| 400 | Bad Request | Invalid payload, schema mismatch |
| 401 | Unauthorized | Missing/invalid API key |
| 404 | Not Found | Job ID doesn't exist |
| 500 | Server Error | Database/service failure |

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| Invalid authorization header | Missing/wrong API key | Verify `WEBHOOK_API_KEY` |
| Missing required member fields | Incomplete payload | Include all required fields |
| Asset not found: milpac_ranks with ID 'XXX' | Rank doesn't exist in MongoDB | Add rank to milpac_ranks collection |
| Database connection failed | MongoDB unreachable | Check MONGO_URL, start MongoDB |
| Job not found | Job ID is invalid/expired | Verify jobId format |

---

## 📚 Related Documentation

- [PROJECT.md](PROJECT.md) — Complete project guide
- [ARCHITECTURE.md](ARCHITECTURE.md) — System design & patterns
- [SETUP.md](SETUP.md) — Installation & deployment
- [CONFIGURATION.md](CONFIGURATION.md) — Environment variables
- [DATABASE_ID_NAMES.md](DATABASE_ID_NAMES.md) — MongoDB collections

---

**Last Updated:** April 2026  
**API Version:** 1.0.0  
**Status:** Production Ready ✅
