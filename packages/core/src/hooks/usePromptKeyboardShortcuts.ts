import { useEffect } from "react";

export interface PromptKeyboardShortcutsOptions {
  onSave: () => void;
  onLoad: () => void;
  enabled?: boolean;
}

/**
 * Hook to add keyboard shortcuts for prompt library operations
 * - Cmd/Ctrl + S: Open save prompt modal
 * - Cmd/Ctrl + O: Open load prompt modal
 */
export function usePromptKeyboardShortcuts({
  onSave,
  onLoad,
  enabled = true,
}: PromptKeyboardShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd (Mac) or Ctrl (Windows/Linux)
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (!isCmdOrCtrl) return;

      // Cmd/Ctrl + S: Save prompt
      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        onSave();
      }

      // Cmd/Ctrl + O: Open/Load prompt
      if (e.key === "o" || e.key === "O") {
        e.preventDefault();
        onLoad();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onSave, onLoad, enabled]);
}
