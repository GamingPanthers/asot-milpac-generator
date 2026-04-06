# Logs API Documentation

The MILPAC Generator now provides API endpoints for retrieving application logs remotely. All logs endpoints require authorization using your webhook API key.

## Endpoints

### GET `/logs` - Retrieve Application Logs (JSON)

Returns application logs in JSON format with optional filtering and pagination.

**Authorization**: Required (Bearer token)

**Query Parameters**:
- `type` (string): Log file type - `'error'` or `'combined'` (default: `'combined'`)
- `level` (string, optional): Filter by log level - `'error'`, `'warn'`, `'info'`, `'debug'`
- `limit` (number, optional): Number of logs to return (default: 100, max: 10,000)
- `search` (string, optional): Search logs by message or metadata
- `format` (string, optional): Response format - `'json'` or `'text'` (default: `'json'`)

**Example Request**:
```bash
curl -H "Authorization: Bearer YOUR_WEBHOOK_API_KEY" \
  "http://localhost:3000/logs?type=combined&level=error&limit=50"
```

**Response**:
```json
{
  "status": "success",
  "message": "Retrieved 50 combined logs",
  "data": {
    "entries": [
      {
        "timestamp": "2026-04-06 14:30:45",
        "level": "error",
        "message": "Failed to generate image",
        "metadata": {
          "memberID": "123abc",
          "error": "File not found"
        }
      }
    ],
    "total": 150,
    "returned": 50,
    "type": "combined",
    "level": "error",
    "hasMore": true
  }
}
```

---

### GET `/logs/text` - Retrieve Application Logs (Plaintext)

Returns application logs in plaintext format, suitable for streaming or log aggregation tools.

**Authorization**: Required (Bearer token)

**Query Parameters**: (same as `/logs`)

**Example Request**:
```bash
curl -H "Authorization: Bearer YOUR_WEBHOOK_API_KEY" \
  "http://localhost:3000/logs/text?type=combined&limit=100" > logs.txt
```

**Response**:
```
2026-04-06 14:30:45 [ERROR]: Failed to generate image {"memberID":"123abc","error":"File not found"}
2026-04-06 14:30:44 [WARN]: Slow query detected {"duration":152,"threshold":100}
2026-04-06 14:30:43 [INFO]: Generation job completed {"memberID":"123abc","time":2500}
```

---

### GET `/logs/stats` - Get Log File Statistics

Returns information about log files including size, line count, and last modification time.

**Authorization**: Required (Bearer token)

**Example Request**:
```bash
curl -H "Authorization: Bearer YOUR_WEBHOOK_API_KEY" \
  "http://localhost:3000/logs/stats"
```

**Response**:
```json
{
  "status": "success",
  "message": "Log statistics retrieved",
  "data": {
    "combined": {
      "exists": true,
      "size": 1048576,
      "lines": 5000,
      "lastModified": "2026-04-06T14:35:22.000Z"
    },
    "error": {
      "exists": true,
      "size": 262144,
      "lines": 250,
      "lastModified": "2026-04-06T14:35:15.000Z"
    }
  }
}
```

---

## Usage Examples

### Retrieve Recent Error Logs
```bash
curl -H "Authorization: Bearer YOUR_WEBHOOK_API_KEY" \
  "http://localhost:3000/logs?type=error&limit=20"
```

### Search for Specific Member Logs
```bash
curl -H "Authorization: Bearer YOUR_WEBHOOK_API_KEY" \
  "http://localhost:3000/logs?search=memberID&limit=50"
```

### Get Only Warning and Error Logs
```bash
# Error logs
curl -H "Authorization: Bearer YOUR_WEBHOOK_API_KEY" \
  "http://localhost:3000/logs?level=error"

# Warning logs
curl -H "Authorization: Bearer YOUR_WEBHOOK_API_KEY" \
  "http://localhost:3000/logs?level=warn"
```

### Export Logs as Plaintext
```bash
curl -H "Authorization: Bearer YOUR_WEBHOOK_API_KEY" \
  "http://localhost:3000/logs/text?type=combined&limit=1000" > export.log
```

### Monitor Logs in Real-time (tail-like behavior)
```bash
while true; do
  curl -H "Authorization: Bearer YOUR_WEBHOOK_API_KEY" \
    "http://localhost:3000/logs?limit=10&type=combined" | jq '.data.entries[-1]'
  sleep 5
done
```

---

## Log Files

The application maintains two log files:

### `logs/combined.log`
- **Purpose**: All log messages (info, warn, error, debug)
- **Max Size**: 5MB per file, up to 10 files retained
- **Usage**: General monitoring and debugging

### `logs/error.log`
- **Purpose**: Error messages only
- **Max Size**: 5MB per file, up to 5 files retained
- **Usage**: Critical issues and failures

---

## Log Levels

Logs are categorized by level:
- **error**: Critical errors that require attention
- **warn**: Warning messages about potential issues
- **info**: Informational messages about normal operations
- **debug**: Detailed debugging information

---

## Integration with Web Frontend

The website can pull logs by making authenticated requests:

```javascript
// Example: Fetch recent error logs
async function getErrorLogs() {
  const response = await fetch('/api/logs?type=error&limit=100', {
    headers: {
      'Authorization': `Bearer ${WEBHOOK_API_KEY}`
    }
  });
  return response.json();
}

// Example: Monitor generation errors
async function monitorGenerationErrors() {
  const response = await fetch('/api/logs?search=generation&level=error&limit=50', {
    headers: {
      'Authorization': `Bearer ${WEBHOOK_API_KEY}`
    }
  });
  const data = await response.json();
  console.log(`Found ${data.data.returned} generation errors`);
  return data.data.entries;
}
```

---

## Performance Considerations

- **Large log requests**: Retrieving many logs (limit > 1000) may take a few seconds
- **Search performance**: Searching through large log files is slower than filtering by level
- **Plaintext format**: More efficient than JSON for large exports
- **Log rotation**: Automatically handled; old logs are archived when files reach 5MB

---

## Security

- All log endpoints require authorization with your WEBHOOK_API_KEY
- Logs may contain sensitive information; protect your API key
- Consider restricting log endpoint access to authorized admin users only
- Logs are stored locally; implement backup and retention policies as needed
