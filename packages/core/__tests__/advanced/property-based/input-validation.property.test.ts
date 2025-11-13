/**
 * Property-Based Testing - Input Validation
 *
 * Uses fast-check to generate random inputs and test properties that
 * should always hold true, regardless of input. This helps find edge
 * cases that manual testing might miss.
 *
 * Run with: bun test __tests__/advanced/property-based
 */

import { describe, it, expect } from "bun:test";
import * as fc from "fast-check";

describe("Property-Based Testing - Input Validation", () => {
  describe("Asset ID Generation", () => {
    /**
     * Property: Asset IDs should always be valid identifiers
     * - No spaces
     * - Only alphanumeric and hyphens
     * - Start with letter
     * - Lowercase
     */
    it("should always generate valid asset IDs from any input", () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 100 }), (input) => {
          const assetId = generateAssetId(input);

          // Property 1: Must be non-empty
          expect(assetId.length).toBeGreaterThan(0);

          // Property 2: Must be lowercase
          expect(assetId).toBe(assetId.toLowerCase());

          // Property 3: Must only contain valid characters
          expect(assetId).toMatch(/^[a-z0-9-]+$/);

          // Property 4: No consecutive hyphens
          expect(assetId).not.toMatch(/--/);

          // Property 5: No leading/trailing hyphens
          expect(assetId).not.toMatch(/^-|-$/);
        }),
        { numRuns: 1000 }, // Run 1000 random test cases
      );
    });

    it("should be idempotent - same input produces same output", () => {
      fc.assert(
        fc.property(fc.string(), (input) => {
          const id1 = generateAssetId(input);
          const id2 = generateAssetId(input);
          expect(id1).toBe(id2);
        }),
      );
    });

    it("should handle unicode characters safely", () => {
      fc.assert(
        fc.property(fc.string(), (input) => {
          const assetId = generateAssetId(input);
          // Should still produce valid ASCII identifier
          expect(assetId).toMatch(/^[a-z0-9-]*$/);
        }),
      );
    });
  });

  describe("Prompt Sanitization", () => {
    /**
     * Property: Sanitized prompts should never contain dangerous content
     */
    it("should always remove SQL injection attempts", () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.constantFrom(
            "'; DROP TABLE",
            "1' OR '1'='1",
            "admin'--",
            "1; DELETE FROM",
          ),
          (validText, injectionAttempt) => {
            const prompt = `${validText} ${injectionAttempt}`;
            const sanitized = sanitizePrompt(prompt);

            // Property: Should not contain SQL keywords
            expect(sanitized.toUpperCase()).not.toMatch(/DROP\s+TABLE/);
            expect(sanitized.toUpperCase()).not.toMatch(/DELETE\s+FROM/);
            expect(sanitized).not.toMatch(/--/);
          },
        ),
      );
    });

    it("should always limit prompt length", () => {
      fc.assert(
        fc.property(fc.string({ minLength: 0, maxLength: 10000 }), (input) => {
          const sanitized = sanitizePrompt(input);
          expect(sanitized.length).toBeLessThanOrEqual(2000); // Max prompt length
        }),
      );
    });

    it("should preserve alphanumeric content", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter((s) => /^[a-zA-Z0-9 ]+$/.test(s)),
          (validInput) => {
            const sanitized = sanitizePrompt(validInput);
            // Should preserve normal text (or at least not throw)
            expect(sanitized).toBeDefined();
            if (validInput.trim().length > 0) {
              expect(sanitized.length).toBeGreaterThan(0);
            }
          },
        ),
      );
    });
  });

  describe("Material Preset Validation", () => {
    /**
     * Property: Valid material presets should always pass validation
     */
    it("should validate material preset structure", () => {
      const materialPresetArbitrary = fc.record({
        id: fc.stringMatching(/^[a-z0-9-]+$/),
        displayName: fc.string({ minLength: 1, maxLength: 50 }),
        category: fc.constantFrom(
          "metal",
          "wood",
          "stone",
          "fabric",
          "magical",
        ),
        tier: fc.integer({ min: 1, max: 10 }),
        color: fc.stringMatching(/^#[0-9A-Fa-f]{6}$/),
        stylePrompt: fc.string({ minLength: 10, maxLength: 200 }),
      });

      fc.assert(
        fc.property(materialPresetArbitrary, (preset) => {
          const isValid = validateMaterialPreset(preset);
          expect(isValid).toBe(true);

          // Properties that must hold
          expect(preset.tier).toBeGreaterThanOrEqual(1);
          expect(preset.tier).toBeLessThanOrEqual(10);
          expect(preset.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
        }),
      );
    });
  });

  describe("Pipeline Configuration", () => {
    /**
     * Property: Pipeline configs with invalid data should fail gracefully
     */
    it("should handle arbitrary pipeline configurations", () => {
      const pipelineConfigArbitrary = fc.record({
        description: fc.string({ minLength: 1, maxLength: 500 }),
        type: fc.constantFrom(
          "character",
          "weapon",
          "armor",
          "prop",
          "vehicle",
        ),
        subtype: fc.string({ minLength: 1, maxLength: 50 }),
        quality: fc.constantFrom("standard", "high", "ultra"),
        enableRigging: fc.boolean(),
        enableRetexturing: fc.boolean(),
      });

      fc.assert(
        fc.property(pipelineConfigArbitrary, (config) => {
          const errors = validatePipelineConfig(config);

          // Property: Validation should never throw
          expect(() => validatePipelineConfig(config)).not.toThrow();

          // Property: If character type, rigging should be allowed
          if (config.type === "character") {
            expect(errors).not.toContain("RIGGING_NOT_SUPPORTED");
          }
        }),
      );
    });
  });

  describe("File Path Construction", () => {
    /**
     * Property: File paths should always be safe and valid
     */
    it("should prevent path traversal attacks", () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.constantFrom("../", "../../", "./", ".\\", "..\\"),
          (filename, traversal) => {
            const maliciousPath = `${traversal}${filename}`;
            const safePath = sanitizeFilePath(maliciousPath);

            // Property: Should not contain path traversal
            expect(safePath).not.toMatch(/\.\./);
            expect(safePath).not.toMatch(/\/\//);
            expect(safePath).not.toMatch(/\\/);
          },
        ),
      );
    });

    it("should always produce valid file paths", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom(".glb", ".png", ".json", ".txt"),
          (basename, extension) => {
            const path = constructAssetPath(basename, extension);

            // Properties
            expect(path).toMatch(/^[a-z0-9-_/]+\.(glb|png|json|txt)$/i);
            expect(path).not.toMatch(/\.\./);
            expect(path).not.toMatch(/\/\//);
          },
        ),
      );
    });
  });

  describe("Numeric Validation", () => {
    /**
     * Property: Numeric validations should handle all number types
     */
    it("should validate polycount ranges", () => {
      fc.assert(
        fc.property(fc.integer(), (polycount) => {
          const normalized = normalizePolycount(polycount);

          // Property 1: Always returns non-negative number
          expect(normalized).toBeGreaterThanOrEqual(0);

          // Property 2: Clamps to reasonable range
          expect(normalized).toBeLessThanOrEqual(100000);

          // Property 3: Either 0 or above minimum threshold
          if (normalized > 0) {
            expect(normalized).toBeGreaterThanOrEqual(1000);
          }
        }),
      );
    });

    it("should validate texture resolutions", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100000 }), (resolution) => {
          const normalized = normalizeTextureResolution(resolution);

          // Property: Always power of 2
          expect(Math.log2(normalized) % 1).toBe(0);

          // Property: Within valid range
          expect(normalized).toBeGreaterThanOrEqual(512);
          expect(normalized).toBeLessThanOrEqual(4096);
        }),
      );
    });
  });
});

// ==================== Helper Functions ====================
// These are simplified versions for testing - real implementations
// would be in the actual service files

function generateAssetId(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-+/g, "-") || "asset"
  );
}

function sanitizePrompt(prompt: string): string {
  // Remove SQL injection patterns
  let sanitized = prompt
    .replace(/('|"|;|--)/g, "")
    .replace(/\b(DROP|DELETE|INSERT|UPDATE|SELECT)\s+/gi, "");

  // Limit length
  if (sanitized.length > 2000) {
    sanitized = sanitized.slice(0, 2000);
  }

  return sanitized.trim();
}

function validateMaterialPreset(preset: any): boolean {
  return (
    typeof preset.id === "string" &&
    typeof preset.displayName === "string" &&
    typeof preset.category === "string" &&
    typeof preset.tier === "number" &&
    preset.tier >= 1 &&
    preset.tier <= 10 &&
    /^#[0-9A-Fa-f]{6}$/.test(preset.color)
  );
}

function validatePipelineConfig(config: any): string[] {
  const errors: string[] = [];

  if (!config.description || config.description.length === 0) {
    errors.push("DESCRIPTION_REQUIRED");
  }

  if (config.type === "weapon" && config.enableRigging) {
    errors.push("RIGGING_NOT_SUPPORTED");
  }

  return errors;
}

function sanitizeFilePath(path: string): string {
  return path
    .replace(/\.\./g, "")
    .replace(/[\\]/g, "/")
    .replace(/\/+/g, "/")
    .replace(/^\/+/, "");
}

function constructAssetPath(basename: string, extension: string): string {
  const safe = generateAssetId(basename);
  return `assets/${safe}/${safe}${extension}`;
}

function normalizePolycount(polycount: number): number {
  if (polycount < 0) return 0;
  if (polycount < 1000) return 0; // Too low to be useful
  if (polycount > 100000) return 100000; // Clamp maximum
  return polycount;
}

function normalizeTextureResolution(resolution: number): number {
  // Round to nearest power of 2
  const log2 = Math.log2(resolution);
  const rounded = Math.pow(2, Math.round(log2));

  // Clamp to valid range
  if (rounded < 512) return 512;
  if (rounded > 4096) return 4096;

  return rounded;
}
