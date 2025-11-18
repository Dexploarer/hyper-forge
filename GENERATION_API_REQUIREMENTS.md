# Generation API Requirements - What's Actually Needed

## Summary of Over-Aggressive Requirements

**TLDR**: Most generation endpoints require too many fields. Here's what's actually needed vs what's required:

---

## 1. 3D Model Generation (`POST /api/generation/pipeline`)

### Currently Required (5 fields):

```json
{
  "description": "string (min 1 char)",
  "assetId": "string (min 1 char)",
  "name": "string (min 1 char)",
  "type": "string (min 1 char)",
  "subtype": "string (min 1 char)",
  "user": {
    "userId": "string (min 1 char)" // Auto-filled from auth
  }
}
```

###What Should Be Required (2 fields):

```json
{
  "name": "Dragon Blade",
  "description": "A glowing sword"
}
```

### Optional (but useful):

- `type`, `subtype`, `tier` (can be auto-inferred from description)
- `style`, `quality`, `enableRigging` (have sensible defaults)

**Verdict**: ⚠️ **OVER-AGGRESSIVE** - Should only require name + description

---

## 2. Content Generation

### NPC Generation (`POST /api/content/generate-npc`)

**Required**:

```json
{
  "prompt": "string (10-2000 chars)"
}
```

**Verdict**: ✅ **GOOD** - Only requires prompt!

---

### Quest Generation (`POST /api/content/generate-quest`)

**Required**: NONE (all fields optional)

**Verdict**: ✅ **PERFECT** - All optional with smart defaults

---

### Dialogue Generation (`POST /api/content/generate-dialogue`)

**Required**: NONE (all fields optional)

**Verdict**: ✅ **PERFECT** - All optional with smart defaults

---

### Lore Generation (`POST /api/content/generate-lore`)

**Required**: NONE (all fields optional)

**Verdict**: ✅ **PERFECT** - All optional with smart defaults

---

### World Generation (`POST /api/content/generate-world`)

**Required**: NONE (all fields optional)

**Verdict**: ✅ **PERFECT** - All optional with smart defaults

---

## 3. Voice Generation

### Single Voice (`POST /api/voice/generate`)

**Required**:

```json
{
  "text": "string (min 1 char)",
  "voiceId": "string (min 1 char)"
}
```

**Verdict**: ✅ **GOOD** - Minimal required fields

---

### Batch Voice (`POST /api/voice/generate-batch`)

**Required**:

```json
{
  "texts": ["array of strings (min 1 item)"],
  "voiceId": "string (min 1 char)"
}
```

**Verdict**: ✅ **GOOD** - Minimal required fields

---

### Voice Design (`POST /api/voice/design`)

**Required**:

```json
{
  "voiceDescription": "string (min 1 char)"
}
```

**Verdict**: ✅ **PERFECT** - Only needs description

---

### Create Custom Voice (`POST /api/voice/create`)

**Required**:

```json
{
  "voiceName": "string (min 1 char)",
  "voiceDescription": "string (min 1 char)",
  "generatedVoiceId": "string (min 1 char)"
}
```

**Verdict**: ✅ **GOOD** - Reasonable requirements

---

## 4. Music Generation

### Generate Music (`POST /api/music/generate`)

**Required**: NONE (all optional)

**Verdict**: ✅ **PERFECT** - Fully optional with defaults

---

### Create Composition Plan (`POST /api/music/plan`)

**Required**:

```json
{
  "prompt": "string (min 1 char)"
}
```

**Verdict**: ✅ **GOOD** - Only needs prompt

---

### Batch Music (`POST /api/music/generate-batch`)

**Required**:

```json
{
  "tracks": [
    {
      // All fields optional per track
    }
  ]
}
```

**Verdict**: ✅ **GOOD** - Flexible batch generation

---

## 5. Sound Effects

### Generate SFX (`POST /api/sfx/generate`)

**Required**:

```json
{
  "text": "string (min 1 char)"
}
```

**Verdict**: ✅ **PERFECT** - Only needs description

---

### Batch SFX (`POST /api/sfx/generate-batch`)

**Required**:

```json
{
  "effects": [
    {
      "text": "string (min 1 char)"
    }
  ]
}
```

**Verdict**: ✅ **GOOD** - Minimal per effect

---

## 6. Image/Portrait Generation

**No dedicated endpoint found** - Images generated as part of 3D pipeline or NPC generation

---

## 7. Banner Generation

**No dedicated endpoint found**

---

## Problems Identified

### 🔴 Critical: 3D Model Generation (PipelineConfig)

**Current Required Fields** (Lines 347-378):

```typescript
export const PipelineConfig = t.Object({
  description: t.String({ minLength: 1 }), // ✅ Makes sense
  assetId: t.String({ minLength: 1 }), // ❌ Should be auto-generated
  name: t.String({ minLength: 1 }), // ✅ Makes sense
  type: t.String({ minLength: 1 }), // ❌ Can be inferred
  subtype: t.String({ minLength: 1 }), // ❌ Can be inferred
  user: t.Object({
    userId: t.String({ minLength: 1 }), // ❌ Auto-filled from auth
  }),
  // ... 15+ optional fields
});
```

**Recommended Change**:

```typescript
export const PipelineConfig = t.Object({
  name: t.String({ minLength: 1 }), // User names their asset
  description: t.String({ minLength: 1 }), // What to generate

  // Everything else optional with smart defaults
  assetId: t.Optional(t.String()), // Auto-generate if not provided
  type: t.Optional(t.String()), // Infer from description
  subtype: t.Optional(t.String()), // Infer from description
  tier: t.Optional(t.Number()), // Default to 1
  style: t.Optional(t.String()), // Default to "fantasy"
  quality: t.Optional(t.String()), // Default to "balanced"
  // ... rest optional
});
```

**Impact**: Reduces required fields from 5→2 (60% reduction)

---

## Recommendations

### Immediate Fixes

1. **Make `assetId` optional** - Auto-generate from name if not provided
   - Current: User must provide `"quest-giver-tpose-rs3-001"`
   - Better: Auto-generate `"quest-giver-1234567890"`

2. **Make `type`/`subtype` optional** - Infer from description using AI
   - Current: User must specify `type: "character", subtype: "npc"`
   - Better: Parse from description "Quest giver NPC..." → infer type

3. **Remove `user` from body** - Already extracted from auth token
   - Current: User object required in request body (but ignored)
   - Better: Remove from schema entirely

### Suggested Minimal Schema

```typescript
export const SimplePipelineConfig = t.Object({
  // REQUIRED (just 2 fields)
  name: t.String({ minLength: 1 }),
  description: t.String({ minLength: 1 }),

  // OPTIONAL (everything else)
  assetId: t.Optional(t.String()),
  type: t.Optional(t.String()),
  subtype: t.Optional(t.String()),
  tier: t.Optional(t.Number()),
  quality: t.Optional(t.String()),
  style: t.Optional(t.String()),
  enableRigging: t.Optional(t.Boolean()),
  customPrompts: t.Optional(
    t.Object({
      /* ... */
    }),
  ),
  metadata: t.Optional(
    t.Object({
      /* ... */
    }),
  ),
});
```

### Default Values Strategy

```typescript
const defaults = {
  assetId: () => `asset-${Date.now()}-${randomId()}`,
  type: (description) => inferTypeFromDescription(description), // Use AI
  subtype: (description, type) => inferSubtype(description, type),
  tier: 1,
  quality: "balanced",
  style: "fantasy",
  enableRigging: false,
  enableRetexturing: false,
  enableSprites: false,
};
```

---

## Comparison: Before vs After

### Before (Current)

```json
{
  "name": "Quest Giver",
  "description": "Quest giver in T-pose, RuneScape style",
  "assetId": "quest-giver-tpose-rs3-001",
  "type": "character",
  "subtype": "npc",
  "user": {
    "userId": "abc-123"
  }
}
```

### After (Proposed)

```json
{
  "name": "Quest Giver",
  "description": "Quest giver in T-pose, RuneScape style"
}
```

**Result**: 6 fields → 2 fields (66% reduction in complexity)

---

## Implementation Priority

| Endpoint    | Current    | Ideal      | Fix Priority |
| ----------- | ---------- | ---------- | ------------ |
| 3D Pipeline | 5 required | 2 required | 🔴 HIGH      |
| NPC Gen     | 1 required | 1 required | ✅ GOOD      |
| Quest Gen   | 0 required | 0 required | ✅ PERFECT   |
| Voice Gen   | 2 required | 2 required | ✅ GOOD      |
| Music Gen   | 0 required | 0 required | ✅ PERFECT   |
| SFX Gen     | 1 required | 1 required | ✅ PERFECT   |

**Verdict**: Only the 3D pipeline generation schema needs fixing.

---

## Next Steps

1. Update `PipelineConfig` schema to make most fields optional
2. Add smart defaults in generation service
3. Use AI to infer `type`/`subtype` from description if not provided
4. Auto-generate `assetId` if not provided
5. Remove `user` from body schema (already in auth context)

This will make the API much more user-friendly and reduce friction for developers.
