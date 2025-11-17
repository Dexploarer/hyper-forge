/**
 * Console.log Migration Script
 * Automatically migrates console.log/error/warn to structured Pino logger
 *
 * Usage: bun run scripts/migrate-console-to-logger.ts
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

// Stats tracking
let filesProcessed = 0;
let filesModified = 0;
let consoleCalls = 0;
let consoleCallsMigrated = 0;

/**
 * Recursively find all TypeScript files in a directory
 */
function findTsFiles(dir: string): string[] {
  const files: string[] = [];
  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip node_modules and dist directories
      if (!item.startsWith(".") && item !== "node_modules" && item !== "dist") {
        files.push(...findTsFiles(fullPath));
      }
    } else if (item.endsWith(".ts") && !item.endsWith(".test.ts")) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Count console calls in content
 */
function countConsoleCalls(content: string): number {
  const matches = content.match(/console\.(log|error|warn|info|debug)/g);
  return matches ? matches.length : 0;
}

/**
 * Determine the correct import path for logger
 */
function getLoggerImportPath(filePath: string): string {
  const depth = filePath.split("/server/").pop()?.split("/").length || 1;
  const prefix = "../".repeat(depth - 1);
  return `${prefix}utils/logger`;
}

/**
 * Migrate console calls to logger in a file
 */
function migrateFile(filePath: string): boolean {
  filesProcessed++;

  let content = readFileSync(filePath, "utf-8");
  const originalContent = content;
  const beforeCount = countConsoleCalls(content);

  if (beforeCount === 0) {
    return false;
  }

  consoleCalls += beforeCount;

  // Check if logger is already imported
  const hasLoggerImport =
    content.includes('from "./utils/logger"') ||
    content.includes('from "../utils/logger"') ||
    content.includes('from "../../utils/logger"') ||
    content.includes('from "../../../utils/logger"') ||
    content.includes('from "../../../../utils/logger"');

  // Add logger import if not present
  if (!hasLoggerImport) {
    const importPath = getLoggerImportPath(filePath);
    const firstImportMatch = content.match(/^import .* from .*$/m);

    if (firstImportMatch) {
      // Add after first import
      const insertPos = firstImportMatch.index! + firstImportMatch[0].length;
      content =
        content.slice(0, insertPos) +
        `\nimport { logger } from '${importPath}';` +
        content.slice(insertPos);
    } else {
      // Add at top of file
      content = `import { logger } from '${importPath}';\n\n${content}`;
    }
  }

  // Migration patterns
  const patterns: Array<{ from: RegExp; to: string; desc: string }> = [
    // console.log with template literal containing [Context]
    {
      from: /console\.log\(`\[([^\]]+)\] ([^`]*)`([^)]*)\)/g,
      to: "logger.info({ context: '$1'$3 }, '$2')",
      desc: "Template literal with [Context]",
    },
    // console.log with template literal
    {
      from: /console\.log\(`([^`]*)`([^)]*)\)/g,
      to: "logger.info({$2 }, '$1')",
      desc: "Template literal",
    },
    // console.log with string literal
    {
      from: /console\.log\("([^"]*)"([^)]*)\)/g,
      to: "logger.info({$2 }, '$1')",
      desc: "String literal",
    },
    // console.log with single argument variable
    {
      from: /console\.log\(([a-zA-Z_][a-zA-Z0-9_]*)\)/g,
      to: "logger.info({ data: $1 }, 'Log output')",
      desc: "Single variable",
    },
    // console.error with error object and message
    {
      from: /console\.error\("([^"]*)",\s*([^)]+)\)/g,
      to: "logger.error({ err: $2 }, '$1')",
      desc: "Error with message",
    },
    // console.error with template literal and error
    {
      from: /console\.error\(`([^`]*)`([^)]*)\)/g,
      to: "logger.error({$2 }, '$1')",
      desc: "Error template literal",
    },
    // console.error with string literal
    {
      from: /console\.error\("([^"]*)"\)/g,
      to: "logger.error('$1')",
      desc: "Error string literal",
    },
    // console.warn with template literal
    {
      from: /console\.warn\(`([^`]*)`([^)]*)\)/g,
      to: "logger.warn({$2 }, '$1')",
      desc: "Warn template literal",
    },
    // console.warn with string literal
    {
      from: /console\.warn\("([^"]*)"([^)]*)\)/g,
      to: "logger.warn({$2 }, '$1')",
      desc: "Warn string literal",
    },
    // console.info (rare)
    {
      from: /console\.info\("([^"]*)"([^)]*)\)/g,
      to: "logger.info({$2 }, '$1')",
      desc: "Info literal",
    },
    // console.debug (rare)
    {
      from: /console\.debug\("([^"]*)"([^)]*)\)/g,
      to: "logger.debug({$2 }, '$1')",
      desc: "Debug literal",
    },
  ];

  // Apply migrations
  for (const { from, to } of patterns) {
    content = content.replace(from, to);
  }

  const afterCount = countConsoleCalls(content);
  const migrated = beforeCount - afterCount;

  if (content !== originalContent) {
    writeFileSync(filePath, content);
    filesModified++;
    consoleCallsMigrated += migrated;

    const remaining = afterCount > 0 ? ` (${afterCount} remaining)` : "";
    console.log(`✅ ${filePath}: ${migrated} migrated${remaining}`);
    return true;
  }

  return false;
}

/**
 * Main execution
 */
async function main() {
  const rootDir = join(process.cwd(), "apps/core/server");

  console.log("🔍 Searching for TypeScript files...");
  const tsFiles = findTsFiles(rootDir);
  console.log(`📁 Found ${tsFiles.length} TypeScript files\n`);

  // Priority files first (most console calls)
  const priorityPatterns = [
    "services/GenerationService.ts",
    "services/ContentGenerationService.ts",
    "api-elysia.ts",
    "services/CDNWebSocketService.ts",
    "routes/",
  ];

  const priorityFiles = tsFiles.filter((file) =>
    priorityPatterns.some((pattern) => file.includes(pattern)),
  );
  const otherFiles = tsFiles.filter(
    (file) => !priorityPatterns.some((pattern) => file.includes(pattern)),
  );

  console.log("🚀 Migrating priority files first...\n");

  // Migrate priority files
  for (const file of priorityFiles) {
    try {
      migrateFile(file);
    } catch (error) {
      console.error(`❌ Error migrating ${file}:`, error);
    }
  }

  console.log("\n📦 Migrating remaining files...\n");

  // Migrate other files
  for (const file of otherFiles) {
    try {
      migrateFile(file);
    } catch (error) {
      console.error(`❌ Error migrating ${file}:`, error);
    }
  }

  // Report
  console.log("\n" + "=".repeat(60));
  console.log("📊 MIGRATION REPORT");
  console.log("=".repeat(60));
  console.log(`Files processed:        ${filesProcessed}`);
  console.log(`Files modified:         ${filesModified}`);
  console.log(`Console calls found:    ${consoleCalls}`);
  console.log(`Console calls migrated: ${consoleCallsMigrated}`);
  console.log(
    `Console calls remaining: ${consoleCalls - consoleCallsMigrated}`,
  );
  console.log("=".repeat(60));

  if (consoleCalls - consoleCallsMigrated > 0) {
    console.log(
      "\n⚠️  Some console calls could not be automatically migrated.",
    );
    console.log("    These require manual review (complex patterns).");
  } else {
    console.log("\n✨ All console calls successfully migrated!");
  }
}

// Run migration
main().catch(console.error);
