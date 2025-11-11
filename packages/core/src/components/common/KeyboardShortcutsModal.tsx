import React, { useState, useEffect } from "react";
import { X, Search, Keyboard, Command } from "lucide-react";
import { KeyboardShortcut, formatShortcut } from "@/hooks/useKeyboardShortcuts";
import { groupShortcutsByCategory } from "@/constants/shortcuts";

interface KeyboardShortcutsModalProps {
  shortcuts: KeyboardShortcut[];
  open: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  shortcuts,
  open,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter shortcuts based on search
  const filteredShortcuts = React.useMemo(() => {
    if (!searchQuery.trim()) return shortcuts;

    const query = searchQuery.toLowerCase();
    return shortcuts.filter(
      (shortcut) =>
        shortcut.description.toLowerCase().includes(query) ||
        shortcut.category.toLowerCase().includes(query) ||
        shortcut.key.toLowerCase().includes(query),
    );
  }, [shortcuts, searchQuery]);

  // Group by category
  const groupedShortcuts = React.useMemo(
    () => groupShortcutsByCategory(filteredShortcuts),
    [filteredShortcuts],
  );

  // Close on Escape
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Reset search when closed
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-[301] w-full max-w-4xl solid-overlay rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-primary">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="shortcuts-title"
                className="text-xl font-semibold text-text-primary"
              >
                Keyboard Shortcuts
              </h2>
              <p className="text-sm text-text-tertiary">
                {shortcuts.length} shortcuts available
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-bg-hover text-text-tertiary hover:text-text-primary transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border-primary">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shortcuts..."
              className="w-full pl-10 pr-4 py-2 bg-bg-tertiary rounded-lg border border-border-primary text-text-primary placeholder-text-tertiary outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Shortcuts List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {Object.keys(groupedShortcuts).length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-bg-tertiary flex items-center justify-center">
                <Search className="w-8 h-8 text-text-tertiary opacity-50" />
              </div>
              <p className="text-text-secondary font-medium">
                No shortcuts found
              </p>
              <p className="text-text-tertiary text-sm mt-1">
                Try a different search term
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedShortcuts).map(
                ([category, categoryShortcuts]) => (
                  <div key={category}>
                    {/* Category Header */}
                    <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                      {category}
                      <span className="text-xs text-text-tertiary font-normal">
                        ({categoryShortcuts.length})
                      </span>
                    </h3>

                    {/* Shortcuts Table */}
                    <div className="space-y-2">
                      {categoryShortcuts.map((shortcut, index) => (
                        <div
                          key={`${category}-${index}`}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-hover transition-colors"
                        >
                          <span className="text-text-primary text-sm">
                            {shortcut.description}
                          </span>
                          <kbd className="px-3 py-1.5 bg-bg-tertiary rounded-md border border-border-primary text-text-secondary font-mono text-sm flex items-center gap-1">
                            {formatShortcut(shortcut)}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-primary bg-bg-secondary/50">
          <div className="flex items-center justify-between text-xs text-text-tertiary">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Command className="w-3 h-3" />
                <span>or Ctrl on Windows/Linux</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span>Press</span>
              <kbd className="px-2 py-0.5 bg-bg-tertiary rounded border border-border-primary">
                Esc
              </kbd>
              <span>to close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
