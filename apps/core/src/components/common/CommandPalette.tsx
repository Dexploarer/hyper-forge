import React, { useState, useEffect, useRef } from "react";
import { Search, Command, ArrowRight, X } from "lucide-react";
import { cn, focusManager } from "@/styles";

export interface CommandPaletteItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  keywords?: string[];
  category?: string;
  action: () => void;
  shortcut?: string;
}

export interface CommandPaletteProps {
  items: CommandPaletteItem[];
  open: boolean;
  onClose: () => void;
  placeholder?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  items,
  open,
  onClose,
  placeholder = "Type a command or search...",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter items based on search query
  const filteredItems = React.useMemo(() => {
    if (!searchQuery.trim()) return items;

    const query = searchQuery.toLowerCase();
    return items.filter((item) => {
      const matchesLabel = item.label.toLowerCase().includes(query);
      const matchesDescription = item.description
        ?.toLowerCase()
        .includes(query);
      const matchesKeywords = item.keywords?.some((kw) =>
        kw.toLowerCase().includes(query),
      );
      const matchesCategory = item.category?.toLowerCase().includes(query);

      return (
        matchesLabel || matchesDescription || matchesKeywords || matchesCategory
      );
    });
  }, [items, searchQuery]);

  // Group items by category
  const groupedItems = React.useMemo(() => {
    const groups: Record<string, CommandPaletteItem[]> = {};
    filteredItems.forEach((item) => {
      const category = item.category || "Other";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    });
    return groups;
  }, [filteredItems]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
        const cleanup = listRef.current
          ? focusManager.trapFocus(listRef.current)
          : undefined;
        return cleanup;
      }, 0);
    } else {
      setSearchQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          Math.min(prev + 1, filteredItems.length - 1),
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
        e.preventDefault();
        filteredItems[selectedIndex].action();
        onClose();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, selectedIndex, filteredItems, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && filteredItems.length > 0) {
      const selectedElement = listRef.current.querySelector(
        `[data-index="${selectedIndex}"]`,
      );
      selectedElement?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex, filteredItems.length]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-commandPalette flex items-start justify-center pt-[20vh]"
      data-overlay="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75" />

      {/* Palette */}
      <div
        ref={listRef}
        className="relative z-commandPalette w-full max-w-2xl mx-4 solid-overlay rounded-xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-border-primary">
          <Search className="w-5 h-5 text-text-tertiary" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-text-primary placeholder-text-tertiary outline-none text-lg"
          />
          <div className="flex items-center gap-2 text-xs text-text-tertiary">
            <kbd className="px-2 py-1 bg-bg-tertiary rounded border border-border-primary">
              <Command className="w-3 h-3 inline" />K
            </kbd>
            <span>to open</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-bg-hover text-text-tertiary hover:text-text-primary transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-text-tertiary">
              <p>No results found</p>
              <p className="text-sm mt-2">Try a different search term</p>
            </div>
          ) : (
            <div className="p-2">
              {Object.entries(groupedItems).map(([category, categoryItems]) => (
                <div key={category} className="mb-4">
                  {Object.keys(groupedItems).length > 1 && (
                    <div className="px-3 py-1.5 text-xs font-semibold text-text-tertiary uppercase">
                      {category}
                    </div>
                  )}
                  {categoryItems.map((item, index) => {
                    const globalIndex = filteredItems.indexOf(item);
                    const Icon = item.icon;
                    const isSelected = globalIndex === selectedIndex;

                    return (
                      <button
                        key={item.id}
                        data-index={globalIndex}
                        onClick={() => {
                          item.action();
                          onClose();
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left",
                          isSelected
                            ? "bg-primary/20 border border-primary/30 text-primary"
                            : "hover:bg-bg-hover text-text-secondary hover:text-text-primary",
                        )}
                      >
                        {Icon && (
                          <Icon
                            className={cn(
                              "w-5 h-5 flex-shrink-0",
                              isSelected
                                ? "text-primary"
                                : "text-text-tertiary",
                            )}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {item.label}
                          </div>
                          {item.description && (
                            <div className="text-xs text-text-tertiary truncate">
                              {item.description}
                            </div>
                          )}
                        </div>
                        {item.shortcut && (
                          <kbd className="px-2 py-0.5 text-xs bg-bg-tertiary rounded border border-border-primary text-text-tertiary">
                            {item.shortcut}
                          </kbd>
                        )}
                        {isSelected && (
                          <ArrowRight className="w-4 h-4 text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
