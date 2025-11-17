/**
 * Content Type Utilities
 * Helper functions for working with content types
 */

export type ContentType =
  | "npc"
  | "quest"
  | "dialogue"
  | "lore"
  | "location"
  | "world";

export const CONTENT_TYPES: readonly ContentType[] = [
  "npc",
  "quest",
  "dialogue",
  "lore",
  "location",
  "world",
] as const;

/**
 * Type guard to check if a string is a valid ContentType
 */
export function isContentType(value: string): value is ContentType {
  return CONTENT_TYPES.includes(value as ContentType);
}

/**
 * Get display name for content type
 */
export function getContentTypeLabel(type: ContentType): string {
  const labels: Record<ContentType, string> = {
    npc: "NPC",
    quest: "Quest",
    dialogue: "Dialogue",
    lore: "Lore",
    location: "Location",
    world: "World",
  };
  return labels[type];
}

/**
 * Get plural display name for content type
 */
export function getContentTypePluralLabel(type: ContentType): string {
  const labels: Record<ContentType, string> = {
    npc: "NPCs",
    quest: "Quests",
    dialogue: "Dialogues",
    lore: "Lore",
    location: "Locations",
    world: "Worlds",
  };
  return labels[type];
}
