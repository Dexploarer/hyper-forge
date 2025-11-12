import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { CommandPalette, CommandPaletteItem } from "@/components/common";
import { useNavigation } from "@/hooks/useNavigation";
import { NAVIGATION_VIEWS } from "@/constants";
import {
  Package,
  Library,
  TestTube2,
  Shield,
  Hand,
  Play,
  Settings,
} from "lucide-react";

interface CommandPaletteContextValue {
  openPalette: () => void;
  closePalette: () => void;
  isOpen: boolean;
  addCommand: (command: CommandPaletteItem) => void;
  removeCommand: (id: string) => void;
  addCommands: (commands: CommandPaletteItem[]) => void;
  removeCommands: (ids: string[]) => void;
  clearCommands: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(
  null,
);

export const CommandPaletteProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [commands, setCommands] = useState<CommandPaletteItem[]>([]);
  const { navigateTo } = useNavigation();

  // Default navigation commands
  const defaultCommands: CommandPaletteItem[] = [
    {
      id: "nav-assets",
      label: "Go to Assets",
      description: "Browse & manage assets",
      icon: Package,
      category: "Navigation",
      keywords: ["assets", "browse", "library"],
      action: () => {
        navigateTo(NAVIGATION_VIEWS.ASSETS);
        setIsOpen(false);
      },
    },
    {
      id: "nav-library",
      label: "Go to Content Library",
      description: "Saved content browser",
      icon: Library,
      category: "Navigation",
      keywords: ["library", "content", "saved"],
      action: () => {
        navigateTo(NAVIGATION_VIEWS.CONTENT_LIBRARY);
        setIsOpen(false);
      },
    },
    {
      id: "nav-playtester",
      label: "Go to Playtester",
      description: "AI swarm testing",
      icon: TestTube2,
      category: "Navigation",
      keywords: ["playtester", "test", "swarm"],
      action: () => {
        navigateTo(NAVIGATION_VIEWS.PLAYTESTER);
        setIsOpen(false);
      },
    },
    {
      id: "nav-equipment",
      label: "Go to Equipment Fitting",
      description: "Weapons, armor & helmets",
      icon: Shield,
      category: "Navigation",
      keywords: ["equipment", "fitting", "armor", "weapon"],
      action: () => {
        navigateTo(NAVIGATION_VIEWS.EQUIPMENT);
        setIsOpen(false);
      },
    },
    {
      id: "nav-hand-rigging",
      label: "Go to Hand Rigging",
      description: "Auto-grip detection",
      icon: Hand,
      category: "Navigation",
      keywords: ["hand", "rigging", "grip"],
      action: () => {
        navigateTo(NAVIGATION_VIEWS.HAND_RIGGING);
        setIsOpen(false);
      },
    },
    {
      id: "nav-animation",
      label: "Go to Animation",
      description: "Retarget & animate",
      icon: Play,
      category: "Navigation",
      keywords: ["animation", "retarget", "animate"],
      action: () => {
        navigateTo(NAVIGATION_VIEWS.RETARGET_ANIMATE);
        setIsOpen(false);
      },
    },
    {
      id: "nav-settings",
      label: "Go to Settings",
      description: "View prompts & config",
      icon: Settings,
      category: "Navigation",
      keywords: ["settings", "config", "preferences"],
      action: () => {
        navigateTo(NAVIGATION_VIEWS.SETTINGS);
        setIsOpen(false);
      },
    },
  ];

  // Keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const openPalette = useCallback(() => setIsOpen(true), []);
  const closePalette = useCallback(() => setIsOpen(false), []);

  const addCommand = useCallback((command: CommandPaletteItem) => {
    setCommands((prev) => [
      ...prev.filter((c) => c.id !== command.id),
      command,
    ]);
  }, []);

  const removeCommand = useCallback((id: string) => {
    setCommands((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addCommands = useCallback((newCommands: CommandPaletteItem[]) => {
    setCommands((prev) => {
      const existingIds = new Set(newCommands.map((c) => c.id));
      return [...prev.filter((c) => !existingIds.has(c.id)), ...newCommands];
    });
  }, []);

  const removeCommands = useCallback((ids: string[]) => {
    setCommands((prev) => prev.filter((c) => !ids.includes(c.id)));
  }, []);

  const clearCommands = useCallback(() => {
    setCommands([]);
  }, []);

  const allCommands = [...defaultCommands, ...commands];

  return (
    <CommandPaletteContext.Provider
      value={{
        openPalette,
        closePalette,
        isOpen,
        addCommand,
        removeCommand,
        addCommands,
        removeCommands,
        clearCommands,
      }}
    >
      {children}
      <CommandPalette
        items={allCommands}
        open={isOpen}
        onClose={closePalette}
      />
    </CommandPaletteContext.Provider>
  );
};

export const useCommandPalette = () => {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error(
      "useCommandPalette must be used within CommandPaletteProvider",
    );
  }
  return context;
};
