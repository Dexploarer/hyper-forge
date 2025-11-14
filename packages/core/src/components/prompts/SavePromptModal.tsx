import React, { useState } from "react";
import { Save, Loader2, AlertCircle } from "lucide-react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  Button,
} from "@/components/common";
import {
  usePromptLibrary,
  type PromptType,
  type PromptContent,
} from "@/hooks/usePromptLibrary";

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
  editingPrompt?: {
    id: string;
    name: string;
    description?: string;
    isPublic: boolean;
  };
}

const PROMPT_TYPE_LABELS: Record<PromptType, string> = {
  npc: "NPC",
  quest: "Quest",
  dialogue: "Dialogue",
  lore: "Lore",
  voice: "Voice",
  sfx: "Sound Effect",
  music: "Music",
  character: "3D Character",
  prop: "3D Prop",
  environment: "3D Environment",
};

export const SavePromptModal: React.FC<SavePromptModalProps> = ({
  open,
  onClose,
  onSave,
  promptType,
  currentContent,
  loading = false,
  editingPrompt,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  // Get prompts hook to check for duplicates
  const { loadPrompts } = usePromptLibrary();

  // Populate form when editing
  React.useEffect(() => {
    if (editingPrompt && open) {
      setName(editingPrompt.name);
      setDescription(editingPrompt.description || "");
      setIsPublic(editingPrompt.isPublic);
    }
  }, [editingPrompt, open]);

  const checkDuplicateName = async (promptName: string): Promise<boolean> => {
    try {
      setIsCheckingDuplicate(true);
      const existingPrompts = await loadPrompts(promptType);
      return existingPrompts.some(
        (p) =>
          p.name.toLowerCase() === promptName.toLowerCase() &&
          p.id !== editingPrompt?.id, // Skip current prompt when editing
      );
    } catch (error) {
      console.error("Failed to check duplicate names:", error);
      return false;
    } finally {
      setIsCheckingDuplicate(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = "Prompt name is required";
    } else if (name.trim().length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Check for duplicate names
    const isDuplicate = await checkDuplicateName(name.trim());
    if (isDuplicate) {
      setErrors({
        name: `A prompt named "${name.trim()}" already exists. Please choose a different name.`,
      });
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
                {editingPrompt ? "Edit" : "Save"}{" "}
                {PROMPT_TYPE_LABELS[promptType]} Prompt
              </h2>
              <p className="text-sm text-text-tertiary">
                {editingPrompt
                  ? "Update this saved prompt"
                  : "Save this prompt for quick reuse"}
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
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="prompt-name"
                  className="text-sm font-medium text-text-primary"
                >
                  Prompt Name <span className="text-red-400">*</span>
                </label>
                <span className="text-xs text-text-tertiary">
                  {name.length} / 100
                </span>
              </div>
              <Input
                id="prompt-name"
                type="text"
                value={name}
                onChange={(e) => {
                  if (e.target.value.length <= 100) {
                    setName(e.target.value);
                  }
                  if (errors.name) {
                    setErrors({ ...errors, name: "" });
                  }
                }}
                placeholder="e.g., Grumpy Merchant Template"
                className={errors.name ? "border-red-500" : ""}
                disabled={loading}
                maxLength={100}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="prompt-description"
                  className="text-sm font-medium text-text-primary"
                >
                  Description (Optional)
                </label>
                <span className="text-xs text-text-tertiary">
                  {description.length} / 500
                </span>
              </div>
              <Textarea
                id="prompt-description"
                value={description}
                onChange={(e) => {
                  if (e.target.value.length <= 500) {
                    setDescription(e.target.value);
                  }
                }}
                placeholder="Brief description of when to use this prompt..."
                rows={3}
                disabled={loading}
                maxLength={500}
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
          <Button
            type="submit"
            variant="primary"
            disabled={loading || isCheckingDuplicate}
          >
            {(loading || isCheckingDuplicate) && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            {isCheckingDuplicate
              ? "Checking..."
              : loading
                ? editingPrompt
                  ? "Updating..."
                  : "Saving..."
                : editingPrompt
                  ? "Update Prompt"
                  : "Save Prompt"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
