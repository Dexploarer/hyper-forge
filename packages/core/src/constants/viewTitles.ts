import type { NavigationView } from "@/types";
import { NAVIGATION_VIEWS } from "./navigation";

/**
 * Desktop view titles - full descriptive names for TopBar and FloatingTopBar
 */
export const VIEW_TITLES: Record<NavigationView, string> = {
  // Core
  [NAVIGATION_VIEWS.DASHBOARD]: "Dashboard",
  [NAVIGATION_VIEWS.ASSETS]: "Asset Library",
  [NAVIGATION_VIEWS.PROJECTS]: "Projects",
  [NAVIGATION_VIEWS.CONTENT_LIBRARY]: "Content Library",
  // 3D Generation
  [NAVIGATION_VIEWS.GENERATION_CHARACTER]: "Character Generation",
  [NAVIGATION_VIEWS.GENERATION_PROP]: "Prop & Item Generation",
  [NAVIGATION_VIEWS.GENERATION_ENVIRONMENT]: "Environment Generation",
  [NAVIGATION_VIEWS.GENERATION_WORLD]: "World Builder",
  // Content Generation
  [NAVIGATION_VIEWS.CONTENT_NPC]: "NPC Generation",
  [NAVIGATION_VIEWS.CONTENT_QUEST]: "Quest Generation",
  [NAVIGATION_VIEWS.CONTENT_DIALOGUE]: "Dialogue Generation",
  [NAVIGATION_VIEWS.CONTENT_LORE]: "Lore Generation",
  // Audio Generation
  [NAVIGATION_VIEWS.AUDIO_VOICE]: "Voice Generation",
  [NAVIGATION_VIEWS.AUDIO_SFX]: "Sound Effects Generation",
  [NAVIGATION_VIEWS.AUDIO_MUSIC]: "Music Generation",
  // Tools
  [NAVIGATION_VIEWS.PLAYTESTER]: "AI Playtester Swarm",
  [NAVIGATION_VIEWS.EQUIPMENT]: "Equipment Fitting",
  [NAVIGATION_VIEWS.HAND_RIGGING]: "Hand Rigging",
  [NAVIGATION_VIEWS.RETARGET_ANIMATE]: "VRM Animation Testing",
  [NAVIGATION_VIEWS.WORLD_CONFIG]: "World Configuration",
  // System
  [NAVIGATION_VIEWS.SETTINGS]: "Settings & Configuration",
  [NAVIGATION_VIEWS.ADMIN_DASHBOARD]: "Admin Dashboard",
  // Public profiles
  [NAVIGATION_VIEWS.PUBLIC_PROFILE]: "Public Profile",
};

/**
 * Mobile view titles - shortened names for MobileTopBar to fit smaller screens
 */
export const MOBILE_VIEW_TITLES: Record<NavigationView, string> = {
  // Core
  [NAVIGATION_VIEWS.DASHBOARD]: "Dashboard",
  [NAVIGATION_VIEWS.ASSETS]: "Assets",
  [NAVIGATION_VIEWS.PROJECTS]: "Projects",
  [NAVIGATION_VIEWS.CONTENT_LIBRARY]: "Library",
  // 3D Generation
  [NAVIGATION_VIEWS.GENERATION_CHARACTER]: "Characters",
  [NAVIGATION_VIEWS.GENERATION_PROP]: "Props",
  [NAVIGATION_VIEWS.GENERATION_ENVIRONMENT]: "Environments",
  [NAVIGATION_VIEWS.GENERATION_WORLD]: "World Builder",
  // Content Generation
  [NAVIGATION_VIEWS.CONTENT_NPC]: "NPCs",
  [NAVIGATION_VIEWS.CONTENT_QUEST]: "Quests",
  [NAVIGATION_VIEWS.CONTENT_DIALOGUE]: "Dialogue",
  [NAVIGATION_VIEWS.CONTENT_LORE]: "Lore",
  // Audio Generation
  [NAVIGATION_VIEWS.AUDIO_VOICE]: "Voice",
  [NAVIGATION_VIEWS.AUDIO_SFX]: "SFX",
  [NAVIGATION_VIEWS.AUDIO_MUSIC]: "Music",
  // Tools
  [NAVIGATION_VIEWS.PLAYTESTER]: "Playtester",
  [NAVIGATION_VIEWS.EQUIPMENT]: "Equipment",
  [NAVIGATION_VIEWS.HAND_RIGGING]: "Hand Rigging",
  [NAVIGATION_VIEWS.RETARGET_ANIMATE]: "VRM Test",
  [NAVIGATION_VIEWS.WORLD_CONFIG]: "World Config",
  // System
  [NAVIGATION_VIEWS.SETTINGS]: "Settings",
  [NAVIGATION_VIEWS.ADMIN_DASHBOARD]: "Admin",
  // Public profiles
  [NAVIGATION_VIEWS.PUBLIC_PROFILE]: "Profile",
};
