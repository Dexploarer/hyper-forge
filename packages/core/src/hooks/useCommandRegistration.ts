import { useEffect, useRef } from "react";
import { useCommandPalette } from "@/contexts/CommandPaletteContext";
import type { CommandPaletteItem } from "@/components/common";

/**
 * Hook for pages/components to register commands with the command palette
 * Commands are automatically removed when the component unmounts
 */
export const useCommandRegistration = (commands: CommandPaletteItem[]) => {
  const { addCommands, removeCommands } = useCommandPalette();

  // Use ref to track command IDs to prevent re-registration on every render
  const commandIdsRef = useRef<string[]>([]);

  useEffect(() => {
    // Get current command IDs
    const newCommandIds = commands.map((c) => c.id);

    // Check if commands have actually changed (by comparing IDs)
    const hasChanged =
      commandIdsRef.current.length !== newCommandIds.length ||
      commandIdsRef.current.some((id, idx) => id !== newCommandIds[idx]);

    if (hasChanged) {
      // Remove old commands if any exist
      if (commandIdsRef.current.length > 0) {
        removeCommands(commandIdsRef.current);
      }

      // Register new commands
      addCommands(commands);
      commandIdsRef.current = newCommandIds;
    }

    // Cleanup: remove commands on unmount
    return () => {
      if (commandIdsRef.current.length > 0) {
        removeCommands(commandIdsRef.current);
      }
    };
  }, [commands, addCommands, removeCommands]);
};
