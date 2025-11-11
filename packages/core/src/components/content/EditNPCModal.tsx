/**
 * EditNPCModal Component
 * Modal for editing NPC content
 */

import React, { useState, useEffect } from "react";
import { Users, Loader2, Save } from "lucide-react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalSection,
  Button,
  Input,
  Textarea,
} from "../common";
import { useContent } from "@/hooks/useContent";

interface EditNPCModalProps {
  open: boolean;
  onClose: () => void;
  npc: any;
}

export const EditNPCModal: React.FC<EditNPCModalProps> = ({
  open,
  onClose,
  npc,
}) => {
  const { updateNPC } = useContent();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    archetype: "",
    personalityBackground: "",
    personalityTraits: "",
    personalityMotivations: "",
    appearanceDescription: "",
    appearanceEquipment: "",
    dialogueGreeting: "",
    dialogueFarewell: "",
    dialogueIdle: "",
    behaviorRole: "",
    behaviorSchedule: "",
    behaviorRelationships: "",
  });

  // Initialize form data when modal opens
  useEffect(() => {
    if (open && npc) {
      setFormData({
        name: npc.name || "",
        archetype: npc.archetype || "",
        personalityBackground: npc.personality?.background || "",
        personalityTraits: Array.isArray(npc.personality?.traits)
          ? npc.personality.traits.join(", ")
          : "",
        personalityMotivations: Array.isArray(npc.personality?.motivations)
          ? npc.personality.motivations.join(", ")
          : "",
        appearanceDescription: npc.appearance?.description || "",
        appearanceEquipment: Array.isArray(npc.appearance?.equipment)
          ? npc.appearance.equipment.join(", ")
          : "",
        dialogueGreeting: npc.dialogue?.greeting || "",
        dialogueFarewell: npc.dialogue?.farewell || "",
        dialogueIdle: Array.isArray(npc.dialogue?.idle)
          ? npc.dialogue.idle.join("\n")
          : "",
        behaviorRole: npc.behavior?.role || "",
        behaviorSchedule: npc.behavior?.schedule || "",
        behaviorRelationships: Array.isArray(npc.behavior?.relationships)
          ? npc.behavior.relationships.join(", ")
          : "",
      });
    }
  }, [open, npc]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      return;
    }

    try {
      setIsSaving(true);

      const updates = {
        name: formData.name,
        archetype: formData.archetype,
        personality: {
          background: formData.personalityBackground,
          traits: formData.personalityTraits
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          motivations: formData.personalityMotivations
            .split(",")
            .map((m) => m.trim())
            .filter(Boolean),
        },
        appearance: {
          description: formData.appearanceDescription,
          equipment: formData.appearanceEquipment
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean),
        },
        dialogue: {
          greeting: formData.dialogueGreeting,
          farewell: formData.dialogueFarewell,
          idle: formData.dialogueIdle
            .split("\n")
            .map((i) => i.trim())
            .filter(Boolean),
        },
        behavior: {
          role: formData.behaviorRole,
          schedule: formData.behaviorSchedule,
          relationships: formData.behaviorRelationships
            .split(",")
            .map((r) => r.trim())
            .filter(Boolean),
        },
      };

      await updateNPC(npc.id, updates);
      onClose();
    } catch (error) {
      console.error("Failed to save NPC:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="xl">
      <ModalHeader title="Edit NPC" onClose={onClose} />

      <ModalBody>
        <div className="space-y-6">
          <ModalSection title="Basic Information">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Name <span className="text-red-400">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="NPC name"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Archetype
                </label>
                <Input
                  type="text"
                  value={formData.archetype}
                  onChange={(e) =>
                    setFormData({ ...formData, archetype: e.target.value })
                  }
                  placeholder="e.g., Merchant, Guard, Quest Giver"
                  className="w-full"
                />
              </div>
            </div>
          </ModalSection>

          <ModalSection title="Personality">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Background
                </label>
                <Textarea
                  value={formData.personalityBackground}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      personalityBackground: e.target.value,
                    })
                  }
                  placeholder="Character background and history"
                  className="w-full min-h-[80px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Traits (comma-separated)
                </label>
                <Input
                  type="text"
                  value={formData.personalityTraits}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      personalityTraits: e.target.value,
                    })
                  }
                  placeholder="e.g., Brave, Cunning, Loyal"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Motivations (comma-separated)
                </label>
                <Input
                  type="text"
                  value={formData.personalityMotivations}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      personalityMotivations: e.target.value,
                    })
                  }
                  placeholder="e.g., Wealth, Power, Revenge"
                  className="w-full"
                />
              </div>
            </div>
          </ModalSection>

          <ModalSection title="Appearance">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Description
                </label>
                <Textarea
                  value={formData.appearanceDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      appearanceDescription: e.target.value,
                    })
                  }
                  placeholder="Physical appearance and distinguishing features"
                  className="w-full min-h-[80px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Equipment (comma-separated)
                </label>
                <Input
                  type="text"
                  value={formData.appearanceEquipment}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      appearanceEquipment: e.target.value,
                    })
                  }
                  placeholder="e.g., Sword, Shield, Leather Armor"
                  className="w-full"
                />
              </div>
            </div>
          </ModalSection>

          <ModalSection title="Dialogue">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Greeting
                </label>
                <Textarea
                  value={formData.dialogueGreeting}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dialogueGreeting: e.target.value,
                    })
                  }
                  placeholder="What the NPC says when first approached"
                  className="w-full min-h-[60px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Farewell
                </label>
                <Textarea
                  value={formData.dialogueFarewell}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dialogueFarewell: e.target.value,
                    })
                  }
                  placeholder="What the NPC says when parting"
                  className="w-full min-h-[60px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Idle Lines (one per line)
                </label>
                <Textarea
                  value={formData.dialogueIdle}
                  onChange={(e) =>
                    setFormData({ ...formData, dialogueIdle: e.target.value })
                  }
                  placeholder="Random things the NPC says while idle"
                  className="w-full min-h-[80px]"
                />
              </div>
            </div>
          </ModalSection>

          <ModalSection title="Behavior">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Role
                </label>
                <Input
                  type="text"
                  value={formData.behaviorRole}
                  onChange={(e) =>
                    setFormData({ ...formData, behaviorRole: e.target.value })
                  }
                  placeholder="NPC's role in the world"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Schedule
                </label>
                <Textarea
                  value={formData.behaviorSchedule}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      behaviorSchedule: e.target.value,
                    })
                  }
                  placeholder="Daily routine and schedule"
                  className="w-full min-h-[60px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Relationships (comma-separated)
                </label>
                <Input
                  type="text"
                  value={formData.behaviorRelationships}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      behaviorRelationships: e.target.value,
                    })
                  }
                  placeholder="e.g., Friend of John, Enemy of Mary"
                  className="w-full"
                />
              </div>
            </div>
          </ModalSection>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving || !formData.name.trim()}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
