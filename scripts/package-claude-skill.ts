#!/usr/bin/env bun

/**
 * Script to package a Claude Skill into a ZIP file ready for upload
 * Usage: bun scripts/package-claude-skill.ts <skill-name>
 */

import { existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const skillName = process.argv[2];

if (!skillName) {
  console.error("Usage: bun scripts/package-claude-skill.ts <skill-name>");
  console.error("Example: bun scripts/package-claude-skill.ts generate-npc-dialogue");
  process.exit(1);
}

const skillDir = join(process.cwd(), "claude-skills", skillName);
const skillFile = join(skillDir, "SKILL.md");
const zipFile = join(process.cwd(), "claude-skills", `${skillName}.zip`);

async function packageSkill() {
  try {
    // Check if skill directory exists
    if (!existsSync(skillDir)) {
      console.error(`Error: Skill directory not found: ${skillDir}`);
      process.exit(1);
    }

    // Check if SKILL.md exists
    if (!existsSync(skillFile)) {
      console.error(`Error: SKILL.md not found in: ${skillDir}`);
      process.exit(1);
    }

    // Create ZIP file
    const cwd = join(process.cwd(), "claude-skills");
    execSync(`cd "${cwd}" && zip -r "${skillName}.zip" "${skillName}/"`, {
      stdio: "inherit"
    });

    console.log(`\n✓ Skill packaged successfully: ${zipFile}`);
    console.log(`\nNext step: Upload to Claude`);
    console.log(`Settings > Capabilities > Skills > Upload skill`);
  } catch (error) {
    console.error("Error packaging skill:", error);
    process.exit(1);
  }
}

packageSkill();


