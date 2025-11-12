# Advanced World Configuration

## Overview

World Configuration allows you to define rich, detailed game worlds that automatically enhance AI content generation. When you configure races, factions, skills, and lore, the AI uses this context to generate more coherent and setting-appropriate content.

**Key Benefit**: Instead of generic fantasy assets, you get content tailored to YOUR specific game world.

## Using Templates

Templates provide pre-built configurations for common game genres, saving you hours of setup time.

### Available Templates

Asset-Forge includes several professional templates:

**Fantasy Medieval**

- Classic high fantasy setting
- Traditional races (Humans, Elves, Dwarves, Orcs)
- Medieval factions (Kingdoms, Guilds, Orders)
- Magic and combat skills
- Feudal society structure

**Sci-Fi Space**

- Space exploration setting
- Alien races and human variants
- Corporate and military factions
- Advanced technology skills
- Interstellar politics

**Post-Apocalyptic**

- Survival setting
- Mutated variants and survivor groups
- Wasteland factions (Raiders, Settlers, Nomads)
- Scavenging and survival skills
- Resource-driven conflicts

**Modern Urban Fantasy**

- Contemporary setting with magic
- Supernatural races hidden in society
- Secret organizations
- Modern and mystical skills
- Hidden world dynamics

**Cyberpunk**

- High-tech dystopia
- Augmented humans and AI
- Mega-corporations and street gangs
- Hacking and combat skills
- Corporate warfare

### Creating from Template

1. Navigate to **World Configuration** page
2. Click the **Templates** tab
3. Browse available templates with preview cards
4. Click **"Preview"** to see full template details
5. Click **"Use This Template"** button
6. Enter a name for your configuration (e.g., "My Fantasy World")
7. Optionally add a description
8. Click **"Create from Template"**

The system will:

- Copy all template data
- Create a new configuration with your name
- Set it as your active configuration
- Redirect you to edit the configuration

### Customizing Templates

After creating from a template:

1. **Modify Races**: Add your unique races or modify existing ones
2. **Adjust Factions**: Rename factions to match your lore
3. **Update Skills**: Add game-specific abilities
4. **Refine Lore**: Update cultural backgrounds
5. **Set Parameters**: Adjust world rules (magic level, tech level, etc.)

**Tip**: Templates are starting points. Don't be afraid to heavily customize them!

## Importing Configurations

You can import world configurations from JSON files, useful for:

- Sharing configurations between team members
- Backing up your configurations
- Migrating from other tools
- Version control of world data

### JSON Import

1. Click the **Import** tab on the World Configuration page
2. Click **"Select File"** or drag-and-drop a JSON file
3. The system validates the file format
4. A preview appears showing what will be imported
5. Review the preview for accuracy
6. Enter a name for the imported configuration
7. Click **"Import Configuration"**

### JSON Format

World configuration JSON follows this structure:

```json
{
  "name": "My World",
  "description": "A unique fantasy setting",
  "isActive": false,
  "races": [
    {
      "id": "human",
      "name": "Human",
      "description": "Versatile and adaptable",
      "traits": ["Adaptable", "Ambitious"],
      "culturalBackground": "Diverse cultures spanning continents"
    }
  ],
  "factions": [
    {
      "id": "kingdom-north",
      "name": "Northern Kingdom",
      "description": "Noble warriors of the frozen north",
      "alignment": "Lawful Good",
      "goals": ["Protect the realm", "Preserve traditions"],
      "allies": ["guild-mages"],
      "enemies": ["horde-orc"]
    }
  ],
  "skills": [
    {
      "id": "swordsmanship",
      "name": "Swordsmanship",
      "description": "Master the blade",
      "category": "Combat",
      "prerequisites": []
    }
  ],
  "worldParameters": {
    "magicLevel": "high",
    "technologyLevel": "medieval",
    "conflictIntensity": "moderate",
    "settingTheme": "high-fantasy"
  }
}
```

### Export Format

When you export a configuration, it includes:

- **Metadata**: Name, description, creation date, version
- **Races**: All race definitions with traits and backgrounds
- **Factions**: All factions with relationships (allies/enemies)
- **Skills**: Complete skill tree with prerequisites
- **World Parameters**: All setting rules and parameters
- **Lore**: Cultural notes and background information

### Exporting Configurations

To export your world configuration:

1. Open the configuration you want to export
2. Click the **"Export"** button in the top right
3. A JSON file downloads automatically
4. File name format: `world-config-[name]-[date].json`

**Use Cases:**

- Backup before major changes
- Share with team members
- Version control in Git
- Create variants of your world

### Import Validation

The import system validates:

- **JSON Syntax**: Must be valid JSON
- **Required Fields**: Name, description, races array
- **Data Types**: Correct types for all fields
- **References**: Faction allies/enemies must exist
- **IDs**: Must be unique within each category

**If Validation Fails:**

- Error message explains the issue
- Line numbers provided for JSON syntax errors
- Specific field names shown for data errors
- Import is blocked until fixed

## Configuration History

Track all changes made to your configurations over time.

### Viewing History

1. Open a world configuration
2. Click the **"History"** button in the toolbar
3. A timeline appears showing all changes

### History Timeline

Each history entry shows:

- **Timestamp**: When the change occurred
- **User**: Who made the change
- **Change Type**: What was modified (e.g., "Added Race", "Modified Faction")
- **Details**: Specific changes made
- **Version Number**: Auto-incrementing version

**Example Timeline:**

```
v1.3 - 2025-11-12 10:30 AM - You
  Added faction "Shadow Council"

v1.2 - 2025-11-11 3:45 PM - You
  Modified race "Elf" description
  Added trait "Night Vision" to Elves

v1.1 - 2025-11-10 9:00 AM - TeamMember
  Added skill "Stealth"
  Updated world parameter: magicLevel = "high"

v1.0 - 2025-11-09 2:15 PM - You
  Initial configuration created from Fantasy template
```

### Reverting Changes

To revert to a previous version:

1. View configuration history
2. Find the version you want to restore
3. Click **"Restore This Version"**
4. Confirm the action
5. Current configuration is backed up before restoration

**Warning**: Reverting overwrites current data. The system creates a backup automatically.

### Comparing Versions

1. Select two versions from the history
2. Click **"Compare"**
3. A diff view shows:
   - Added items (green)
   - Removed items (red)
   - Modified items (yellow)
   - Unchanged items (gray)

**Useful for:**

- Reviewing teammate changes
- Identifying when bugs were introduced
- Understanding configuration evolution

## Validation

Before saving, configurations are validated to ensure data integrity and AI compatibility.

### Validation Indicators

**Green Check (✓)**

- No issues found
- Safe to save and use
- AI will generate high-quality results

**Yellow Warning (⚠️)**

- Possible issues detected
- May affect AI generation quality
- Can save, but review recommended

**Red Error (✗)**

- Critical issues found
- Must fix before saving
- AI generation may fail or produce poor results

### Validation Rules

**Race Validation:**

- Must have unique ID
- Must have name and description
- Traits array can't be empty
- Cultural background should be detailed (warning if under 50 characters)

**Faction Validation:**

- Must have unique ID
- Must have name, description, alignment
- Allies and enemies must reference existing faction IDs
- Can't be allied and enemy with same faction
- Should have at least one goal

**Skill Validation:**

- Must have unique ID
- Must have name, description, category
- Prerequisites must reference existing skill IDs
- No circular dependencies in skill trees
- Category must be valid (Combat, Magic, Crafting, Social, etc.)

**World Parameters Validation:**

- Magic level must be: none, low, moderate, high
- Technology level must be: primitive, medieval, renaissance, industrial, modern, futuristic
- Conflict intensity must be: low, moderate, high
- Setting theme must be valid theme string

### Common Validation Errors

**"Duplicate ID detected"**

- Problem: Two items have the same ID
- Fix: Change one ID to be unique
- Example: Two races both have ID "human"

**"Referenced faction does not exist"**

- Problem: Ally/enemy references non-existent faction
- Fix: Remove reference or create the missing faction
- Example: "allies": ["guild-mages"] but no faction with ID "guild-mages"

**"Circular skill dependency detected"**

- Problem: Skill prerequisites form a loop
- Fix: Remove one prerequisite to break the cycle
- Example: Skill A requires Skill B, which requires Skill A

**"Empty required field"**

- Problem: Required field is blank
- Fix: Provide a value
- Example: Race has no name

**"Invalid parameter value"**

- Problem: World parameter has invalid value
- Fix: Use one of the allowed values
- Example: magicLevel = "super-high" (should be "high")

### Fixing Validation Errors

**Method 1: Click to Jump**

1. Click on an error in the validation panel
2. The form automatically scrolls to the problematic field
3. The field highlights in red
4. Fix the issue
5. Validation re-runs automatically

**Method 2: Validation Panel**

1. Open the validation panel (always visible when errors exist)
2. Review all errors listed
3. Click "Show Details" for more information
4. Fix each issue in order
5. Panel updates in real-time

**Method 3: Batch Fix**
For multiple similar errors:

1. Note the pattern (e.g., multiple missing descriptions)
2. Use the "Bulk Edit" feature
3. Apply fix to all affected items at once

### Validation Best Practices

**Before Saving:**

- Always check validation status
- Fix all errors (red)
- Review all warnings (yellow)
- Test with a sample AI generation

**Regular Validation:**

- Run validation after major changes
- Check validation when importing
- Validate after team member edits

**Preventive Validation:**

- Use descriptive IDs (e.g., "faction-mages" not "f1")
- Keep references consistent
- Document complex relationships
- Plan skill trees before implementing

## Integration with Content Generation

When you have an active world configuration, AI content generation automatically becomes smarter and more consistent.

### How It Works

**1. Context Injection**
Your world configuration is automatically included in AI prompts:

- System message includes world overview
- Race traits inform NPC characteristics
- Faction relationships affect quest generation
- Skills influence ability descriptions

**2. Consistency Enforcement**
AI generates content that:

- Respects your world's magic level
- Matches your technology level
- Aligns with faction relationships
- Uses your defined races and skills

**3. Quality Enhancement**
With world context, AI produces:

- More detailed descriptions
- Better internal consistency
- Appropriate cultural references
- Setting-specific terminology

### Generation Types Enhanced

**NPC Generation**

- Uses configured races
- Respects cultural backgrounds
- References appropriate factions
- Assigns relevant skills

**Quest Generation**

- Involves configured factions
- Reflects world conflicts
- Uses setting-appropriate rewards
- References world lore

**Dialogue Generation**

- Matches race speech patterns
- Reflects faction alignments
- Uses cultural context
- Maintains tone consistency

**Item Generation**

- Matches technology level
- Reflects magic level
- Uses cultural aesthetics
- Appropriate for factions

**Location Generation**

- Consistent with world geography
- Reflects faction territories
- Appropriate architecture
- Setting-specific details

### Using Configuration in Generation

**Automatic (Recommended):**
When you have an active configuration, it's used automatically:

```typescript
// Just generate normally
await generateNPC({
  name: "Village Elder",
  race: "human", // Uses your human race definition
});
```

**Explicit (Advanced):**
Specify a configuration by ID:

```typescript
await generateNPC({
  name: "Village Elder",
  race: "human",
  worldConfigId: "my-config-id", // Use specific config
});
```

**No Configuration:**
Generation still works, but produces generic content:

```typescript
// No active config = generic fantasy
await generateNPC({
  name: "Village Elder",
});
```

### Testing Configuration Impact

To see how your configuration affects generation:

1. Generate sample content WITHOUT configuration active
2. Activate your configuration
3. Generate similar content WITH configuration active
4. Compare the results

**Example:**

Without config:

```
Name: Thoran
Race: Human
Description: A skilled warrior with a sword.
```

With config (Northern Kingdom setting):

```
Name: Thoran Frostblade
Race: Human (Northern Clans)
Description: A battle-hardened warrior of the Northern Kingdom,
trained in the ancient ice-forged blade techniques. His armor bears
the wolf sigil of the Frostguard, and he speaks with the stoic
determination of his people.
```

### Configuration Coverage

**Full Coverage (Best Results):**

- Detailed race descriptions
- Complete faction network
- Comprehensive skill tree
- Rich cultural notes
- Specific world parameters

**Partial Coverage (Good Results):**

- Basic races defined
- Key factions included
- Major skills listed
- General world parameters

**Minimal Coverage (Improved Results):**

- At least one race
- At least one faction
- World parameters set

**No Coverage (Generic Results):**

- No configuration active
- AI uses default fantasy assumptions

## Advanced Techniques

### Branching Configurations

Create variants of your world for different game modes:

1. Export your base configuration
2. Import it with a new name
3. Modify for the specific variant
4. Switch between them as needed

**Example Variants:**

- "Medieval Fantasy - Combat Focus"
- "Medieval Fantasy - Intrigue Focus"
- "Medieval Fantasy - Magic Focus"

### Team Collaboration

When working with a team:

1. **Designate a Configuration Owner**: One person manages the master configuration
2. **Use Export/Import**: Share via JSON files in version control
3. **Version Naming**: Use semantic versioning (v1.0, v1.1, v2.0)
4. **Change Log**: Document major changes in configuration description
5. **Review Process**: Have team review before activating new versions

### Configuration Migration

When evolving your configuration:

1. **Test First**: Create a copy, test changes
2. **Gradual Changes**: Don't overhaul everything at once
3. **Validate Often**: Check validation after each change
4. **Generate Samples**: Test with AI generation
5. **Keep Backups**: Export before major changes

### Performance Optimization

For large configurations (100+ items):

- Use clear, concise descriptions (AI processes these)
- Remove unused races/factions
- Simplify skill trees
- Archive old versions
- Split into multiple configs if needed

## Troubleshooting

### AI Generated Generic Content

**Problem**: Active configuration, but AI ignores it

**Solutions:**

1. Check configuration is marked as "Active"
2. Verify all required fields are filled
3. Run validation to find errors
4. Ensure race/faction names match what you're requesting
5. Add more detail to descriptions (AI needs context)

### Configuration Won't Save

**Problem**: Save button disabled or fails

**Solutions:**

1. Check for red validation errors
2. Ensure all required fields filled
3. Fix any duplicate IDs
4. Check for invalid characters in IDs
5. Try exporting to see if JSON is valid

### Import Failed

**Problem**: JSON file won't import

**Solutions:**

1. Validate JSON syntax in a JSON validator
2. Check file is actually JSON (not .txt)
3. Ensure required fields present
4. Remove any non-standard fields
5. Start with template export as reference

### Slow AI Generation

**Problem**: Generation takes longer with configuration active

**Explanation**: This is normal - more context = more processing

**Optimization:**

- Reduce description length (keep under 200 words each)
- Remove unnecessary details
- Focus on distinctive features
- Use clear, simple language

## Next Steps

- Learn about [NPC Generation with World Context](/dev-book/user-guide/npc-generation.md)
- Explore [Quest Generation](/dev-book/user-guide/quest-generation.md)
- Master [Dialogue Systems](/dev-book/user-guide/dialogue-generation.md)
- Advanced [World Building Techniques](/dev-book/user-guide/world-building-advanced.md)
