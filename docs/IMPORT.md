# Database Migration Guide

This guide explains how to import data from previous SMM panel installations into the new SMM Panel system.

## Overview

The database migration feature supports importing data from:
- External databases (MySQL, PostgreSQL)
- SQL dumps
- JSON exports
- API endpoints from old panels

## Migration Methods

### Method A: External Database Connection

Connect directly to an external database and import data.

**Steps:**

1. Navigate to Admin → Settings → Database Import
2. Select "External Database Connection"
3. Fill in connection details:
   ```
   Host: db.oldpanel.com
   Port: 3306
   Database: smm_panel_old
   Username: import_user
   Password: ********
   Table Prefix: smm_ (optional)
   ```
4. Click "Test Connection"
5. Select tables to import:
   - [ ] Users
   - [ ] Services
   - [ ] Orders
   - [ ] Payments
   - [ ] Tickets
6. Map fields (automatic detection available)
7. Configure duplicate handling
8. Start import

**Security Notes:**
- Database credentials are never stored
- Connection is closed immediately after import
- All queries are read-only
- Import runs in isolated worker process

**Example Implementation:**

```typescript
// src/lib/import/database-importer.ts
import mysql from 'mysql2/promise'

export async function connectToExternalDB(config: {
  host: string
  port: number
  database: string
  username: string
  password: string
}) {
  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.username,
    password: config.password,
  })

  return connection
}

export async function importUsersFromDB(
  connection: mysql.Connection,
  mapping: FieldMapping
) {
  const [rows] = await connection.query('SELECT * FROM users')
  
  for (const row of rows) {
    const user = mapFields(row, mapping)
    
    // Handle duplicates
    const existing = await prisma.user.findUnique({
      where: { email: user.email }
    })
    
    if (existing) {
      // Skip, merge, or create new based on config
      continue
    }
    
    await prisma.user.create({ data: user })
  }
}
```

### Method B: SQL Dump Upload

Upload and parse SQL dump files.

**Supported Formats:**
- MySQL dumps (.sql)
- PostgreSQL dumps (.sql)
- Compressed files (.sql.gz, .sql.zip)

**Steps:**

1. Navigate to Admin → Settings → Database Import
2. Select "Upload SQL Dump"
3. Upload your .sql file (max 100MB)
4. System parses the file and detects schema
5. Select which tables to import
6. Map fields to new schema
7. Preview import (first 100 rows)
8. Execute import

**Example:**

```typescript
// src/lib/import/sql-parser.ts
import fs from 'fs'
import readline from 'readline'

export async function parseSQLDump(filePath: string) {
  const tables: Map<string, any[]> = new Map()
  
  const fileStream = fs.createReadStream(filePath)
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })

  let currentTable = ''
  let insertBuffer: string[] = []

  for await (const line of rl) {
    if (line.startsWith('CREATE TABLE')) {
      currentTable = extractTableName(line)
    } else if (line.startsWith('INSERT INTO')) {
      insertBuffer.push(line)
    }
  }

  // Parse INSERT statements and return structured data
  return tables
}
```

### Method C: JSON Export Upload

Upload JSON exports from previous panels.

**Format:**

```json
{
  "users": [
    {
      "id": 1,
      "username": "user1",
      "email": "user@example.com",
      "balance": 100.50
    }
  ],
  "services": [...],
  "orders": [...]
}
```

**Steps:**

1. Export data from old panel as JSON
2. Navigate to Admin → Settings → Database Import
3. Select "Upload JSON"
4. Upload JSON file
5. System auto-detects structure
6. Map fields
7. Import

### Method D: API Import

Import from old panel API endpoint.

**Steps:**

1. Navigate to Admin → Settings → Database Import
2. Select "API Import"
3. Enter API endpoint: `https://oldpanel.com/api/export`
4. Add authentication headers
5. System fetches data
6. Map fields
7. Import

**Example API Response:**

```json
{
  "users": [...],
  "services": [...],
  "orders": [...]
}
```

## Field Mapping

The system provides an intuitive field mapping UI:

### Automatic Detection

The system attempts to auto-map fields based on:
- Field names (exact match)
- Field types
- Common patterns (email, username, etc.)

### Manual Mapping

For unmapped fields, manually select target field:

```
Old Field          →  New Field
-----------------------------------------
user_name          →  username
email_address      →  email  
wallet_balance     →  walletBalance
created_date       →  createdAt
```

### Data Transformation

Apply transformations during import:

- **Password Hashing**: Old password hashes are rehashed with bcrypt
- **Date Format**: Convert dates to ISO format
- **Currency**: Convert amounts to USD base
- **Enum Values**: Map status values (e.g., "1" → "ACTIVE")

## Duplicate Handling

Choose how to handle duplicates:

### Skip
Skip importing records that already exist (based on email/username).

### Merge
Update existing records with new data from import.

### Create New
Create new records with different IDs (add suffix to username).

### Example:

```typescript
async function handleDuplicate(
  existing: User,
  imported: User,
  strategy: 'skip' | 'merge' | 'create'
) {
  switch (strategy) {
    case 'skip':
      return null
    
    case 'merge':
      return await prisma.user.update({
        where: { id: existing.id },
        data: {
          ...imported,
          id: existing.id, // Keep original ID
        }
      })
    
    case 'create':
      return await prisma.user.create({
        data: {
          ...imported,
          username: `${imported.username}_imported`,
        }
      })
  }
}
```

## Background Processing

Large imports run asynchronously:

1. Import job created and queued
2. Worker processes in batches (1000 records at a time)
3. Progress tracked in real-time
4. Email notification on completion
5. Import log saved with results

**Example:**

```typescript
// src/workers/import-worker.ts
import { Job } from 'bullmq'

export async function processImportJob(job: Job) {
  const { importLogId, data, mapping } = job.data
  
  await prisma.importLog.update({
    where: { id: importLogId },
    data: { status: 'PROCESSING' }
  })

  let imported = 0
  let failed = 0

  for (const record of data) {
    try {
      await importRecord(record, mapping)
      imported++
      
      // Update progress
      await job.updateProgress((imported / data.length) * 100)
    } catch (error) {
      failed++
    }
  }

  await prisma.importLog.update({
    where: { id: importLogId },
    data: {
      status: 'COMPLETED',
      rowsImported: imported,
      rowsFailed: failed,
      completedAt: new Date()
    }
  })
}
```

## Rollback

Imports can be rolled back if issues occur:

1. Navigate to Admin → Import Logs
2. Find the import
3. Click "Rollback"
4. Confirm rollback
5. System deletes all imported records

**Note**: Only recent imports can be rolled back (within 24 hours).

## Import Logs

All imports are logged with:
- Timestamp
- Source (DB, File, API)
- Tables imported
- Rows imported/failed
- Errors
- Duration

View logs at Admin → Import Logs.

## Best Practices

1. **Backup First**: Always backup your current database before importing
2. **Test Import**: Use a small subset first to test mapping
3. **Check Duplicates**: Review duplicate handling strategy
4. **Monitor Progress**: Watch import progress for errors
5. **Verify Data**: Spot-check imported data after completion
6. **Clean Up**: Remove old data after successful migration

## Common Issues

### Issue: Connection Timeout
**Solution**: Increase timeout in .env: `IMPORT_TIMEOUT=300000`

### Issue: Out of Memory
**Solution**: Reduce batch size: `IMPORT_CHUNK_SIZE=500`

### Issue: Encoding Problems
**Solution**: Specify charset in connection: `charset=utf8mb4`

### Issue: Foreign Key Errors
**Solution**: Import in correct order (users → services → orders)

## Security Considerations

- Never store database credentials
- Sanitize all imported data
- Rehash password hashes
- Validate all fields before import
- Run in sandboxed environment
- Log all operations
- Implement rate limiting
- Require admin authentication

## Migration Checklist

- [ ] Backup current database
- [ ] Export data from old panel
- [ ] Choose import method
- [ ] Configure field mapping
- [ ] Set duplicate handling
- [ ] Start test import (small batch)
- [ ] Verify test data
- [ ] Start full import
- [ ] Monitor progress
- [ ] Verify all data
- [ ] Update user passwords (email reset links)
- [ ] Notify users of migration
- [ ] Clean up old system
- [ ] Update DNS/domains

## Support

For help with migration:
- Email: support@smmpanel.com
- Documentation: /docs/import
- Video Tutorial: /videos/migration
