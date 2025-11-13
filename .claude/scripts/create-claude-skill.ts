#!/usr/bin/env bun

/**
 * Script to create a Claude Skill folder structure
 * Usage: bun scripts/create-claude-skill.ts <skill-name> [display-name]
 */

import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

const skillName = process.argv[2];
const displayName = process.argv[3] || skillName.split("-").map(word => 
  word.charAt(0).toUpperCase() + word.slice(1)
).join(" ");

if (!skillName) {
  console.error("Usage: bun scripts/create-claude-skill.ts <skill-name> [display-name]");
  console.error("Example: bun scripts/create-claude-skill.ts generate-npc-dialogue \"Generate NPC Dialogue\"");
  process.exit(1);
}

// Validate skill name format
if (!/^[a-z0-9-]+$/.test(skillName)) {
  console.error("Error: Skill name must be lowercase with hyphens only (e.g., 'generate-npc-dialogue')");
  process.exit(1);
}

const skillDir = join(process.cwd(), "claude-skills", skillName);
const skillFile = join(skillDir, "SKILL.md");

const skillTemplate = `---
name: ${skillName}
description: [Describe what this skill does and when to use it - max 2 sentences]
---

# ${displayName}

## Instructions

[Provide detailed, step-by-step instructions for Claude to follow. Be specific, actionable, and include edge cases.]

## Examples

[Include 3-5 concrete examples showing the skill in action. Include input/output pairs.]

## Notes

[Optional: Additional context, limitations, or tips]
`;

async function createSkill() {
  try {
    // Create directory
    await mkdir(skillDir, { recursive: true });
    console.log(`✓ Created directory: ${skillDir}`);

    // Create SKILL.md file
    await writeFile(skillFile, skillTemplate, "utf-8");
    console.log(`✓ Created SKILL.md: ${skillFile}`);

    console.log("\n✓ Skill structure created successfully!");
    console.log(`\nNext steps:`);
    console.log(`1. Edit ${skillFile}`);
    console.log(`2. Fill in the description, instructions, and examples`);
    console.log(`3. Test the skill in Claude`);
    console.log(`4. Zip the folder: cd claude-skills && zip -r ${skillName}.zip ${skillName}/`);
    console.log(`5. Upload to Claude: Settings > Capabilities > Skills > Upload skill`);
  } catch (error) {
    console.error("Error creating skill:", error);
    process.exit(1);
  }
}

createSkill();


