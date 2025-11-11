import { useEffect } from "react";

export interface KeyboardShortcut {
  key: string;
  modifiers: ("cmd" | "ctrl" | "shift" | "alt")[];
  action: () => void;
  description: string;
  category: string;
  enabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

/**
 * Hook to register keyboard shortcuts with support for modifiers
 *
 * @example
 * ```ts
 * useKeyboardShortcuts({
 *   shortcuts: [
 *     {
 *       key: 'k',
 *       modifiers: ['cmd'],
 *       action: () => console.log('Cmd+K pressed'),
 *       description: 'Open command palette',
 *       category: 'Navigation'
 *     }
 *   ]
 * })
 * ```
 */
export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      // Find matching shortcut
      const matchedShortcut = shortcuts.find((shortcut) => {
        // Skip disabled shortcuts
        if (shortcut.enabled === false) return false;

        // Check key match (case insensitive)
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        if (!keyMatch) return false;

        // Check modifiers
        const hasCmd = shortcut.modifiers.includes("cmd");
        const hasCtrl = shortcut.modifiers.includes("ctrl");
        const hasShift = shortcut.modifiers.includes("shift");
        const hasAlt = shortcut.modifiers.includes("alt");

        const cmdMatch = hasCmd
          ? e.metaKey || e.ctrlKey
          : !e.metaKey && !e.ctrlKey;
        const ctrlMatch = hasCtrl ? e.ctrlKey : true;
        const shiftMatch = hasShift ? e.shiftKey : !e.shiftKey;
        const altMatch = hasAlt ? e.altKey : !e.altKey;

        return (
          cmdMatch && shiftMatch && altMatch && (hasCtrl ? ctrlMatch : true)
        );
      });

      if (matchedShortcut) {
        e.preventDefault();
        e.stopPropagation();
        matchedShortcut.action();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, enabled]);
}

/**
 * Format a keyboard shortcut for display
 * @example formatShortcut({ key: 'k', modifiers: ['cmd', 'shift'] }) => "⌘⇧K"
 */
export function formatShortcut(
  shortcut: Pick<KeyboardShortcut, "key" | "modifiers">,
): string {
  const isMac =
    typeof navigator !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  const modifierSymbols = shortcut.modifiers.map((mod) => {
    switch (mod) {
      case "cmd":
        return isMac ? "⌘" : "Ctrl+";
      case "ctrl":
        return "Ctrl+";
      case "shift":
        return isMac ? "⇧" : "Shift+";
      case "alt":
        return isMac ? "⌥" : "Alt+";
      default:
        return "";
    }
  });

  const key =
    shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key;
  return [...modifierSymbols, key].join("");
}
