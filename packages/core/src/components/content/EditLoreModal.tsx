/**
 * EditLoreModal Component
 * Modal for editing Lore content
 */

import React from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalSection,
  Input,
  Textarea,
} from "../common";
import { useContent } from "@/hooks/useContent";
import { useContentEditForm } from "@/hooks/useContentEditForm";
import { EditModalFooter } from "./EditModalFooter";

interface EditLoreModalProps {
  open: boolean;
  onClose: () => void;
  lore: any;
}

interface LoreFormData {
  title: string;
  category: string;
  content: string;
  summary: string;
  relatedTopics: string;
  timeline: string;
  characters: string;
}

export const EditLoreModal: React.FC<EditLoreModalProps> = ({
  open,
  onClose,
  lore,
}) => {
  const { updateLore } = useContent();

  const { formData, setFormData, isSaving, handleSave, isValid } =
    useContentEditForm<LoreFormData, any>({
      initialData: lore,
      open,
      onUpdate: updateLore,
      onClose,
      validator: (data) => !!data.title?.trim() && !!data.content?.trim(),
      transformer: (data) => ({
        title: data.title || "",
        category: data.category || "",
        content: data.content || "",
        summary: data.summary || "",
        relatedTopics: (data.relatedTopics || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        timeline: data.timeline || undefined,
        characters: (data.characters || "")
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
      }),
      initializer: (lore) => ({
        title: lore.title || "",
        category: lore.category || "",
        content: lore.content || "",
        summary: lore.summary || "",
        relatedTopics: Array.isArray(lore.relatedTopics)
          ? lore.relatedTopics.join(", ")
          : "",
        timeline: lore.timeline || "",
        characters: Array.isArray(lore.characters)
          ? lore.characters.join(", ")
          : "",
      }),
    });

  return (
    <Modal open={open} onClose={onClose} size="xl">
      <ModalHeader title="Edit Lore" onClose={onClose} />

      <ModalBody>
        <div className="space-y-6">
          <ModalSection title="Basic Information">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Lore entry title"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Category
                </label>
                <Input
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="e.g., History, Mythology, Geography, Culture"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Summary
                </label>
                <Textarea
                  value={formData.summary}
                  onChange={(e) =>
                    setFormData({ ...formData, summary: e.target.value })
                  }
                  placeholder="Brief summary of the lore entry"
                  className="w-full min-h-[80px]"
                />
              </div>
            </div>
          </ModalSection>

          <ModalSection title="Content">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Lore Content <span className="text-red-400">*</span>
                </label>
                <Textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="The full lore text, stories, legends, and details..."
                  className="w-full min-h-[200px]"
                />
                <p className="text-xs text-text-tertiary mt-1">
                  Word count:{" "}
                  {(formData.content || "").split(/\s+/).filter(Boolean).length}
                </p>
              </div>
            </div>
          </ModalSection>

          <ModalSection title="Connections & Context">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Related Topics (comma-separated)
                </label>
                <Input
                  type="text"
                  value={formData.relatedTopics}
                  onChange={(e) =>
                    setFormData({ ...formData, relatedTopics: e.target.value })
                  }
                  placeholder="e.g., The Great War, Dragon Riders, Ancient Kingdoms"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Timeline / Time Period
                </label>
                <Input
                  type="text"
                  value={formData.timeline}
                  onChange={(e) =>
                    setFormData({ ...formData, timeline: e.target.value })
                  }
                  placeholder="e.g., Age of Heroes, Year 1200, Third Era"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Characters Involved (comma-separated)
                </label>
                <Input
                  type="text"
                  value={formData.characters}
                  onChange={(e) =>
                    setFormData({ ...formData, characters: e.target.value })
                  }
                  placeholder="e.g., King Arthur, Merlin, Lady Guinevere"
                  className="w-full"
                />
              </div>
            </div>
          </ModalSection>
        </div>
      </ModalBody>

      <EditModalFooter
        onClose={onClose}
        onSave={handleSave}
        isSaving={isSaving}
        isValid={isValid}
      />
    </Modal>
  );
};
