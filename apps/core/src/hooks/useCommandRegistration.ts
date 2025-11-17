import { useEffect, useRef } from "react";
import { useCommandPalette } from "@/contexts/CommandPaletteContext";
import type { CommandPaletteItem } from "@/components/common";

/**
 * Serialize a command to a comparable string
 * Excludes function references (action, icon) to focus on structural changes
 */
const serializeCommand = (cmd: CommandPaletteItem): string => {
  return JSON.stringify({
    id: cmd.id,
    label: cmd.label,
    description: cmd.description,
    category: cmd.category,
    keywords: cmd.keywords,
  });
};

/**
 * Hook for pages/components to register commands with the command palette
 * Commands are automatically removed when the component unmounts
 */
export const useCommandRegistration = (commands: CommandPaletteItem[]) => {
  const { addCommands, removeCommands } = useCommandPalette();

  // Track serialized command structure to detect real changes
  const commandSignatureRef = useRef<string>("");
  const commandIdsRef = useRef<string[]>([]);

  useEffect(() => {
    // Serialize current commands to detect structural changes
    const newSignature = commands.map(serializeCommand).join("|");
    const newCommandIds = commands.map((c) => c.id);

    // Only update if the command structure has actually changed
    if (commandSignatureRef.current !== newSignature) {
      // Remove old commands if any exist
      if (commandIdsRef.current.length > 0) {
        removeCommands(commandIdsRef.current);
      }

      // Register new commands
      if (commands.length > 0) {
        addCommands(commands);
      }

      // Update refs
      commandSignatureRef.current = newSignature;
      commandIdsRef.current = newCommandIds;
    }

    // Cleanup: remove commands on unmount only
    return () => {
      if (commandIdsRef.current.length > 0) {
        removeCommands(commandIdsRef.current);
        commandIdsRef.current = [];
      }
    };
    // Note: addCommands and removeCommands are stable callbacks (useCallback)
    // so we don't need them in deps. Only commands array matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commands]);
};
