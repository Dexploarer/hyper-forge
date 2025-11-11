export type NavigationView =
  // Core pages
  | "dashboard"
  | "assets"
  | "contentLibrary"
  // 3D Generation pages
  | "generation/character"
  | "generation/prop"
  | "generation/environment"
  | "generation/world"
  // Content Generation pages
  | "content/npc"
  | "content/quest"
  | "content/dialogue"
  | "content/lore"
  // Audio Generation pages
  | "audio/voice"
  | "audio/sfx"
  | "audio/music"
  // Tools
  | "playtester"
  | "equipment"
  | "handRigging"
  | "retargetAnimate"
  | "worldConfig"
  // System
  | "adminDashboard"
  | "settings"
  // Legacy/deprecated
  | "generation"
  | "audio"
  | "content"
  | "armorFitting";

export interface NavigationState {
  currentView: NavigationView;
  selectedAssetId: string | null;
  navigationHistory: NavigationView[];
  // Content to import to playtester
  importedPlaytestContent: {
    content: unknown;
    contentType: "quest" | "dialogue" | "npc" | "combat" | "puzzle";
  } | null;
}

export interface NavigationContextValue extends NavigationState {
  // Navigation actions
  navigateTo: (view: NavigationView) => void;
  navigateToAsset: (assetId: string) => void;
  navigateToPlaytester: (
    content: unknown,
    contentType: "quest" | "dialogue" | "npc" | "combat" | "puzzle",
  ) => void;
  goBack: () => void;

  // Navigation helpers
  canGoBack: boolean;
}
