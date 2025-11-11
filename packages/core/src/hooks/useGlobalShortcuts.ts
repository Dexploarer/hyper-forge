import { useState, useCallback, useMemo } from "react";
import { useNavigation } from "@/contexts/NavigationContext";
import { useCommandPalette } from "@/contexts/CommandPaletteContext";
import { NAVIGATION_VIEWS } from "@/constants";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import {
  createGlobalShortcuts,
  type ShortcutActions,
} from "@/constants/shortcuts";

/**
 * Global keyboard shortcuts hook
 * Manages all application-wide keyboard shortcuts
 */
export function useGlobalShortcuts() {
  const { navigateTo, goBack, canGoBack } = useNavigation();
  const { openPalette } = useCommandPalette();
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);

  // Define all shortcut actions
  const actions = useMemo<ShortcutActions>(
    () => ({
      // ==================== NAVIGATION ====================
      openCommandPalette: () => {
        openPalette();
      },

      goBack: () => {
        if (canGoBack) {
          goBack();
        }
      },

      goForward: () => {
        // Browser forward navigation
        window.history.forward();
      },

      openSettings: () => {
        navigateTo(NAVIGATION_VIEWS.SETTINGS);
      },

      navigateToGeneration: () => {
        navigateTo(NAVIGATION_VIEWS.GENERATION);
      },

      navigateToAssets: () => {
        navigateTo(NAVIGATION_VIEWS.ASSETS);
      },

      navigateToLibrary: () => {
        navigateTo(NAVIGATION_VIEWS.CONTENT_LIBRARY);
      },

      navigateToPlaytester: () => {
        navigateTo(NAVIGATION_VIEWS.PLAYTESTER);
      },

      navigateToEquipment: () => {
        navigateTo(NAVIGATION_VIEWS.EQUIPMENT);
      },

      navigateToHandRigging: () => {
        navigateTo(NAVIGATION_VIEWS.HAND_RIGGING);
      },

      navigateToAnimation: () => {
        navigateTo(NAVIGATION_VIEWS.RETARGET_ANIMATE);
      },

      // ==================== ASSETS ====================
      exportSelected: () => {
        // Dispatch custom event for asset export
        window.dispatchEvent(new CustomEvent("asset:export"));
      },

      deleteSelected: () => {
        // Dispatch custom event for asset deletion
        window.dispatchEvent(new CustomEvent("asset:delete"));
      },

      toggleFavorite: () => {
        // Dispatch custom event for favorite toggle
        window.dispatchEvent(new CustomEvent("asset:toggleFavorite"));
      },

      duplicateAsset: () => {
        // Dispatch custom event for asset duplication
        window.dispatchEvent(new CustomEvent("asset:duplicate"));
      },

      openInViewer: () => {
        // Dispatch custom event for opening in viewer
        window.dispatchEvent(new CustomEvent("asset:openViewer"));
      },

      toggleInfoPanel: () => {
        // Dispatch custom event for info panel toggle
        window.dispatchEvent(new CustomEvent("ui:toggleInfoPanel"));
      },

      openRetexture: () => {
        // Dispatch custom event for retexture modal
        window.dispatchEvent(new CustomEvent("asset:openRetexture"));
      },

      openSprites: () => {
        // Dispatch custom event for sprite generation
        window.dispatchEvent(new CustomEvent("asset:openSprites"));
      },

      refreshAssets: () => {
        // Dispatch custom event for refresh
        window.dispatchEvent(new CustomEvent("asset:refresh"));
      },

      selectAll: () => {
        // Dispatch custom event for select all
        window.dispatchEvent(new CustomEvent("asset:selectAll"));
      },

      deselectAll: () => {
        // Dispatch custom event for deselect all
        window.dispatchEvent(new CustomEvent("asset:deselectAll"));
      },

      toggleSelectionMode: () => {
        // Dispatch custom event for selection mode toggle
        window.dispatchEvent(new CustomEvent("asset:toggleSelectionMode"));
      },

      // ==================== CREATION ====================
      newAsset: () => {
        navigateTo(NAVIGATION_VIEWS.GENERATION);
        // Dispatch event to focus on asset generation
        window.dispatchEvent(new CustomEvent("generation:focusAsset"));
      },

      newQuest: () => {
        navigateTo(NAVIGATION_VIEWS.GENERATION);
        // Dispatch event to focus on quest generation
        window.dispatchEvent(new CustomEvent("generation:focusQuest"));
      },

      newNPC: () => {
        navigateTo(NAVIGATION_VIEWS.GENERATION);
        // Dispatch event to focus on NPC generation
        window.dispatchEvent(new CustomEvent("generation:focusNPC"));
      },

      newDialogue: () => {
        navigateTo(NAVIGATION_VIEWS.GENERATION);
        // Dispatch event to focus on dialogue generation
        window.dispatchEvent(new CustomEvent("generation:focusDialogue"));
      },

      newCombat: () => {
        navigateTo(NAVIGATION_VIEWS.GENERATION);
        // Dispatch event to focus on combat generation
        window.dispatchEvent(new CustomEvent("generation:focusCombat"));
      },

      newPuzzle: () => {
        navigateTo(NAVIGATION_VIEWS.GENERATION);
        // Dispatch event to focus on puzzle generation
        window.dispatchEvent(new CustomEvent("generation:focusPuzzle"));
      },

      // ==================== VIEW ====================
      toggleWireframe: () => {
        // Dispatch custom event for wireframe toggle
        window.dispatchEvent(new CustomEvent("viewer:toggleWireframe"));
      },

      toggleGroundPlane: () => {
        // Dispatch custom event for ground plane toggle
        window.dispatchEvent(new CustomEvent("viewer:toggleGroundPlane"));
      },

      toggleTheme: () => {
        // Dispatch custom event for theme toggle
        window.dispatchEvent(new CustomEvent("ui:toggleTheme"));
      },

      toggleDetailsPanel: () => {
        // Dispatch custom event for details panel toggle
        window.dispatchEvent(new CustomEvent("ui:toggleDetailsPanel"));
      },

      zoomIn: () => {
        // Dispatch custom event for zoom in
        window.dispatchEvent(new CustomEvent("viewer:zoomIn"));
      },

      zoomOut: () => {
        // Dispatch custom event for zoom out
        window.dispatchEvent(new CustomEvent("viewer:zoomOut"));
      },

      resetCamera: () => {
        // Dispatch custom event for camera reset
        window.dispatchEvent(new CustomEvent("viewer:resetCamera"));
      },

      toggleFullscreen: () => {
        // Toggle fullscreen mode
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch((err) => {
            console.error("Error attempting to enable fullscreen:", err);
          });
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          }
        }
      },

      toggleAnimationView: () => {
        // Dispatch custom event for animation view toggle
        window.dispatchEvent(new CustomEvent("viewer:toggleAnimationView"));
      },

      // ==================== SYSTEM ====================
      showHelp: () => {
        // Dispatch custom event for help modal
        window.dispatchEvent(new CustomEvent("ui:showHelp"));
      },

      openShortcutsModal: () => {
        setShortcutsModalOpen(true);
      },

      toggleNotifications: () => {
        // Dispatch custom event for notifications toggle
        window.dispatchEvent(new CustomEvent("ui:toggleNotifications"));
      },

      focusSearch: () => {
        // Focus search input or open command palette
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[type="search"], input[placeholder*="Search" i], input[placeholder*="search" i]',
        );
        if (searchInput) {
          searchInput.focus();
        } else {
          openPalette();
        }
      },

      clearSearch: () => {
        // Clear search input
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[type="search"], input[placeholder*="Search" i], input[placeholder*="search" i]',
        );
        if (searchInput) {
          searchInput.value = "";
          searchInput.dispatchEvent(new Event("input", { bubbles: true }));
          searchInput.blur();
        }
      },

      undo: () => {
        // Dispatch custom event for undo
        window.dispatchEvent(new CustomEvent("edit:undo"));
      },

      redo: () => {
        // Dispatch custom event for redo
        window.dispatchEvent(new CustomEvent("edit:redo"));
      },

      save: () => {
        // Dispatch custom event for save
        window.dispatchEvent(new CustomEvent("edit:save"));
      },
    }),
    [navigateTo, goBack, canGoBack, openPalette],
  );

  // Create shortcuts with actions
  const shortcuts = useMemo(() => createGlobalShortcuts(actions), [actions]);

  // Register shortcuts
  useKeyboardShortcuts({ shortcuts });

  // Return state and handlers
  return {
    shortcutsModalOpen,
    setShortcutsModalOpen,
    shortcuts,
  };
}
