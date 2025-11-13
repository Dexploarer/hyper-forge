# User API Keys Documentation

## Overview

Asset-Forge supports user-provided API keys for AI services, allowing users to bring their own keys for 3D generation, AI content creation, and voice/music generation. This system provides users with greater control over their API usage, cost transparency, and eliminates rate limiting from shared keys.

### Benefits

- **User Control**: Users manage their own API keys and usage
- **Cost Transparency**: Direct billing from service providers to users
- **No Rate Limits**: No shared key throttling across multiple users
- **Flexibility**: Optional keys with environment variable fallbacks
- **Security**: Military-grade AES-256-GCM encryption for all stored keys

### Supported Services

1. **Meshy AI** - 3D model generation from text and images
2. **Vercel AI Gateway** - AI content generation (OpenAI, Anthropic, etc.)
3. **ElevenLabs** - Voice synthesis and music generation

---

## For End Users

### Getting Your API Keys

#### Meshy AI
1. Visit https://www.meshy.ai/
2. Sign up or log in to your account
3. Navigate to **Settings** → **API Keys**
4. Click **Create API Key**
5. Copy your API key (keep it secure)
6. **Required for**: 3D model generation features

#### Vercel AI Gateway
1. Visit https://vercel.com/docs/workflow-collaboration/vercel-ai-gateway
2. Log in to your Vercel account
3. Navigate to your project settings
4. Find **AI Gateway** section
5. Create a new gateway and copy the API key
6. **Required for**: AI-powered content generation (descriptions, names, etc.)

#### ElevenLabs
1. Visit https://elevenlabs.io/
2. Sign up or log in to your account
3. Go to **Profile** → **API Keys**
4. Generate a new API key
5. Copy your API key (keep it secure)
6. **Optional**: Only needed if you want voice/music generation features

### Configuring Keys in Asset-Forge

1. Log in to Asset-Forge
2. Navigate to **Settings** → **API Keys** tab
3. Enter your API keys for the services you want to use:
   - Paste Meshy API key in the **Meshy AI** field
   - Paste Vercel AI Gateway key in the **AI Gateway** field
   - Paste ElevenLabs key in the **ElevenLabs** field (optional)
4. Click **Save API Keys**
5. Your keys are now encrypted and securely stored

**Note**: You only need to configure the keys for services you plan to use. If a service is not configured, some features may be unavailable or fall back to system defaults (if configured by the administrator).

### Required vs Optional Keys

| Service | Required? | Used For |
|---------|-----------|----------|
| **Meshy AI** | Yes (for 3D generation) | Text-to-3D, Image-to-3D model generation |
| **Vercel AI Gateway** | Yes (for AI features) | AI content generation, descriptions, naming |
| **ElevenLabs** | Optional | Voice synthesis, music generation |

### Security Assurance

Your API keys are protected with industry-standard security measures:

- **AES-256-GCM Encryption**: Military-grade authenticated encryption
- **Unique Initialization Vectors**: Random IV for each user ensures security
- **Never Exposed**: Keys are never returned in plaintext by any API endpoint
- **Secure Storage**: Encrypted in the database, never logged or exposed in server logs
- **Transport Security**: All API requests use HTTPS encryption

**Your API keys are safe**. Only you can use them, and they're never visible to administrators or other users.

### Deleting Your Keys

If you need to remove your API keys:

1. Go to **Settings** → **API Keys**
2. Click **Delete All Keys** button
3. Confirm deletion
4. Your keys are permanently removed from the database

You can reconfigure new keys at any time.

---

## For Developers/Deployers

### Required Environment Variables

#### API Key Encryption Secret (Required)

```bash
API_KEY_ENCRYPTION_SECRET=<32+ character secret>
```

**Purpose**: Master encryption key for encrypting/decrypting user API keys

**Requirements**:
- Must be at least 32 characters
- Should be cryptographically random
- Must remain constant (changing it will invalidate all stored keys)
- Required for the application to start

**How to Generate**:
```bash
# Linux/macOS
openssl rand -base64 32

# Or use a password generator
# Example: "8x9K2mP5nQ7rT1vW4yZ6aB3cD5eF8gH2jK4mN6pQ9rS"
```

**Security Notes**:
- Store this in your environment variables (e.g., `.env` file, Railway variables)
- Never commit this to version control
- Treat it like a database password
- If compromised, rotate it and have users re-enter their keys

### Optional Environment Variables (Fallback Keys)

These environment variables are now **optional** and serve as fallbacks when users haven't configured their own keys:

```bash
# Meshy AI (optional fallback)
MESHY_API_KEY=msy_xxxxxxxxxxxxxxxxxxxxx

# Vercel AI Gateway (optional fallback)
AI_GATEWAY_API_KEY=ag_xxxxxxxxxxxxxxxxxxxxx

# ElevenLabs (optional fallback)
ELEVENLABS_API_KEY=el_xxxxxxxxxxxxxxxxxxxxx
```

**Fallback Behavior**:
1. Check if user has configured their own key
2. If yes, use user's key
3. If no, fall back to environment variable
4. If neither exists, return error for required services

**Recommendation**: Configure these as fallbacks for development environments or to provide a seamless experience for new users who haven't set up their keys yet.

### Priority Order

When generating content, the system follows this priority:

```
1. User-provided API key (from database)
   ↓ (if not found)
2. Environment variable API key (fallback)
   ↓ (if not found)
3. Error (for required services) or skip feature (for optional services)
```

**Example**:
```typescript
// User has Meshy key configured → Use user's key
// User has no Meshy key → Use MESHY_API_KEY from environment
// Neither exists → Return error: "Meshy API key not configured"
```

### Deployment Checklist

When deploying Asset-Forge with user API keys:

- [ ] Set `API_KEY_ENCRYPTION_SECRET` (required, 32+ chars)
- [ ] Optionally set fallback keys (`MESHY_API_KEY`, `AI_GATEWAY_API_KEY`, `ELEVENLABS_API_KEY`)
- [ ] Ensure PostgreSQL database is accessible
- [ ] Run database migrations (`bun run db:migrate`)
- [ ] Verify encryption service starts successfully
- [ ] Test API key save/retrieve flow in UI
- [ ] Confirm keys are encrypted in database (check `users` table)

---

## Architecture

### Components

#### 1. ApiKeyEncryptionService

**Location**: `/server/services/ApiKeyEncryptionService.ts`

**Purpose**: Handles encryption and decryption of API keys using AES-256-GCM.

**Key Methods**:
```typescript
class ApiKeyEncryptionService {
  // Encrypt single key
  encrypt(plaintext: string): EncryptedData

  // Decrypt single key
  decrypt(ciphertext: string, iv: string): string

  // Encrypt multiple keys (batch operation)
  encryptKeys(keys: UserApiKeys): EncryptedKeysWithIv

  // Decrypt multiple keys (batch operation)
  decryptKeys(encryptedKeys: EncryptedKeysWithIv): UserApiKeys
}
```

**Features**:
- Singleton pattern for efficient key management
- Random IV generation for each encryption
- Authenticated encryption (prevents tampering)
- Automatic error handling with detailed logging

#### 2. getUserApiKeys Utility

**Location**: `/server/utils/getUserApiKeys.ts`

**Purpose**: Fetches and decrypts user API keys from the database.

**Key Functions**:
```typescript
// Fetch user's encrypted keys and decrypt them
async function getUserApiKeys(userId: string): Promise<UserApiKeys>

// Merge user keys with environment variable fallbacks
function mergeWithEnvKeys(userKeys: UserApiKeys): UserApiKeys

// Convenience function: fetch + merge in one call
async function getUserApiKeysWithFallback(userId: string): Promise<UserApiKeys>
```

**Usage Example**:
```typescript
import { getUserApiKeysWithFallback } from './utils/getUserApiKeys';

// In your route handler
const keys = await getUserApiKeysWithFallback(userId);
if (!keys.meshyApiKey) {
  return error("Meshy API key not configured");
}

// Use keys.meshyApiKey for Meshy API calls
const meshyClient = new MeshyClient(keys.meshyApiKey);
```

#### 3. Database Schema

**Location**: `/server/db/schema/users.schema.ts`

**Encrypted Fields in `users` table**:
```typescript
{
  meshyApiKey: text("meshy_api_key"),        // Encrypted Meshy key
  aiGatewayApiKey: text("ai_gateway_api_key"), // Encrypted AI Gateway key
  elevenLabsApiKey: text("elevenlabs_api_key"), // Encrypted ElevenLabs key
  apiKeyIv: text("api_key_iv")               // Initialization vector
}
```

**Storage Format**:
- Each key is encrypted individually
- All keys share the same IV (per user)
- IV is stored in Base64 encoding
- Ciphertext includes authentication tag (GCM)

#### 4. API Endpoints

**Location**: `/server/routes/user-api-keys.ts`

**Endpoints**:

1. **POST `/api/users/api-keys`** - Save encrypted API keys
   ```typescript
   Body: {
     meshyApiKey?: string,
     aiGatewayApiKey?: string,
     elevenLabsApiKey?: string
   }
   Response: { success: true, keysConfigured: {...} }
   ```

2. **GET `/api/users/api-keys/status`** - Check which keys are configured
   ```typescript
   Response: {
     keysConfigured: {
       meshyApiKey: boolean,
       aiGatewayApiKey: boolean,
       elevenLabsApiKey: boolean
     },
     hasAnyKeys: boolean
   }
   ```

3. **DELETE `/api/users/api-keys`** - Delete all user API keys
   ```typescript
   Response: { success: true, message: "API keys deleted" }
   ```

**Security**: All endpoints require Privy JWT authentication.

#### 5. Generation Services

**Per-Request Instantiation**:

Generation services (Meshy, AI Gateway, ElevenLabs) are now instantiated **per-request** rather than at server startup. This allows each request to use the appropriate API key based on the user.

**Example Pattern**:
```typescript
// OLD: Single global instance
const meshyClient = new MeshyClient(process.env.MESHY_API_KEY);

// NEW: Per-request instance
app.post('/generate-3d', async ({ userId }) => {
  const keys = await getUserApiKeysWithFallback(userId);
  const meshyClient = new MeshyClient(keys.meshyApiKey);

  return await meshyClient.generate(...);
});
```

**Benefits**:
- Each user's requests use their own keys
- No shared rate limits
- User-specific billing
- Isolated error handling

### Security Measures

#### Encryption Algorithm

**AES-256-GCM** (Advanced Encryption Standard with Galois/Counter Mode)

**Features**:
- **256-bit key**: Extremely secure, practically unbreakable
- **Authenticated encryption**: Detects tampering attempts
- **GCM mode**: Provides both confidentiality and authenticity
- **NIST approved**: Government-standard encryption

**Process**:
1. Generate random 12-byte IV (initialization vector)
2. Encrypt plaintext API key with AES-256-GCM
3. Append authentication tag to ciphertext
4. Store ciphertext + IV in database (both Base64-encoded)

#### Key Protection

**What's Protected**:
- API keys are encrypted before database write
- Keys are decrypted only when needed for API calls
- Keys never appear in logs
- Keys never returned in API responses (only status flags)
- Keys never exposed in error messages

**What's Not Protected** (by design):
- The fact that a user has configured keys (visible in status endpoint)
- Which services a user has configured (boolean flags)

#### Attack Mitigation

| Attack Vector | Mitigation |
|---------------|------------|
| **SQL Injection** | Drizzle ORM with parameterized queries |
| **Database Breach** | Keys encrypted at rest, useless without encryption secret |
| **Man-in-the-Middle** | HTTPS required for all requests |
| **Tampering** | GCM authentication tag detects modifications |
| **Key Exposure in Logs** | Keys filtered from all log output |
| **Unauthorized Access** | Privy JWT authentication required |

---

## Troubleshooting

### Common Issues

#### 1. "API key not configured" Error

**Symptom**: User receives error when trying to generate 3D models or AI content.

**Causes**:
- User hasn't configured their API key in Settings
- Environment variable fallback not set
- API key was deleted

**Solution**:
```
1. Go to Settings → API Keys
2. Enter your API key for the required service
3. Click "Save API Keys"
4. Retry the operation
```

**For Administrators**:
- Check if fallback environment variables are set
- Verify user's keys in database (should see encrypted values)
- Check logs for decryption errors

#### 2. Encryption Service Fails to Start

**Symptom**: Application crashes on startup with error about `API_KEY_ENCRYPTION_SECRET`.

**Error Message**:
```
Error: API_KEY_ENCRYPTION_SECRET environment variable is not set
Error: API_KEY_ENCRYPTION_SECRET must be at least 32 characters
```

**Solution**:
```bash
# Generate a secure secret
openssl rand -base64 32

# Add to .env file
echo "API_KEY_ENCRYPTION_SECRET=$(openssl rand -base64 32)" >> .env

# Restart the application
bun run dev
```

#### 3. Decryption Errors

**Symptom**: User can save keys but gets errors when using them.

**Error Message**:
```
Failed to decrypt API key - data may be corrupted
```

**Causes**:
- `API_KEY_ENCRYPTION_SECRET` was changed after keys were saved
- Database corruption
- Encryption/decryption version mismatch

**Solution**:
1. **If secret was rotated**: Have users re-enter their API keys
2. **If database issue**: Check database integrity, restore from backup
3. **If version issue**: Check that encryption service version matches

**Recovery**:
```typescript
// Users must delete and re-enter their keys
DELETE /api/users/api-keys   // Delete corrupted keys
POST /api/users/api-keys     // Re-enter keys
```

#### 4. API Keys Not Being Used

**Symptom**: User configured keys but system still uses environment variables.

**Debugging Steps**:
1. Check user's key status: `GET /api/users/api-keys/status`
2. Verify keys are in database (encrypted values should exist)
3. Check server logs for key source:
   ```
   "Merged user keys with environment variables"
   keySource: { meshyApiKey: "user" | "env" | "none" }
   ```
4. Ensure generation endpoints use `getUserApiKeysWithFallback()`

**Common Mistakes**:
- Endpoint still using old global service instances
- Forgot to pass userId to key fetch function
- Caching old keys in memory

#### 5. Keys Work in UI but Fail in API Calls

**Symptom**: Keys save successfully but API calls to Meshy/AI Gateway fail.

**Causes**:
- Invalid API key format
- API key expired or revoked
- Service provider rate limiting
- Network issues

**Debugging**:
```bash
# Check if key format is correct
# Meshy: starts with "msy_"
# Vercel AI Gateway: starts with "ag_"
# ElevenLabs: alphanumeric

# Test key directly with service provider
curl -H "Authorization: Bearer YOUR_KEY" https://api.meshy.ai/v1/...

# Check service status
https://status.meshy.ai/
https://www.vercel-status.com/
https://status.elevenlabs.io/
```

**Solution**:
1. Verify key is valid on service provider dashboard
2. Check for typos or extra spaces in saved key
3. Regenerate key on provider dashboard
4. Update key in Asset-Forge settings

#### 6. Performance Issues with Large Userbase

**Symptom**: Slow API key decryption with many concurrent users.

**Optimization**:
- Encryption service uses singleton pattern (efficient)
- Consider caching decrypted keys per request (never persist)
- Use connection pooling for database queries
- Monitor database query performance

**Not Recommended**:
- Don't cache decrypted keys in memory (security risk)
- Don't skip encryption (security risk)
- Don't share keys across users (defeats purpose)

---

## Migration Guide

### For Existing Deployments

If you're running Asset-Forge without user API keys and want to enable this feature:

#### Step 1: Add Encryption Secret

Add the required environment variable:

```bash
# Generate secure secret
API_KEY_ENCRYPTION_SECRET=$(openssl rand -base64 32)

# Add to your environment (.env, Railway, etc.)
echo "API_KEY_ENCRYPTION_SECRET=$API_KEY_ENCRYPTION_SECRET" >> .env
```

#### Step 2: Run Database Migration

The schema changes are likely already applied. Verify:

```bash
# Check if columns exist
bun run db:studio

# Look for these columns in users table:
# - meshy_api_key (text)
# - ai_gateway_api_key (text)
# - elevenlabs_api_key (text)
# - api_key_iv (text)
```

If columns don't exist, generate and run migration:

```bash
bun run db:generate
bun run db:migrate
```

#### Step 3: Keep Existing Keys as Fallbacks (Recommended)

Keep your existing environment variables as fallbacks:

```bash
# These become fallbacks for users who haven't configured their own keys
MESHY_API_KEY=msy_xxxxxxxxxxxxxxxxxxxxx
AI_GATEWAY_API_KEY=ag_xxxxxxxxxxxxxxxxxxxxx
ELEVENLABS_API_KEY=el_xxxxxxxxxxxxxxxxxxxxx
```

**Benefits**:
- Seamless transition for existing users
- New users can generate content immediately
- Users can switch to their own keys when ready

#### Step 4: Update Generation Code (If Needed)

Ensure generation endpoints use user keys:

```typescript
// OLD
const meshyClient = new MeshyClient(process.env.MESHY_API_KEY);

// NEW
import { getUserApiKeysWithFallback } from './utils/getUserApiKeys';

const keys = await getUserApiKeysWithFallback(userId);
const meshyClient = new MeshyClient(keys.meshyApiKey);
```

#### Step 5: Restart Application

```bash
# Development
bun run dev

# Production
# Use your deployment platform's restart mechanism
# (Railway: redeploy, Docker: restart container, etc.)
```

#### Step 6: Verify Functionality

1. **Test encryption service**:
   - Check server logs for: "ApiKeyEncryptionService initialized"
   - Should not see encryption-related errors

2. **Test API key endpoints**:
   ```bash
   # Get status (should return empty initially)
   curl -H "Authorization: Bearer <jwt>" \
        https://your-domain.com/api/users/api-keys/status

   # Save keys
   curl -X POST \
        -H "Authorization: Bearer <jwt>" \
        -H "Content-Type: application/json" \
        -d '{"meshyApiKey":"test_key"}' \
        https://your-domain.com/api/users/api-keys
   ```

3. **Test generation with user keys**:
   - Configure keys in UI (Settings → API Keys)
   - Generate a 3D model or AI content
   - Check logs to confirm user keys are being used

#### Step 7: Communicate to Users (Optional)

Inform your users about the new feature:

```
Subject: New Feature: Bring Your Own API Keys

We've added support for user-provided API keys!

Benefits:
- Use your own Meshy, Vercel AI Gateway, and ElevenLabs keys
- Direct billing and cost control
- No shared rate limits

How to set up:
1. Get API keys from service providers
2. Go to Settings → API Keys in Asset-Forge
3. Enter your keys and save

Your existing workflow continues unchanged - this is optional!
```

### Rollback Plan

If you need to revert:

1. **Remove encryption secret** from environment
2. **Restore old service initialization** (global instances)
3. **Remove user key endpoints** (or disable routes)
4. **Don't delete database columns** (can be reused later)

```bash
# Disable user API key routes (in api-elysia.ts)
// .use(userApiKeysRoutes)  // Comment out

# Revert to global service instances
const meshyClient = new MeshyClient(process.env.MESHY_API_KEY);
```

---

## Best Practices

### For Users

1. **Keep keys secure**: Never share your API keys with anyone
2. **Use strong keys**: Let service providers generate keys (don't create custom ones)
3. **Monitor usage**: Check your service provider dashboards for usage and costs
4. **Rotate regularly**: Consider regenerating keys periodically for security
5. **Delete when done**: If you stop using Asset-Forge, delete your keys

### For Developers

1. **Never log keys**: Always filter API keys from logs
2. **Use fallbacks wisely**: Provide defaults for smooth onboarding
3. **Validate key format**: Check key format before encryption
4. **Handle errors gracefully**: Provide clear error messages for users
5. **Test encryption**: Write tests for encryption/decryption logic
6. **Document changes**: Update this doc when adding new services

### For Administrators

1. **Protect encryption secret**: Treat it like a database password
2. **Monitor logs**: Watch for decryption errors or suspicious activity
3. **Backup regularly**: Include encryption secret in backup procedures
4. **Use HTTPS**: Always use HTTPS in production
5. **Audit access**: Review who can access environment variables
6. **Plan for rotation**: Have a process for rotating encryption secret if compromised

---

## Future Enhancements

Potential improvements to the user API key system:

### Near Term

- [ ] Key validation before saving (test keys with service providers)
- [ ] Usage tracking per user key
- [ ] Key expiration warnings
- [ ] Bulk key management (import/export)
- [ ] Service health checks with user keys

### Long Term

- [ ] Key rotation reminders
- [ ] Usage analytics dashboard
- [ ] Cost estimation before operations
- [ ] Multi-key support (multiple keys per service)
- [ ] Key sharing within teams/projects
- [ ] Automatic key provisioning (partner integrations)

---

## Additional Resources

### Related Documentation

- **API Reference**: See `/api/users/api-keys` Swagger documentation
- **Database Schema**: `/server/db/schema/users.schema.ts`
- **Encryption Service**: `/server/services/ApiKeyEncryptionService.ts`
- **Migration Guide**: Database migration files in `/server/db/migrations/`

### External Links

- [Meshy API Documentation](https://docs.meshy.ai/)
- [Vercel AI Gateway Docs](https://vercel.com/docs/workflow-collaboration/vercel-ai-gateway)
- [ElevenLabs API Docs](https://docs.elevenlabs.io/)
- [AES-GCM Encryption](https://en.wikipedia.org/wiki/Galois/Counter_Mode)
- [NIST Encryption Standards](https://csrc.nist.gov/projects/cryptographic-standards-and-guidelines)

### Support

For issues or questions:

1. Check the Troubleshooting section above
2. Review server logs for detailed error messages
3. Check service provider status pages
4. Contact support with relevant error messages and logs

---

**Last Updated**: 2025-01-13
**Version**: 1.0.0
**Maintainer**: Asset-Forge Development Team
