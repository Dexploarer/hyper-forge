# World Knowledge API Documentation

Complete AI-powered world context and knowledge management API for autonomous world building.

## 🎯 Overview

The World Knowledge API provides comprehensive world context for AI agents and users, enabling:
- **AI Agents**: Get LLM-ready context, detect duplicates, understand relationships, receive quality suggestions
- **Human Users**: Search entities, visualize relationships, get quality scores, backup/restore worlds
- **Developers**: Full TypeScript types, Swagger docs, authentication, caching, logging

## 📊 API Endpoints (9 Total)

### Phase 1: Core Context (4 endpoints)

#### 1. GET `/api/world/context` - Complete World Overview
Get comprehensive world state including stats, entities, relationships, and style guide.

**Query Parameters:**
- `includeRelationships?: boolean` - Include relationship graph (default: true)
- `includeFullData?: boolean` - Include full entity data (default: false)
- `maxEntities?: number` - Max entities to return (default: 1000)
- `format?: "summary" | "detailed" | "llm-optimized"` - Output format (default: "summary")

**Response:**
```json
{
  "success": true,
  "worldContext": {
    "stats": { "totalNPCs": 25, "totalQuests": 15, "totalLore": 10, ... },
    "worldConfig": { "name": "...", "theme": "...", "complexity": "..." },
    "entities": {
      "npcs": [...],
      "quests": [...],
      "lore": [...],
      "locations": [...]
    },
    "relationshipGraph": {
      "nodes": [...],
      "edges": [...]
    },
    "styleGuide": {
      "commonThemes": ["fantasy", "medieval"],
      "tone": "Epic Adventure",
      "namingConventions": ["Fantasy"],
      "avoidTopics": []
    },
    "suggestions": {
      "missingContent": ["Add more diverse NPC archetypes"],
      "weakConnections": ["5 entities have no relationships"],
      "opportunities": ["Create lore entries to add depth"]
    }
  },
  "generatedAt": "2025-11-17T...",
  "cacheExpiresIn": 300
}
```

**Example:**
```bash
curl "http://localhost:8080/api/world/context?format=summary&includeRelationships=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

#### 2. GET `/api/world/search` - Advanced Entity Search
Search across all entities with filters and facets.

**Query Parameters:**
- `q?: string` - Search query
- `type?: "npc" | "quest" | "lore" | "dialogue" | "location" | "all"` - Entity type filter
- `tags?: string` - Comma-separated tags
- `archetype?: string` - NPC archetype filter
- `difficulty?: string` - Quest difficulty filter
- `semantic?: boolean` - Use semantic search (default: false)
- `limit?: number` - Results per page (default: 50)
- `offset?: number` - Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "query": { "text": "knight", "type": "npc", "semantic": false },
  "results": [
    {
      "id": "...",
      "type": "npc",
      "name": "Sir Galahad",
      "archetype": "Knight",
      "summary": "A noble knight of the round table...",
      "relevanceScore": 0.95,
      "matchedFields": ["name", "tags"],
      "relationshipCount": 5,
      "tags": ["knight", "warrior", "hero"]
    }
  ],
  "totalResults": 15,
  "facets": {
    "byType": { "npc": 10, "quest": 3, "lore": 2 },
    "byTag": { "knight": 8, "warrior": 5 },
    "byArchetype": { "Knight": 10, "Warrior": 3 }
  },
  "pagination": { "limit": 50, "offset": 0, "hasMore": false }
}
```

**Example:**
```bash
curl "http://localhost:8080/api/world/search?q=knight&type=npc&tags=warrior,hero&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

#### 3. GET `/api/world/stats` - Quick Statistics
Get lightweight world statistics for dashboards.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalNPCs": 25,
    "totalQuests": 15,
    "totalLore": 10,
    "totalDialogues": 50,
    "totalLocations": 8
  },
  "worldConfig": {
    "name": "Eldoria",
    "theme": "High Fantasy",
    "complexity": "high"
  }
}
```

**Example:**
```bash
curl "http://localhost:8080/api/world/stats" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

#### 4. GET `/api/world/health` - Health Check
Service health monitoring endpoint (no auth required).

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "service": "world-knowledge",
  "timestamp": "2025-11-17T..."
}
```

**Example:**
```bash
curl "http://localhost:8080/api/world/health"
```

---

### Phase 2: Generation Support (3 endpoints)

#### 5. POST `/api/world/build-context` - LLM Context Builder
Build optimized context for AI content generation with system prompts and constraints.

**Body:**
```json
{
  "intent": "generate_npc" | "generate_quest" | "generate_lore" | "expand_world",
  "theme": "medieval knights",
  "relatedEntityIds": ["entity-id-1", "entity-id-2"]
}
```

**Response:**
```json
{
  "success": true,
  "context": {
    "worldSummary": "WORLD: Eldoria\nTHEME: High Fantasy\nTONE: Epic Adventure\n...",
    "relevantNPCs": [...],
    "relevantQuests": [...],
    "relevantLore": [...],
    "styleGuide": { ... },
    "constraints": {
      "avoidDuplicates": ["Already have 5 Knight NPCs"],
      "fillGaps": ["World needs more lore entries"],
      "maintainConsistency": ["Maintain High Fantasy theme"]
    },
    "systemPrompt": "You are creating content for a game world...",
    "contextWindow": "\n\nEXISTING NPCs:\n- Sir Galahad (Knight): A noble knight...",
    "tokenEstimate": 1250,
    "compressionLevel": "medium"
  }
}
```

**Example:**
```bash
curl -X POST "http://localhost:8080/api/world/build-context" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "intent": "generate_npc",
    "theme": "medieval knights"
  }'
```

**Use Case - AI Generation:**
```typescript
// Get context for generating a new NPC
const response = await fetch('/api/world/build-context', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    intent: 'generate_npc',
    theme: 'mysterious mage'
  })
});

const { context } = await response.json();

// Use context in LLM prompt
const npcData = await llm.generate({
  systemPrompt: context.systemPrompt,
  context: context.contextWindow,
  constraints: context.constraints,
  temperature: 0.7
});
```

---

#### 6. GET `/api/world/similar/:entityType/:entityId` - Find Similar Entities
Detect duplicate content using Levenshtein distance and tag matching.

**Path Parameters:**
- `entityType: "npc" | "quest" | "lore" | "dialogue" | "location"`
- `entityId: string`

**Query Parameters:**
- `limit?: number` - Max results (default: 10)
- `scoreThreshold?: number` - Minimum similarity score 0-1 (default: 0.7)

**Response:**
```json
{
  "success": true,
  "sourceEntity": { "id": "...", "type": "npc" },
  "similarEntities": [
    {
      "id": "...",
      "type": "npc",
      "name": "Sir Galahad",
      "archetype": "Knight",
      "similarity": 0.85,
      "sharedThemes": ["knight", "warrior"],
      "suggestedRelationships": ["could_be_allies", "could_be_rivals"],
      "reason": "Shared themes: knight, warrior"
    }
  ],
  "totalFound": 3
}
```

**Example:**
```bash
curl "http://localhost:8080/api/world/similar/npc/entity-123?limit=5&scoreThreshold=0.8" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Use Case - Duplicate Detection:**
```typescript
// Before generating new content, check for duplicates
const response = await fetch(`/api/world/similar/npc/${newEntityId}?scoreThreshold=0.8`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { similarEntities } = await response.json();

if (similarEntities.length > 0) {
  console.warn('Found similar entities:', similarEntities);
  // Offer to merge or create relationship instead
}
```

---

#### 7. GET `/api/world/graph/:entityId` - Relationship Graph Traversal
Recursively traverse relationship network from a starting entity.

**Path Parameters:**
- `entityId: string`

**Query Parameters:**
- `depth?: number` - Traversal depth 1-5 (default: 2)
- `relationshipTypes?: string` - Comma-separated types to filter

**Response:**
```json
{
  "success": true,
  "graph": {
    "centerNode": {
      "id": "...",
      "type": "npc",
      "name": "Sir Galahad",
      "summary": "A noble knight..."
    },
    "connections": [
      {
        "relationship": "gives_quest",
        "strength": "strong",
        "depth": 1,
        "target": {
          "id": "...",
          "type": "quest",
          "name": "The Holy Grail",
          "connections": [...]
        }
      }
    ],
    "stats": {
      "totalNodes": 12,
      "maxDepth": 3,
      "relationshipTypes": ["gives_quest", "ally_of", "mentions"]
    }
  }
}
```

**Example:**
```bash
curl "http://localhost:8080/api/world/graph/entity-123?depth=3&relationshipTypes=gives_quest,ally_of" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Use Case - Visualize Network:**
```typescript
// Get relationship network for visualization
const response = await fetch(`/api/world/graph/${entityId}?depth=2`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { graph } = await response.json();

// Render with D3.js or similar
renderNetworkGraph(graph.centerNode, graph.connections);
```

---

### Phase 3: Import/Export (1 endpoint)

#### 8. GET `/api/world/snapshot` - Export World Snapshot
Export complete world state for backup or transfer.

**Query Parameters:**
- `includeAssets?: boolean` - Include asset data (default: true)

**Response:**
```json
{
  "success": true,
  "snapshot": {
    "version": "1.0",
    "worldId": "...",
    "worldName": "Eldoria",
    "exportedAt": "2025-11-17T...",
    "worldConfig": { ... },
    "entities": {
      "npcs": [...],
      "quests": [...],
      "lore": [...],
      "locations": [...]
    },
    "relationships": [...],
    "stats": { ... }
  },
  "fileSizeEstimate": "2.45 MB",
  "entityCount": 58
}
```

**Example:**
```bash
curl "http://localhost:8080/api/world/snapshot?includeAssets=true" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  > world-backup.json
```

**Use Case - Backup & Restore:**
```typescript
// Export world for backup
const response = await fetch('/api/world/snapshot', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { snapshot } = await response.json();

// Save to file or cloud storage
await saveBackup(snapshot, `world-${Date.now()}.json`);

// Later: Restore from snapshot (import endpoint - future phase)
```

---

### Phase 4: Quality Tools (1 endpoint)

#### 9. POST `/api/world/check-consistency` - Consistency Checker
Validate world coherence and identify quality issues.

**Response:**
```json
{
  "success": true,
  "issues": [
    {
      "id": "...",
      "severity": "warning",
      "type": "orphaned_entity",
      "message": "npc \"Mysterious Stranger\" has no relationships",
      "entityId": "...",
      "entityType": "npc",
      "suggestions": [
        {
          "action": "create_relationship",
          "description": "Connect to related entities"
        }
      ]
    },
    {
      "id": "...",
      "severity": "error",
      "type": "duplicate_name",
      "message": "Multiple entities named \"The Tavern\" (location, quest)",
      "suggestions": [
        {
          "action": "rename",
          "description": "Give unique names to distinguish them"
        }
      ]
    }
  ],
  "stats": {
    "totalIssues": 12,
    "errors": 2,
    "warnings": 8,
    "info": 2
  },
  "overallScore": 7.5,
  "recommendations": [
    "Fix duplicate names and broken relationships",
    "Connect orphaned entities to improve world cohesion"
  ]
}
```

**Example:**
```bash
curl -X POST "http://localhost:8080/api/world/check-consistency" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Use Case - Quality Dashboard:**
```typescript
// Check world quality periodically
const response = await fetch('/api/world/check-consistency', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});

const { overallScore, issues, recommendations } = await response.json();

// Display in dashboard
renderQualityScore(overallScore); // 0-10 scale
renderIssuesList(issues); // Grouped by severity
renderRecommendations(recommendations);
```

---

## 🔐 Authentication

All endpoints (except `/health`) require authentication via Bearer token:

```bash
curl "http://localhost:8080/api/world/context" \
  -H "Authorization: Bearer YOUR_API_KEY_OR_JWT"
```

**Token Types Supported:**
- **API Keys**: Start with `af_` prefix (from `/api/users/api-keys`)
- **Privy JWT**: Standard JWT from Privy authentication

---

## ⚡ Performance & Caching

**Caching Strategy:**
- World context cached for 5 minutes (300s TTL)
- Relationship graphs cached per entity
- Cache invalidation on entity create/update/delete

**Cache Control:**
```typescript
import { invalidateWorldCache } from './services/WorldKnowledgeService';

// Invalidate cache after entity changes
await createNPC(data);
invalidateWorldCache(userId, 'npc');
```

---

## 🎨 Use Cases

### For AI Agents

**1. Generate Contextually-Aware Content:**
```typescript
// Step 1: Build generation context
const context = await buildContext({
  intent: 'generate_npc',
  theme: 'tavern keeper'
});

// Step 2: Check for duplicates
const similar = await findSimilar('npc', newEntityId);
if (similar.length > 0) {
  // Create relationship instead of duplicate
}

// Step 3: Generate with constraints
const npc = await llm.generate({
  systemPrompt: context.systemPrompt,
  context: context.contextWindow,
  constraints: context.constraints
});

// Step 4: Validate consistency
const quality = await checkConsistency();
if (quality.overallScore < 7) {
  // Fix issues before proceeding
}
```

**2. Autonomous World Building:**
```typescript
// AI agent workflow
while (true) {
  // Get current world state
  const world = await getWorldContext({ format: 'llm-optimized' });
  
  // Identify gaps from suggestions
  const gaps = world.suggestions.missingContent;
  
  // Generate missing content
  for (const gap of gaps) {
    const context = await buildContext({
      intent: deriveIntent(gap),
      theme: world.styleGuide.commonThemes[0]
    });
    
    await generateAndCreateEntity(context);
  }
  
  // Verify quality
  const quality = await checkConsistency();
  if (quality.overallScore >= 8) break;
}
```

### For Human Users

**1. World Explorer Dashboard:**
```typescript
// Get overview
const stats = await getStats();
const context = await getWorldContext({ format: 'summary' });

// Display stats
renderStats(stats);
renderEntityBreakdown(context.entities);
renderRelationshipGraph(context.relationshipGraph);
renderQualityScore(await checkConsistency());
```

**2. Search & Discovery:**
```typescript
// Advanced search with facets
const results = await searchEntities({
  q: userQuery,
  type: 'all',
  limit: 20
});

// Display results with faceted filters
renderResults(results.results);
renderFacets(results.facets); // Clickable filters
renderPagination(results.pagination);
```

**3. Relationship Visualization:**
```typescript
// Interactive network graph
const graph = await getRelationshipGraph(entityId, { depth: 3 });

// Render with D3.js force-directed graph
const simulation = d3.forceSimulation(graph.centerNode)
  .force('link', d3.forceLink(graph.connections))
  .force('charge', d3.forceManyBody())
  .force('center', d3.forceCenter());
```

---

## 📚 Technical Details

**Architecture:**
- **Service Layer**: `WorldKnowledgeService.ts` (~1,373 lines)
- **Routes Layer**: `world-knowledge.ts` (~523 lines)
- **Total**: 9 endpoints, 14 public methods, 8 helper methods

**Features:**
- ✅ Full TypeScript type safety
- ✅ Elysia/TypeBox validation
- ✅ Swagger/OpenAPI documentation
- ✅ Request logging with Pino
- ✅ In-memory caching with TTL
- ✅ Levenshtein distance algorithm
- ✅ Recursive graph traversal
- ✅ Authentication (API keys + JWT)
- ✅ Error handling and recovery

**Dependencies:**
- `ContentDatabaseService` - Entity CRUD operations
- `RelationshipService` - Relationship management
- `WorldConfigService` - World configuration

---

## 🧪 Testing

All endpoints are production-ready and can be tested immediately:

```bash
# Test with curl
export TOKEN="your_token_here"

# 1. Health check
curl "http://localhost:8080/api/world/health"

# 2. Get world overview
curl "http://localhost:8080/api/world/context" \
  -H "Authorization: Bearer $TOKEN"

# 3. Search entities
curl "http://localhost:8080/api/world/search?q=knight&type=npc" \
  -H "Authorization: Bearer $TOKEN"

# 4. Build generation context
curl -X POST "http://localhost:8080/api/world/build-context" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"intent": "generate_npc", "theme": "warrior"}'

# 5. Find similar entities
curl "http://localhost:8080/api/world/similar/npc/ENTITY_ID" \
  -H "Authorization: Bearer $TOKEN"

# 6. Get relationship graph
curl "http://localhost:8080/api/world/graph/ENTITY_ID?depth=2" \
  -H "Authorization: Bearer $TOKEN"

# 7. Export snapshot
curl "http://localhost:8080/api/world/snapshot" \
  -H "Authorization: Bearer $TOKEN" > backup.json

# 8. Check consistency
curl -X POST "http://localhost:8080/api/world/check-consistency" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📖 Swagger Documentation

Interactive API documentation available at:
```
http://localhost:8080/swagger
```

Look for the "World Knowledge" tag to explore all endpoints with interactive testing.

---

## 🚀 Future Enhancements

- **Vector Search**: Semantic similarity using Qdrant embeddings
- **Import Functionality**: Restore from snapshot exports
- **Real-time Webhooks**: Subscribe to world state changes
- **Analytics Dashboard**: Visual world quality metrics
- **AI Suggestions**: Automated content generation recommendations
- **Multi-world Support**: Manage multiple game worlds

---

## 📝 License

Part of the Asset-Forge project.

## 🤝 Contributing

See main project README for contribution guidelines.

---

**Built with:**
- Elysia (Bun web framework)
- TypeBox (schema validation)
- Drizzle ORM (database)
- Pino (logging)
- TypeScript (type safety)
