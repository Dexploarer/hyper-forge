import React, { useState, useEffect } from "react";
import {
  Library,
  Search,
  Loader2,
  Download,
  Copy,
  Trash2,
  Globe,
  Lock,
} from "lucide-react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Button,
} from "@/components/common";
import {
  usePromptLibrary,
  type SavedPrompt,
  type PromptType,
} from "@/hooks/usePromptLibrary";
import { cn } from "@/styles";

export interface PromptLibraryModalProps {
  open: boolean;
  onClose: () => void;
  onLoad: (prompt: SavedPrompt) => void;
  promptType: PromptType;
}

const PROMPT_TYPE_LABELS: Record<PromptType, string> = {
  npc: "NPC",
  quest: "Quest",
  dialogue: "Dialogue",
  lore: "Lore",
  voice: "Voice",
  sfx: "Sound Effect",
  music: "Music",
};

export const PromptLibraryModal: React.FC<PromptLibraryModalProps> = ({
  open,
  onClose,
  onLoad,
  promptType,
}) => {
  const { prompts, isLoading, loadPrompts, deletePrompt, duplicatePrompt } =
    usePromptLibrary();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState<SavedPrompt | null>(
    null,
  );

  // Load prompts when modal opens
  useEffect(() => {
    if (open) {
      loadPrompts(promptType);
    }
  }, [open, promptType, loadPrompts]);

  // Filter prompts by search term
  const filteredPrompts = prompts.filter((prompt) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      prompt.name.toLowerCase().includes(search) ||
      prompt.description?.toLowerCase().includes(search) ||
      prompt.content.prompt?.toLowerCase().includes(search)
    );
  });

  const handleLoad = (prompt: SavedPrompt) => {
    onLoad(prompt);
    onClose();
  };

  const handleDelete = async (prompt: SavedPrompt, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm(`Are you sure you want to delete "${prompt.name}"?`)) {
      return;
    }

    await deletePrompt(prompt.id);
  };

  const handleDuplicate = async (prompt: SavedPrompt, e: React.MouseEvent) => {
    e.stopPropagation();
    await duplicatePrompt(prompt);
  };

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <ModalHeader onClose={onClose}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
            <Library className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              {PROMPT_TYPE_LABELS[promptType]} Prompt Library
            </h2>
            <p className="text-sm text-text-tertiary">
              {filteredPrompts.length} saved prompt
              {filteredPrompts.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </ModalHeader>

      <ModalBody>
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search saved prompts..."
              className="w-full pl-10"
            />
          </div>

          {/* Prompt List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredPrompts.length === 0 ? (
            <div className="text-center py-12">
              <Library className="w-12 h-12 mx-auto mb-3 text-text-tertiary opacity-50" />
              <h3 className="text-lg font-medium text-text-primary mb-1">
                {searchTerm ? "No prompts found" : "No saved prompts"}
              </h3>
              <p className="text-sm text-text-tertiary">
                {searchTerm
                  ? "Try adjusting your search"
                  : "Save a prompt to get started"}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {filteredPrompts.map((prompt) => {
                const isSelected = selectedPrompt?.id === prompt.id;

                return (
                  <div
                    key={prompt.id}
                    onClick={() => setSelectedPrompt(prompt)}
                    className={cn(
                      "p-4 rounded-lg border-2 cursor-pointer transition-all",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                        : "border-border-primary bg-bg-tertiary/30 hover:border-primary/50 hover:bg-bg-tertiary/50",
                    )}
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4
                            className={cn(
                              "text-sm font-semibold truncate",
                              isSelected ? "text-primary" : "text-text-primary",
                            )}
                          >
                            {prompt.name}
                          </h4>
                          {prompt.isPublic ? (
                            <Globe
                              className="w-3.5 h-3.5 text-text-tertiary flex-shrink-0"
                              title="Public"
                            />
                          ) : (
                            <Lock
                              className="w-3.5 h-3.5 text-text-tertiary flex-shrink-0"
                              title="Private"
                            />
                          )}
                        </div>
                        {prompt.description && (
                          <p className="text-xs text-text-tertiary line-clamp-2 mb-2">
                            {prompt.description}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={(e) => handleDuplicate(prompt, e)}
                          className="p-1.5 rounded hover:bg-bg-hover transition-colors"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5 text-text-secondary hover:text-text-primary" />
                        </button>
                        {!prompt.isSystem && (
                          <button
                            onClick={(e) => handleDelete(prompt, e)}
                            className="p-1.5 rounded hover:bg-red-500/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-text-secondary hover:text-red-500" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Prompt Preview */}
                    <div className="p-2 bg-bg-secondary/50 rounded text-xs text-text-tertiary line-clamp-2">
                      {prompt.content.prompt || "(No prompt text)"}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-3 mt-2 text-xs text-text-tertiary">
                      {prompt.content.archetype && (
                        <span>Type: {prompt.content.archetype}</span>
                      )}
                      <span>
                        {new Date(prompt.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => selectedPrompt && handleLoad(selectedPrompt)}
          disabled={!selectedPrompt}
        >
          <Download className="w-4 h-4 mr-2" />
          Load Selected
        </Button>
      </ModalFooter>
    </Modal>
  );
};
