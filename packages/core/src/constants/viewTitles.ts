import { NavigationView, NAVIGATION_VIEWS } from "./navigation";

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
  [NAVIGATION_VIEWS.RETARGET_ANIMATE]: "Animation Retargeting",
  [NAVIGATION_VIEWS.WORLD_CONFIG]: "World Configuration",
  // System
  [NAVIGATION_VIEWS.SETTINGS]: "Settings & Configuration",
  [NAVIGATION_VIEWS.ADMIN_DASHBOARD]: "Admin Dashboard",
  // Public profiles
  [NAVIGATION_VIEWS.PUBLIC_PROFILE]: "Public Profile",
  // Legacy
  [NAVIGATION_VIEWS.GENERATION]: "Generation",
  [NAVIGATION_VIEWS.AUDIO]: "Audio Generation",
  [NAVIGATION_VIEWS.CONTENT]: "Content Generation",
  [NAVIGATION_VIEWS.ARMOR_FITTING]: "Armor Fitting",
};
