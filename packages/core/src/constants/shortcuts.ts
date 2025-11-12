import { KeyboardShortcut } from "@/hooks/useKeyboardShortcuts";

/**
 * Global keyboard shortcuts for the application
 *
 * Categories:
 * - Navigation: Move between views
 * - Assets: Asset management actions
 * - Creation: Content generation
 * - View: Viewer controls
 * - System: App-level actions
 */

export interface ShortcutActions {
  // Navigation
  openCommandPalette: () => void;
  goBack: () => void;
  goForward: () => void;
  openSettings: () => void;
  navigateToAssets: () => void;
  navigateToLibrary: () => void;
  navigateToPlaytester: () => void;
  navigateToEquipment: () => void;
  navigateToHandRigging: () => void;
  navigateToAnimation: () => void;

  // Assets
  exportSelected: () => void;
  deleteSelected: () => void;
  toggleFavorite: () => void;
  duplicateAsset: () => void;
  openInViewer: () => void;
  toggleInfoPanel: () => void;
  openRetexture: () => void;
  openSprites: () => void;
  refreshAssets: () => void;
  selectAll: () => void;
  deselectAll: () => void;
  toggleSelectionMode: () => void;

  // Creation
  newAsset: () => void;
  newQuest: () => void;
  newNPC: () => void;
  newDialogue: () => void;
  newCombat: () => void;
  newPuzzle: () => void;

  // View
  toggleWireframe: () => void;
  toggleGroundPlane: () => void;
  toggleTheme: () => void;
  toggleDetailsPanel: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetCamera: () => void;
  toggleFullscreen: () => void;
  toggleAnimationView: () => void;

  // System
  showHelp: () => void;
  openShortcutsModal: () => void;
  toggleNotifications: () => void;
  focusSearch: () => void;
  clearSearch: () => void;
  undo: () => void;
  redo: () => void;
  save: () => void;
}

export function createGlobalShortcuts(
  actions: ShortcutActions,
): KeyboardShortcut[] {
  return [
    // ======================
    // NAVIGATION (12 shortcuts)
    // ======================
    {
      key: "k",
      modifiers: ["cmd"],
      action: actions.openCommandPalette,
      description: "Open command palette",
      category: "Navigation",
    },
    {
      key: "[",
      modifiers: ["cmd"],
      action: actions.goBack,
      description: "Go back",
      category: "Navigation",
    },
    {
      key: "]",
      modifiers: ["cmd"],
      action: actions.goForward,
      description: "Go forward",
      category: "Navigation",
    },
    {
      key: ",",
      modifiers: ["cmd"],
      action: actions.openSettings,
      description: "Open settings",
      category: "Navigation",
    },
    {
      key: "a",
      modifiers: ["cmd", "shift"],
      action: actions.navigateToAssets,
      description: "Go to Assets",
      category: "Navigation",
    },
    {
      key: "l",
      modifiers: ["cmd"],
      action: actions.navigateToLibrary,
      description: "Go to Content Library",
      category: "Navigation",
    },
    {
      key: "t",
      modifiers: ["cmd", "shift"],
      action: actions.navigateToPlaytester,
      description: "Go to Playtester",
      category: "Navigation",
    },
    {
      key: "e",
      modifiers: ["cmd", "shift"],
      action: actions.navigateToEquipment,
      description: "Go to Equipment Fitting",
      category: "Navigation",
    },
    {
      key: "h",
      modifiers: ["cmd", "shift"],
      action: actions.navigateToHandRigging,
      description: "Go to Hand Rigging",
      category: "Navigation",
    },
    {
      key: "r",
      modifiers: ["cmd", "shift"],
      action: actions.navigateToAnimation,
      description: "Go to Animation",
      category: "Navigation",
    },
    {
      key: "/",
      modifiers: ["cmd"],
      action: actions.focusSearch,
      description: "Focus search",
      category: "Navigation",
    },
    {
      key: "Escape",
      modifiers: [],
      action: actions.clearSearch,
      description: "Clear search",
      category: "Navigation",
    },

    // ======================
    // ASSETS (13 shortcuts)
    // ======================
    {
      key: "e",
      modifiers: ["cmd"],
      action: actions.exportSelected,
      description: "Export selected asset",
      category: "Assets",
    },
    {
      key: "Backspace",
      modifiers: ["cmd"],
      action: actions.deleteSelected,
      description: "Delete selected asset",
      category: "Assets",
    },
    {
      key: "d",
      modifiers: ["cmd"],
      action: actions.toggleFavorite,
      description: "Toggle favorite",
      category: "Assets",
    },
    {
      key: "d",
      modifiers: ["cmd", "shift"],
      action: actions.duplicateAsset,
      description: "Duplicate asset",
      category: "Assets",
    },
    {
      key: "o",
      modifiers: ["cmd"],
      action: actions.openInViewer,
      description: "Open in viewer",
      category: "Assets",
    },
    {
      key: "i",
      modifiers: ["cmd", "shift"],
      action: actions.toggleInfoPanel,
      description: "Toggle info panel",
      category: "Assets",
    },
    {
      key: "m",
      modifiers: ["cmd", "shift"],
      action: actions.openRetexture,
      description: "Generate material variants",
      category: "Assets",
    },
    {
      key: "p",
      modifiers: ["cmd", "shift"],
      action: actions.openSprites,
      description: "Generate sprite sheet",
      category: "Assets",
    },
    {
      key: "r",
      modifiers: ["cmd"],
      action: actions.refreshAssets,
      description: "Refresh assets",
      category: "Assets",
    },
    {
      key: "a",
      modifiers: ["cmd"],
      action: actions.selectAll,
      description: "Select all assets",
      category: "Assets",
    },
    {
      key: "a",
      modifiers: ["cmd", "shift"],
      action: actions.deselectAll,
      description: "Deselect all",
      category: "Assets",
    },
    {
      key: "s",
      modifiers: ["cmd", "shift"],
      action: actions.toggleSelectionMode,
      description: "Toggle selection mode",
      category: "Assets",
    },
    {
      key: "f",
      modifiers: ["cmd"],
      action: actions.focusSearch,
      description: "Focus search",
      category: "Assets",
    },

    // ======================
    // CREATION (6 shortcuts)
    // ======================
    {
      key: "n",
      modifiers: ["cmd"],
      action: actions.newAsset,
      description: "Generate new asset",
      category: "Creation",
    },
    {
      key: "q",
      modifiers: ["cmd", "shift"],
      action: actions.newQuest,
      description: "Generate new quest",
      category: "Creation",
    },
    {
      key: "n",
      modifiers: ["cmd", "shift"],
      action: actions.newNPC,
      description: "Generate new NPC",
      category: "Creation",
    },
    {
      key: "c",
      modifiers: ["cmd", "shift"],
      action: actions.newDialogue,
      description: "Generate new dialogue",
      category: "Creation",
    },
    {
      key: "b",
      modifiers: ["cmd", "shift"],
      action: actions.newCombat,
      description: "Generate new combat",
      category: "Creation",
    },
    {
      key: "u",
      modifiers: ["cmd", "shift"],
      action: actions.newPuzzle,
      description: "Generate new puzzle",
      category: "Creation",
    },

    // ======================
    // VIEW (9 shortcuts)
    // ======================
    {
      key: "w",
      modifiers: ["cmd", "shift"],
      action: actions.toggleWireframe,
      description: "Toggle wireframe",
      category: "View",
    },
    {
      key: "g",
      modifiers: ["cmd", "shift"],
      action: actions.toggleGroundPlane,
      description: "Toggle ground plane",
      category: "View",
    },
    {
      key: "j",
      modifiers: ["cmd", "shift"],
      action: actions.toggleTheme,
      description: "Toggle theme",
      category: "View",
    },
    {
      key: "i",
      modifiers: ["cmd"],
      action: actions.toggleDetailsPanel,
      description: "Toggle details panel",
      category: "View",
    },
    {
      key: "=",
      modifiers: ["cmd"],
      action: actions.zoomIn,
      description: "Zoom in",
      category: "View",
    },
    {
      key: "-",
      modifiers: ["cmd"],
      action: actions.zoomOut,
      description: "Zoom out",
      category: "View",
    },
    {
      key: "0",
      modifiers: ["cmd"],
      action: actions.resetCamera,
      description: "Reset camera",
      category: "View",
    },
    {
      key: "f",
      modifiers: ["cmd", "shift"],
      action: actions.toggleFullscreen,
      description: "Toggle fullscreen",
      category: "View",
    },
    {
      key: "v",
      modifiers: ["cmd", "shift"],
      action: actions.toggleAnimationView,
      description: "Toggle animation view",
      category: "View",
    },

    // ======================
    // SYSTEM (7 shortcuts)
    // ======================
    {
      key: "?",
      modifiers: ["shift"],
      action: actions.openShortcutsModal,
      description: "Show keyboard shortcuts",
      category: "System",
    },
    {
      key: "h",
      modifiers: ["cmd"],
      action: actions.showHelp,
      description: "Show help",
      category: "System",
    },
    {
      key: "b",
      modifiers: ["cmd"],
      action: actions.toggleNotifications,
      description: "Toggle notifications",
      category: "System",
    },
    {
      key: "z",
      modifiers: ["cmd"],
      action: actions.undo,
      description: "Undo",
      category: "System",
    },
    {
      key: "z",
      modifiers: ["cmd", "shift"],
      action: actions.redo,
      description: "Redo",
      category: "System",
    },
    {
      key: "s",
      modifiers: ["cmd"],
      action: actions.save,
      description: "Save",
      category: "System",
    },
    {
      key: "k",
      modifiers: ["cmd", "shift"],
      action: actions.openShortcutsModal,
      description: "Show keyboard shortcuts",
      category: "System",
    },
  ];
}

/**
 * Get all shortcut categories
 */
export function getShortcutCategories(): string[] {
  return ["Navigation", "Assets", "Creation", "View", "System"];
}

/**
 * Group shortcuts by category
 */
export function groupShortcutsByCategory(
  shortcuts: KeyboardShortcut[],
): Record<string, KeyboardShortcut[]> {
  return shortcuts.reduce(
    (groups, shortcut) => {
      const category = shortcut.category || "Other";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(shortcut);
      return groups;
    },
    {} as Record<string, KeyboardShortcut[]>,
  );
}
