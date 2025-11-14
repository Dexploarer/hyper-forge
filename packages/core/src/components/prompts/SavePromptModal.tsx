import React, { useState } from "react";
import { Save, Loader2 } from "lucide-react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  Button,
} from "@/components/common";
import type { PromptType, PromptContent } from "@/hooks/usePromptLibrary";

export interface SavePromptModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    description?: string;
    isPublic?: boolean;
  }) => Promise<void>;
  promptType: PromptType;
  currentContent: PromptContent;
  loading?: boolean;
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

export const SavePromptModal: React.FC<SavePromptModalProps> = ({
  open,
  onClose,
  onSave,
  promptType,
  currentContent,
  loading = false,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = "Prompt name is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit
    await onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      isPublic,
    });

    // Reset form on success
    handleClose();
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setIsPublic(false);
    setErrors({});
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} size="md">
      <form onSubmit={handleSubmit}>
        <ModalHeader onClose={handleClose}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <Save className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                Save {PROMPT_TYPE_LABELS[promptType]} Prompt
              </h2>
              <p className="text-sm text-text-tertiary">
                Save this prompt for quick reuse
              </p>
            </div>
          </div>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            {/* Preview Current Prompt */}
            <div className="p-3 bg-bg-tertiary/50 rounded-lg border border-border-primary">
              <p className="text-xs font-medium text-text-secondary mb-2">
                Current Prompt Preview:
              </p>
              <p className="text-sm text-text-primary line-clamp-3">
                {currentContent.prompt || "(No prompt entered)"}
              </p>
              {currentContent.archetype && (
                <p className="text-xs text-text-tertiary mt-1">
                  Archetype: {currentContent.archetype}
                </p>
              )}
              {currentContent.context && (
                <p className="text-xs text-text-tertiary">
                  Context: {currentContent.context}
                </p>
              )}
            </div>

            {/* Prompt Name */}
            <div>
              <label
                htmlFor="prompt-name"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                Prompt Name <span className="text-red-400">*</span>
              </label>
              <Input
                id="prompt-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) {
                    setErrors({ ...errors, name: "" });
                  }
                }}
                placeholder="e.g., Grumpy Merchant Template"
                className={errors.name ? "border-red-500" : ""}
                disabled={loading}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-400">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="prompt-description"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                Description (Optional)
              </label>
              <Textarea
                id="prompt-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of when to use this prompt..."
                rows={3}
                disabled={loading}
              />
            </div>

            {/* Public Toggle */}
            <div className="flex items-center gap-3 p-3 bg-bg-tertiary/30 rounded-lg">
              <input
                type="checkbox"
                id="prompt-public"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 rounded border-border-primary text-primary focus:ring-2 focus:ring-primary"
                disabled={loading}
              />
              <label
                htmlFor="prompt-public"
                className="text-sm text-text-primary cursor-pointer"
              >
                <span className="font-medium">Make this prompt public</span>
                <p className="text-xs text-text-tertiary mt-0.5">
                  Share with the community (can be changed later)
                </p>
              </label>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Prompt
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
