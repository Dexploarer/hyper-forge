/**
 * EditNPCModal Component
 * Modal for editing NPC content
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

interface EditNPCModalProps {
  open: boolean;
  onClose: () => void;
  npc: any;
}

interface NPCFormData {
  name: string;
  archetype: string;
  personalityBackground: string;
  personalityTraits: string;
  personalityMotivations: string;
  appearanceDescription: string;
  appearanceEquipment: string;
  dialogueGreeting: string;
  dialogueFarewell: string;
  dialogueIdle: string;
  behaviorRole: string;
  behaviorSchedule: string;
  behaviorRelationships: string;
}

export const EditNPCModal: React.FC<EditNPCModalProps> = ({
  open,
  onClose,
  npc,
}) => {
  const { updateNPC } = useContent();

  const { formData, setFormData, isSaving, handleSave, isValid } =
    useContentEditForm<NPCFormData, any>({
      initialData: npc,
      open,
      onUpdate: updateNPC,
      onClose,
      validator: (data) => !!data.name?.trim(),
      transformer: (data) => ({
        name: data.name,
        archetype: data.archetype,
        personality: {
          background: data.personalityBackground,
          traits: data.personalityTraits
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          motivations: data.personalityMotivations
            .split(",")
            .map((m) => m.trim())
            .filter(Boolean),
        },
        appearance: {
          description: data.appearanceDescription,
          equipment: data.appearanceEquipment
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean),
        },
        dialogue: {
          greeting: data.dialogueGreeting,
          farewell: data.dialogueFarewell,
          idle: data.dialogueIdle
            .split("\n")
            .map((i) => i.trim())
            .filter(Boolean),
        },
        behavior: {
          role: data.behaviorRole,
          schedule: data.behaviorSchedule,
          relationships: data.behaviorRelationships
            .split(",")
            .map((r) => r.trim())
            .filter(Boolean),
        },
      }),
      initializer: (npc) => ({
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
      }),
    });

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

      <EditModalFooter
        onClose={onClose}
        onSave={handleSave}
        isSaving={isSaving}
        isValid={isValid}
      />
    </Modal>
  );
};
