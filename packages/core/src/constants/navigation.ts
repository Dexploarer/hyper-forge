import { NavigationView } from "../types";

// Navigation view constants
export const NAVIGATION_VIEWS = {
  // Core pages
  DASHBOARD: "dashboard",
  ASSETS: "assets",
  PROJECTS: "projects",
  CONTENT_LIBRARY: "contentLibrary",

  // 3D Generation pages (expanded from single "generation" view)
  GENERATION_CHARACTER: "generation/character",
  GENERATION_PROP: "generation/prop",
  GENERATION_ENVIRONMENT: "generation/environment",
  GENERATION_WORLD: "generation/world",

  // Content Generation pages (extracted from ChatGenerationPage)
  CONTENT_NPC: "content/npc",
  CONTENT_QUEST: "content/quest",
  CONTENT_DIALOGUE: "content/dialogue",
  CONTENT_LORE: "content/lore",

  // Audio Generation pages (extracted from ChatGenerationPage)
  AUDIO_VOICE: "audio/voice",
  AUDIO_SFX: "audio/sfx",
  AUDIO_MUSIC: "audio/music",

  // Tools
  PLAYTESTER: "playtester",
  EQUIPMENT: "equipment",
  HAND_RIGGING: "handRigging",
  RETARGET_ANIMATE: "retargetAnimate",
  WORLD_CONFIG: "worldConfig",

  // System
  SETTINGS: "settings",
  ADMIN_DASHBOARD: "adminDashboard",

  // Public profiles
  PUBLIC_PROFILE: "publicProfile",
} as const satisfies Record<string, NavigationView>;

// Grid background styles for the app
export const APP_BACKGROUND_STYLES = {
  gridSize: "50px 50px",
  gridImage: `linear-gradient(to right, var(--color-primary) 1px, transparent 1px),
               linear-gradient(to bottom, var(--color-primary) 1px, transparent 1px)`,
} as const;
