# World Config Integration with Content Generation

## Overview

World Configuration integrates seamlessly with AI content generation to produce setting-specific, internally consistent game content. When a world configuration is active, it automatically enhances all AI generation requests with contextual information about your game world.

## How It Works

### 1. Configuration Storage

World configurations are stored in the `world_configs` database table with:

- Races with traits and cultural backgrounds
- Factions with relationships (allies/enemies)
- Skills with prerequisites
- World parameters (magic level, technology level, etc.)
- Lore and cultural notes

### 2. Context Injection

When generating content, the system:

1. Checks for an active world configuration
2. Builds AI context from the configuration
3. Prepends context to the generation prompt
4. AI generates content aware of your world rules

### 3. Generation Enhancement

With world context, AI produces:

- **More detailed** descriptions using world lore
- **Better consistency** following world rules
- **Appropriate references** to factions and races
- **Setting-specific terminology** matching your world

## Implementation Details

### Fetching Active Configuration

```typescript
import { WorldConfigService } from "@/server/services/WorldConfigService";

const worldConfigService = new WorldConfigService(db);

// Get user's active configuration
const config = await worldConfigService.getActiveConfiguration(userId);

if (!config) {
  // No active config - proceed with generic generation
  return generateGenericContent(prompt);
}
```

### Building AI Context

```typescript
// Build context string from configuration
const { context, tokens } = await worldConfigService.buildAIContext(config.id);

// context is a formatted string like:
// "WORLD: Medieval Fantasy
//  RACES: Humans (adaptable, ambitious), Elves (long-lived, magical)
//  FACTIONS: Northern Kingdom (allies: Mage Guild), Shadow Council (enemies: Northern Kingdom)
//  MAGIC LEVEL: High
//  TECHNOLOGY: Medieval"

// tokens is estimated token count for context
```

### Integrating with Generation

```typescript
// Example: NPC Generation with World Context
async function generateNPC(input: {
  name: string;
  race?: string;
  worldConfigId?: string;
}) {
  // Get configuration (explicit or active)
  const configId = input.worldConfigId || (await getActiveConfigId(userId));

  let worldContext = "";
  if (configId) {
    const { context } = await worldConfigService.buildAIContext(configId);
    worldContext = context;
  }

  // Build prompt with context
  const systemPrompt = `
${worldContext}

Generate an NPC character following the world rules above.
  `.trim();

  const userPrompt = `
Create an NPC named "${input.name}"
${input.race ? `Race: ${input.race}` : ""}
  `.trim();

  // Call AI with contextual prompts
  const result = await ai.generateText({
    model: "gpt-4",
    system: systemPrompt,
    prompt: userPrompt,
  });

  return result;
}
```

## API Integration

### Optional World Config Parameter

Most generation endpoints accept an optional `worldConfigId`:

```typescript
POST /api/content/generate-npc
{
  "name": "Warrior",
  "race": "human",
  "worldConfigId": "optional-config-id"  // If omitted, uses active config
}
```

**Logic**:

1. If `worldConfigId` provided: Use that specific configuration
2. If omitted: Use user's active configuration
3. If no active: Proceed without world context (generic generation)

### Example Endpoints

**NPC Generation**:

```typescript
POST /api/content/generate-npc
{
  "name": "Thoran",
  "race": "human",
  "class": "warrior",
  "worldConfigId": "config-123"  // Optional
}
```

**Quest Generation**:

```typescript
POST /api/content/generate-quest
{
  "title": "Rescue Mission",
  "difficulty": "medium",
  "involvedFactions": ["northern-kingdom", "shadow-council"],
  "worldConfigId": "config-123"  // Optional
}
```

**Dialogue Generation**:

```typescript
POST /api/content/generate-dialogue
{
  "npcId": "npc-456",
  "situation": "greeting",
  "playerRace": "elf",
  "worldConfigId": "config-123"  // Optional
}
```

**Item Generation**:

```typescript
POST /api/content/generate-item
{
  "type": "weapon",
  "tier": 3,
  "material": "steel",
  "worldConfigId": "config-123"  // Optional
}
```

## Context Format

### Context String Structure

```
WORLD: [World Name]
Description: [World Description]

RACES:
- [Race Name]: [Description] | Traits: [trait1, trait2]
  Cultural Background: [background]
- [Race Name 2]: ...

FACTIONS:
- [Faction Name]: [Description] | Alignment: [alignment]
  Allies: [ally1, ally2] | Enemies: [enemy1, enemy2]
  Goals: [goal1, goal2]
- [Faction Name 2]: ...

SKILLS:
- [Skill Name] ([Category]): [Description]
  Prerequisites: [skill1, skill2]
- [Skill Name 2]: ...

WORLD PARAMETERS:
- Magic Level: [none/low/moderate/high]
- Technology Level: [primitive/medieval/renaissance/industrial/modern/futuristic]
- Conflict Intensity: [low/moderate/high]
- Setting Theme: [theme]

CULTURAL NOTES:
[Additional lore and cultural information]
```

### Context Example

```
WORLD: Frozen Kingdoms of Nordgard
Description: A harsh northern realm where ice magic and ancient traditions dominate

RACES:
- Human (Nordfolk): Hardy survivors of the frozen wastes | Traits: Resilient, Stoic
  Cultural Background: Descended from ice-sailors, value honor and endurance
- Frost Elf: Ancient beings tied to winter magic | Traits: Magical, Patient, Long-lived
  Cultural Background: Guardians of frozen forests, speak in riddles

FACTIONS:
- Northern Kingdom: Feudal society of warrior-lords | Alignment: Lawful Neutral
  Allies: Mage Guild | Enemies: Shadow Council, Ice Reavers
  Goals: Maintain order, Defend borders, Preserve ancient laws
- Mage Guild: Order of ice mages | Alignment: Neutral Good
  Allies: Northern Kingdom | Enemies: Shadow Council
  Goals: Study frost magic, Advise rulers, Prevent magical catastrophes

SKILLS:
- Ice Blade (Combat): Conjure blade of ice | Prerequisites: Frost Magic
- Frost Magic (Magic): Control ice and cold | Prerequisites: None
- Northern Tactics (Combat): Warfare in harsh conditions | Prerequisites: Survival

WORLD PARAMETERS:
- Magic Level: High
- Technology Level: Medieval
- Conflict Intensity: Moderate
- Setting Theme: Dark Fantasy, Survival

CULTURAL NOTES:
The people of Nordgard believe strength comes from enduring hardship. Ice magic is both revered and feared. Ancient ruins dot the landscape, remnants of a civilization that fell to eternal winter.
```

## Token Management

### Context Size Limits

World context is injected into the system prompt, consuming tokens from your AI model's context window.

**Typical Sizes**:

- Minimal config: ~200 tokens
- Standard config: ~500-800 tokens
- Detailed config: ~1000-1500 tokens
- Very large config: ~2000+ tokens

**Token Budget**:

- GPT-4: 8K context (leave 5K for response)
- GPT-4-32K: 32K context (plenty of room)
- Claude-3: 200K context (no concerns)

### Optimization Strategies

**1. Concise Descriptions**

```typescript
// Bad (verbose)
race.description =
  "The Elves are an ancient and mystical race of beings who have lived in the forests for thousands of years, possessing innate magical abilities and wisdom that comes from their extremely long lifespans which can extend for centuries or even millennia.";

// Good (concise)
race.description =
  "Ancient forest dwellers with innate magic and centuries-long lifespans.";
```

**2. Selective Context**
For some generation types, include only relevant parts:

```typescript
// Item generation - only need world parameters, not full race/faction details
async function buildItemContext(configId: string) {
  const config = await worldConfigService.getConfiguration(configId);

  return `
WORLD: ${config.name}
MAGIC LEVEL: ${config.worldParameters.magicLevel}
TECHNOLOGY: ${config.worldParameters.technologyLevel}
SETTING: ${config.worldParameters.settingTheme}
  `.trim();
}
```

**3. Caching Context**
Cache built context strings to avoid rebuilding on every request:

```typescript
import { LRUCache } from "lru-cache";

const contextCache = new LRUCache<string, string>({
  max: 100, // Cache 100 contexts
  ttl: 1000 * 60 * 15, // 15 minute TTL
});

async function getCachedContext(configId: string) {
  let context = contextCache.get(configId);

  if (!context) {
    const result = await worldConfigService.buildAIContext(configId);
    context = result.context;
    contextCache.set(configId, context);
  }

  return context;
}
```

## Generation Examples

### Without World Config

**Prompt**:

```
Generate an NPC named "Thoran"
Race: Human
Class: Warrior
```

**Result**:

```
Name: Thoran
Race: Human
Class: Warrior
Description: A skilled warrior with a sword. He wears chainmail armor and has battle scars.
Background: Fought in many battles.
```

### With World Config

**Prompt** (with Nordgard context):

```
WORLD: Frozen Kingdoms of Nordgard
RACES: Human (Nordfolk) - Hardy, Stoic, value honor
FACTIONS: Northern Kingdom - Warrior-lords, defend borders
MAGIC: High
TECH: Medieval

Generate an NPC named "Thoran"
Race: Human
Class: Warrior
```

**Result**:

```
Name: Thoran Frostblade
Race: Human (Nordfolk)
Class: Warrior
Description: A battle-hardened warrior of the Northern Kingdom, trained in the ancient ice-forged blade techniques passed down through generations of warrior-lords. His weathered face bears the marks of countless battles fought in the frozen wastes, and his eyes hold the stoic determination characteristic of his people. He wears heavy furs over his armor, and his greatsword is etched with runes that glow faintly with frost magic.
Background: Son of a Northern Kingdom shield-captain, Thoran earned his blade-name "Frostblade" after single-handedly holding a mountain pass against Ice Reavers for three days during the Long Winter. He now serves as captain of the border patrol, defending the kingdom's northern frontier.
Personality: Stoic and honorable, speaks little but means every word. Values duty above all, but shows surprising kindness to those in need.
Skills: Northern Tactics, Ice Blade, Survival
```

## Best Practices

### 1. Configuration Design

**Keep Races Focused**:

- 3-5 distinctive races work better than 20 generic ones
- Emphasize unique traits that affect content generation
- Include cultural context that matters for storytelling

**Define Clear Faction Relationships**:

- Explicit allies/enemies help generate coherent conflicts
- Include faction goals for quest generation
- Alignment guides NPC behavior

**Build Coherent Skill Trees**:

- Prerequisites help AI understand power progression
- Categories organize abilities logically
- Descriptions should be clear and concise

### 2. Generation Integration

**Always Provide Fallback**:

```typescript
// Good - graceful fallback
const config = await worldConfigService.getActiveConfiguration(userId);
const context = config ? await buildContext(config.id) : "";

// Bad - fails if no config
const context = await buildContext(config.id); // Error if config is null
```

**Validate Context Size**:

```typescript
const { context, tokens } = await worldConfigService.buildAIContext(configId);

if (tokens > 2000) {
  console.warn("World context is large, consider optimizing");
}
```

**Log Context Usage**:

```typescript
// Track which configs are used for generation
await db.insert(generationLogs).values({
  userId,
  configId,
  generationType: "npc",
  contextTokens: tokens,
  timestamp: new Date(),
});
```

### 3. Testing Integration

**Test Without Config**:

```typescript
// Should still work with generic generation
const npc = await generateNPC({ name: "Test" }); // No config
expect(npc).toBeDefined();
expect(npc.name).toBe("Test");
```

**Test With Config**:

```typescript
// Should use config context
const config = await createTestConfig(userId);
const npc = await generateNPC({
  name: "Test",
  worldConfigId: config.id,
});
expect(npc.race).toBeOneOf(config.races.map((r) => r.name));
```

**Test Config Changes**:

```typescript
// Updates should reflect immediately
await worldConfigService.updateConfiguration(config.id, {
  races: [{ name: 'NewRace', ... }]
})

// Clear cache if using caching
contextCache.delete(config.id)

const npc = await generateNPC({ name: 'Test', worldConfigId: config.id })
expect(npc.race).toBe('NewRace')
```

## Troubleshooting

### Context Not Being Used

**Problem**: Generated content ignores world configuration

**Debug Steps**:

1. Verify configuration is marked as active:

   ```typescript
   const config = await worldConfigService.getActiveConfiguration(userId);
   console.log("Active config:", config?.name);
   ```

2. Check context is being built:

   ```typescript
   const { context } = await worldConfigService.buildAIContext(configId);
   console.log("Context length:", context.length);
   console.log("Context:", context);
   ```

3. Verify context reaches AI:

   ```typescript
   console.log("System prompt:", systemPrompt);
   // Should include world context at the beginning
   ```

4. Check AI model supports long context:
   ```typescript
   // If using GPT-3.5 with 4K context and config is 2K,
   // not much room for prompt + response
   // Solution: Use GPT-4 or optimize context
   ```

### Context Too Large

**Problem**: Token limit exceeded or slow generation

**Solutions**:

1. **Reduce description length**: Keep under 100 words each
2. **Remove unused entries**: Delete test factions/races
3. **Use selective context**: Only include relevant parts
4. **Split configurations**: Separate configs for different content types

### Inconsistent Results

**Problem**: Sometimes uses config, sometimes doesn't

**Causes**:

1. **Caching issues**: Old context cached
2. **Multiple configs**: User has multiple active configs (shouldn't happen)
3. **Race condition**: Config updated during generation

**Solutions**:

1. Implement cache invalidation on config updates
2. Enforce single active config per user
3. Use transactions when updating configs

## Advanced Techniques

### Dynamic Context Selection

Select different context based on generation type:

```typescript
function buildDynamicContext(config: WorldConfig, generationType: string) {
  switch (generationType) {
    case "npc":
      return buildNPCContext(config); // Races + factions
    case "quest":
      return buildQuestContext(config); // Factions + world params
    case "item":
      return buildItemContext(config); // World params only
    case "location":
      return buildLocationContext(config); // Factions + world params
    default:
      return buildFullContext(config);
  }
}
```

### Multi-Config Support

Support multiple configurations for different game modes:

```typescript
interface GenerationRequest {
  ...
  worldConfigIds?: string[] // Multiple configs for crossover content
}

// Merge contexts from multiple configs
async function buildMergedContext(configIds: string[]) {
  const contexts = await Promise.all(
    configIds.map(id => worldConfigService.buildAIContext(id))
  )

  return mergeContexts(contexts)
}
```

### Context Embeddings

Use vector embeddings for relevant context retrieval:

```typescript
// Store race descriptions as embeddings
await vectorStore.upsert({
  id: `race-${race.id}`,
  values: await embedText(race.description),
  metadata: { type: "race", configId, name: race.name },
});

// Retrieve relevant races for generation
const relevantRaces = await vectorStore.query({
  vector: await embedText(generationPrompt),
  topK: 3,
  filter: { type: "race", configId },
});
```

## Related Documentation

- [World Configuration User Guide](/dev-book/user-guide/world-configuration-advanced.md)
- [Content Generation API](/dev-book/api/content-generation.md)
- [AI Service Integration](/dev-book/developer/ai-integration.md)
- [Database Schema](/dev-book/developer/database-schema.md)
