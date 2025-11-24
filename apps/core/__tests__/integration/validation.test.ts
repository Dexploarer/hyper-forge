/**
 * TypeBox Validation Edge Case Tests
 * Tests validation schemas across all routes
 * NO MOCKS - Real validation behavior
 *
 * NOTE: TypeBox's Value.Check does NOT validate string formats (email, uuid, uri, date-time)
 * by default. Format validation requires explicit format registration or use of TypeCompiler.
 * Tests here focus on structural validation that works out of the box.
 */

import { describe, it, expect } from "bun:test";
import { Type as t, TSchema, FormatRegistry } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

// Register common format validators for testing
// These are the same patterns Elysia uses internally
FormatRegistry.Set("email", (value) =>
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value),
);
FormatRegistry.Set("uuid", (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  ),
);
FormatRegistry.Set("uri", (value) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
});
FormatRegistry.Set("date-time", (value) => {
  const date = new Date(value);
  return !isNaN(date.getTime()) && value.includes("T");
});

describe("TypeBox Validation Edge Cases", () => {
  describe("String Validation", () => {
    it("should reject empty strings when required", () => {
      const schema = t.String({ minLength: 1 });
      const result = Value.Check(schema, "");

      expect(result).toBe(false);
    });

    it("should accept undefined when optional in object context", () => {
      // Optional types work in the context of object schemas
      const schema = t.Object({
        name: t.Optional(t.String()),
      });
      const result = Value.Check(schema, {});

      expect(result).toBe(true);
    });

    it("should enforce minLength boundaries", () => {
      const schema = t.String({ minLength: 5 });

      expect(Value.Check(schema, "1234")).toBe(false);
      expect(Value.Check(schema, "12345")).toBe(true);
      expect(Value.Check(schema, "123456")).toBe(true);
    });

    it("should enforce maxLength boundaries", () => {
      const schema = t.String({ maxLength: 10 });

      expect(Value.Check(schema, "1234567890")).toBe(true);
      expect(Value.Check(schema, "12345678901")).toBe(false);
    });

    it("should handle Unicode characters in length", () => {
      const schema = t.String({ maxLength: 5 });

      // Emoji count as 1-2 characters depending on composition
      expect(Value.Check(schema, "Hi 👋")).toBe(true);
      expect(Value.Check(schema, "👋👋👋👋👋👋")).toBe(false);
    });

    it("should validate email format", () => {
      const schema = t.String({ format: "email" });

      expect(Value.Check(schema, "valid@example.com")).toBe(true);
      expect(Value.Check(schema, "invalid-email")).toBe(false);
      expect(Value.Check(schema, "@example.com")).toBe(false);
      expect(Value.Check(schema, "user@")).toBe(false);
    });

    it("should validate UUID format", () => {
      const schema = t.String({ format: "uuid" });

      expect(Value.Check(schema, "123e4567-e89b-12d3-a456-426614174000")).toBe(
        true,
      );
      expect(Value.Check(schema, "not-a-uuid")).toBe(false);
      expect(Value.Check(schema, "123e4567-e89b-12d3-a456")).toBe(false);
    });

    it("should validate URL format", () => {
      const schema = t.String({ format: "uri" });

      expect(Value.Check(schema, "https://example.com")).toBe(true);
      expect(Value.Check(schema, "http://example.com/path?query=1")).toBe(true);
      expect(Value.Check(schema, "not-a-url")).toBe(false);
    });
  });

  describe("Number Validation", () => {
    it("should enforce minimum boundaries", () => {
      const schema = t.Number({ minimum: 0 });

      expect(Value.Check(schema, -1)).toBe(false);
      expect(Value.Check(schema, 0)).toBe(true);
      expect(Value.Check(schema, 1)).toBe(true);
    });

    it("should enforce maximum boundaries", () => {
      const schema = t.Number({ maximum: 100 });

      expect(Value.Check(schema, 99)).toBe(true);
      expect(Value.Check(schema, 100)).toBe(true);
      expect(Value.Check(schema, 101)).toBe(false);
    });

    it("should enforce exclusiveMinimum", () => {
      const schema = t.Number({ exclusiveMinimum: 0 });

      expect(Value.Check(schema, 0)).toBe(false);
      expect(Value.Check(schema, 0.1)).toBe(true);
    });

    it("should enforce exclusiveMaximum", () => {
      const schema = t.Number({ exclusiveMaximum: 100 });

      expect(Value.Check(schema, 99.9)).toBe(true);
      expect(Value.Check(schema, 100)).toBe(false);
    });

    it("should reject NaN values", () => {
      const schema = t.Number();

      expect(Value.Check(schema, NaN)).toBe(false);
    });

    it("should reject Infinity", () => {
      const schema = t.Number();

      expect(Value.Check(schema, Infinity)).toBe(false);
      expect(Value.Check(schema, -Infinity)).toBe(false);
    });

    it("should handle floating point precision", () => {
      const schema = t.Number({ minimum: 0, maximum: 1 });

      expect(Value.Check(schema, 0.1 + 0.2)).toBe(true); // ~0.30000000000000004
    });
  });

  describe("Object Validation", () => {
    it("should reject missing required fields", () => {
      const schema = t.Object({
        name: t.String(),
        age: t.Number(),
      });

      expect(Value.Check(schema, { name: "John" })).toBe(false);
      expect(Value.Check(schema, { name: "John", age: 25 })).toBe(true);
    });

    it("should allow optional fields to be missing", () => {
      const schema = t.Object({
        name: t.String(),
        age: t.Optional(t.Number()),
      });

      expect(Value.Check(schema, { name: "John" })).toBe(true);
      expect(Value.Check(schema, { name: "John", age: 25 })).toBe(true);
    });

    it("should handle deeply nested objects", () => {
      const schema = t.Object({
        user: t.Object({
          profile: t.Object({
            settings: t.Object({
              theme: t.String(),
            }),
          }),
        }),
      });

      expect(
        Value.Check(schema, {
          user: {
            profile: {
              settings: {
                theme: "dark",
              },
            },
          },
        }),
      ).toBe(true);

      expect(
        Value.Check(schema, {
          user: {
            profile: {
              settings: {},
            },
          },
        }),
      ).toBe(false);
    });

    it("should validate empty objects when allowed", () => {
      const schema = t.Object({});

      expect(Value.Check(schema, {})).toBe(true);
    });

    it("should reject additional properties by default in strict mode", () => {
      const schema = t.Object(
        {
          name: t.String(),
        },
        { additionalProperties: false },
      );

      expect(Value.Check(schema, { name: "John" })).toBe(true);
      expect(Value.Check(schema, { name: "John", extra: "field" })).toBe(false);
    });
  });

  describe("Array Validation", () => {
    it("should enforce array minItems", () => {
      const schema = t.Array(t.String(), { minItems: 2 });

      expect(Value.Check(schema, [])).toBe(false);
      expect(Value.Check(schema, ["one"])).toBe(false);
      expect(Value.Check(schema, ["one", "two"])).toBe(true);
    });

    it("should enforce array maxItems", () => {
      const schema = t.Array(t.String(), { maxItems: 3 });

      expect(Value.Check(schema, ["one", "two", "three"])).toBe(true);
      expect(Value.Check(schema, ["one", "two", "three", "four"])).toBe(false);
    });

    it("should validate array item types", () => {
      const schema = t.Array(t.Number());

      expect(Value.Check(schema, [1, 2, 3])).toBe(true);
      expect(Value.Check(schema, [1, "two", 3])).toBe(false);
    });

    it("should handle empty arrays", () => {
      const schema = t.Array(t.String());

      expect(Value.Check(schema, [])).toBe(true);
    });

    it("should validate nested array schemas", () => {
      const schema = t.Array(
        t.Object({
          id: t.Number(),
          name: t.String(),
        }),
      );

      expect(
        Value.Check(schema, [
          { id: 1, name: "one" },
          { id: 2, name: "two" },
        ]),
      ).toBe(true);

      expect(
        Value.Check(schema, [
          { id: 1, name: "one" },
          { id: "invalid", name: "two" },
        ]),
      ).toBe(false);
    });
  });

  describe("Union Types", () => {
    it("should accept any valid union member", () => {
      const schema = t.Union([t.String(), t.Number()]);

      expect(Value.Check(schema, "text")).toBe(true);
      expect(Value.Check(schema, 42)).toBe(true);
      expect(Value.Check(schema, true)).toBe(false);
    });

    it("should validate literal unions (enums)", () => {
      const schema = t.Union([
        t.Literal("admin"),
        t.Literal("member"),
        t.Literal("guest"),
      ]);

      expect(Value.Check(schema, "admin")).toBe(true);
      expect(Value.Check(schema, "member")).toBe(true);
      expect(Value.Check(schema, "invalid")).toBe(false);
    });

    it("should handle union of objects", () => {
      const schema = t.Union([
        t.Object({ type: t.Literal("user"), userId: t.String() }),
        t.Object({ type: t.Literal("guest"), sessionId: t.String() }),
      ]);

      expect(Value.Check(schema, { type: "user", userId: "123" })).toBe(true);
      expect(Value.Check(schema, { type: "guest", sessionId: "abc" })).toBe(
        true,
      );
      expect(Value.Check(schema, { type: "invalid", userId: "123" })).toBe(
        false,
      );
    });
  });

  describe("Date Validation", () => {
    it("should validate ISO date strings", () => {
      const schema = t.String({ format: "date-time" });

      expect(Value.Check(schema, "2024-01-01T00:00:00.000Z")).toBe(true);
      expect(Value.Check(schema, "invalid-date")).toBe(false);
    });

    it("should handle Date objects", () => {
      const schema = t.Date();

      expect(Value.Check(schema, new Date())).toBe(true);
      expect(Value.Check(schema, "2024-01-01")).toBe(false);
    });

    it("should reject invalid dates", () => {
      const schema = t.Date();

      expect(Value.Check(schema, new Date("invalid"))).toBe(false);
    });
  });

  describe("Null and Undefined", () => {
    it("should distinguish between null and undefined", () => {
      const nullSchema = t.Null();
      const undefinedSchema = t.Undefined();

      expect(Value.Check(nullSchema, null)).toBe(true);
      expect(Value.Check(nullSchema, undefined)).toBe(false);
      expect(Value.Check(undefinedSchema, undefined)).toBe(true);
      expect(Value.Check(undefinedSchema, null)).toBe(false);
    });

    it("should handle nullable types", () => {
      const schema = t.Union([t.String(), t.Null()]);

      expect(Value.Check(schema, "value")).toBe(true);
      expect(Value.Check(schema, null)).toBe(true);
      expect(Value.Check(schema, undefined)).toBe(false);
    });

    it("should handle optional types in object context", () => {
      // Optional works correctly within object schemas
      const schema = t.Object({
        name: t.Optional(t.String()),
      });

      expect(Value.Check(schema, { name: "value" })).toBe(true);
      expect(Value.Check(schema, {})).toBe(true);
      expect(Value.Check(schema, { name: null })).toBe(false);
    });
  });

  describe("Record Validation", () => {
    it("should validate record with string keys", () => {
      const schema = t.Record(t.String(), t.Number());

      expect(Value.Check(schema, { a: 1, b: 2 })).toBe(true);
      expect(Value.Check(schema, { a: "invalid" })).toBe(false);
    });

    it("should validate record with any value types", () => {
      const schema = t.Record(t.String(), t.Any());

      expect(
        Value.Check(schema, {
          str: "value",
          num: 42,
          bool: true,
          obj: {},
        }),
      ).toBe(true);
    });

    it("should handle empty records", () => {
      const schema = t.Record(t.String(), t.String());

      expect(Value.Check(schema, {})).toBe(true);
    });
  });

  describe("Complex Nested Schemas", () => {
    it("should validate deeply nested user profile schema", () => {
      const schema = t.Object({
        id: t.String({ format: "uuid" }),
        email: t.String({ format: "email" }),
        profile: t.Object({
          displayName: t.String({ minLength: 1, maxLength: 50 }),
          avatar: t.Optional(t.String({ format: "uri" })),
          settings: t.Record(t.String(), t.Any()),
        }),
        roles: t.Array(
          t.Union([
            t.Literal("admin"),
            t.Literal("member"),
            t.Literal("guest"),
          ]),
        ),
        metadata: t.Optional(t.Record(t.String(), t.Any())),
      });

      const validUser = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "user@example.com",
        profile: {
          displayName: "John Doe",
          avatar: "https://example.com/avatar.png",
          settings: {
            theme: "dark",
            notifications: true,
          },
        },
        roles: ["member"],
        metadata: {
          source: "test",
        },
      };

      expect(Value.Check(schema, validUser)).toBe(true);
    });

    it("should validate API pagination schema", () => {
      const schema = t.Object({
        page: t.Number({ minimum: 1, default: 1 }),
        limit: t.Number({ minimum: 1, maximum: 100, default: 20 }),
        sortBy: t.Optional(t.String()),
        sortOrder: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
      });

      expect(
        Value.Check(schema, {
          page: 1,
          limit: 20,
          sortBy: "createdAt",
          sortOrder: "desc",
        }),
      ).toBe(true);

      expect(
        Value.Check(schema, {
          page: 0, // Invalid: minimum is 1
          limit: 20,
        }),
      ).toBe(false);

      expect(
        Value.Check(schema, {
          page: 1,
          limit: 200, // Invalid: maximum is 100
        }),
      ).toBe(false);
    });
  });

  describe("Error Field Types (for validation error responses)", () => {
    it("should validate error response schema", () => {
      const schema = t.Object({
        error: t.String(),
        message: t.String(),
        fields: t.Optional(
          t.Array(
            t.Object({
              field: t.String(),
              message: t.String(),
              expected: t.Optional(t.String()),
              received: t.Optional(t.String()),
            }),
          ),
        ),
      });

      const validError = {
        error: "VALIDATION_ERROR",
        message: "Invalid input data",
        fields: [
          {
            field: "email",
            message: "Invalid email format",
            expected: "valid email",
            received: "invalid-email",
          },
        ],
      };

      expect(Value.Check(schema, validError)).toBe(true);
    });
  });

  describe("Edge Cases and Boundary Conditions", () => {
    it("should handle very long strings", () => {
      const schema = t.String({ maxLength: 10000 });

      const longString = "A".repeat(10000);
      const tooLongString = "A".repeat(10001);

      expect(Value.Check(schema, longString)).toBe(true);
      expect(Value.Check(schema, tooLongString)).toBe(false);
    });

    it("should handle very large numbers", () => {
      const schema = t.Number();

      expect(Value.Check(schema, Number.MAX_SAFE_INTEGER)).toBe(true);
      expect(Value.Check(schema, Number.MIN_SAFE_INTEGER)).toBe(true);
    });

    it("should handle very deep nesting", () => {
      const schema = t.Object({
        level1: t.Object({
          level2: t.Object({
            level3: t.Object({
              level4: t.Object({
                level5: t.String(),
              }),
            }),
          }),
        }),
      });

      expect(
        Value.Check(schema, {
          level1: {
            level2: {
              level3: {
                level4: {
                  level5: "deep",
                },
              },
            },
          },
        }),
      ).toBe(true);
    });

    it("should handle arrays with thousands of items", () => {
      const schema = t.Array(t.Number());

      const largeArray = Array.from({ length: 10000 }, (_, i) => i);

      expect(Value.Check(schema, largeArray)).toBe(true);
    });

    it("should handle special characters in strings", () => {
      const schema = t.String();

      expect(Value.Check(schema, "Special: <>&\"'")).toBe(true);
      expect(Value.Check(schema, "\n\r\t")).toBe(true);
      expect(Value.Check(schema, "🎉🎊🎈")).toBe(true);
    });
  });
});
