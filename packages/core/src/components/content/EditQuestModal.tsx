/**
 * EditQuestModal Component
 * Modal for editing Quest content
 */

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalSection,
  Button,
  Input,
  Textarea,
  Select,
} from "../common";
import { useContent } from "@/hooks/useContent";
import { useContentEditForm } from "@/hooks/useContentEditForm";
import { EditModalFooter } from "./EditModalFooter";

interface EditQuestModalProps {
  open: boolean;
  onClose: () => void;
  quest: any;
}

interface QuestObjective {
  description: string;
  type: "kill" | "collect" | "talk" | "explore";
  target: string;
  count: number;
}

interface QuestFormData {
  title: string;
  description: string;
  objectives: QuestObjective[];
  rewardsExperience: number;
  rewardsGold: number;
  rewardsItems: string;
  requirementsLevel: number;
  requirementsPreviousQuests: string;
  npcs: string;
  location: string;
  story: string;
}

export const EditQuestModal: React.FC<EditQuestModalProps> = ({
  open,
  onClose,
  quest,
}) => {
  const { updateQuest } = useContent();

  const { formData, setFormData, isSaving, handleSave, isValid } =
    useContentEditForm<QuestFormData, any>({
      initialData: quest,
      open,
      onUpdate: updateQuest,
      onClose,
      validator: (data) => !!data.title?.trim(),
      transformer: (data) => ({
        title: data.title || "",
        description: data.description || "",
        objectives: data.objectives || [],
        rewards: {
          experience: data.rewardsExperience || 0,
          gold: data.rewardsGold || 0,
          items: (data.rewardsItems || "")
            .split(",")
            .map((i) => i.trim())
            .filter(Boolean),
        },
        requirements: {
          level: data.requirementsLevel || 1,
          previousQuests: (data.requirementsPreviousQuests || "")
            .split(",")
            .map((q) => q.trim())
            .filter(Boolean),
        },
        npcs: (data.npcs || "")
          .split(",")
          .map((n) => n.trim())
          .filter(Boolean),
        location: data.location || "",
        story: data.story || "",
      }),
      initializer: (quest) => ({
        title: quest.title || "",
        description: quest.description || "",
        objectives: Array.isArray(quest.objectives) ? quest.objectives : [],
        rewardsExperience: quest.rewards?.experience || 0,
        rewardsGold: quest.rewards?.gold || 0,
        rewardsItems: Array.isArray(quest.rewards?.items)
          ? quest.rewards.items.join(", ")
          : "",
        requirementsLevel: quest.requirements?.level || 1,
        requirementsPreviousQuests: Array.isArray(
          quest.requirements?.previousQuests,
        )
          ? quest.requirements.previousQuests.join(", ")
          : "",
        npcs: Array.isArray(quest.npcs) ? quest.npcs.join(", ") : "",
        location: quest.location || "",
        story: quest.story || "",
      }),
    });

  const addObjective = () => {
    setFormData({
      ...formData,
      objectives: [
        ...(formData.objectives || []),
        { description: "", type: "kill", target: "", count: 1 },
      ],
    });
  };

  const removeObjective = (index: number) => {
    setFormData({
      ...formData,
      objectives: (formData.objectives || []).filter((_, i) => i !== index),
    });
  };

  const updateObjective = (
    index: number,
    field: keyof QuestObjective,
    value: any,
  ) => {
    const updated = [...(formData.objectives || [])];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, objectives: updated });
  };

  return (
    <Modal open={open} onClose={onClose} size="xl">
      <ModalHeader title="Edit Quest" onClose={onClose} />

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
                  value={formData.title || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Quest title"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Description
                </label>
                <Textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Quest description and backstory"
                  className="w-full min-h-[80px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Location
                </label>
                <Input
                  type="text"
                  value={formData.location || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="Where the quest takes place"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Story Arc
                </label>
                <Textarea
                  value={formData.story || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, story: e.target.value })
                  }
                  placeholder="Overall narrative and story progression"
                  className="w-full min-h-[80px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  NPCs Involved (comma-separated)
                </label>
                <Input
                  type="text"
                  value={formData.npcs || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, npcs: e.target.value })
                  }
                  placeholder="e.g., Quest Giver, Ally, Enemy"
                  className="w-full"
                />
              </div>
            </div>
          </ModalSection>

          <ModalSection title="Objectives">
            <div className="space-y-3">
              {(formData.objectives || []).map((obj, index) => (
                <div
                  key={index}
                  className="p-4 bg-bg-tertiary/30 border border-border-primary rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-text-primary">
                      Objective {index + 1}
                    </h4>
                    <button
                      onClick={() => removeObjective(index)}
                      className="p-1 hover:bg-red-500/10 rounded text-text-tertiary hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-text-secondary mb-1">
                        Description
                      </label>
                      <Input
                        type="text"
                        value={obj.description || ""}
                        onChange={(e) =>
                          updateObjective(index, "description", e.target.value)
                        }
                        placeholder="What the player needs to do"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">
                        Type
                      </label>
                      <Select
                        value={obj.type || "kill"}
                        onChange={(e) =>
                          updateObjective(index, "type", e.target.value)
                        }
                        className="w-full"
                      >
                        <option value="kill">Kill</option>
                        <option value="collect">Collect</option>
                        <option value="talk">Talk</option>
                        <option value="explore">Explore</option>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">
                        Target
                      </label>
                      <Input
                        type="text"
                        value={obj.target || ""}
                        onChange={(e) =>
                          updateObjective(index, "target", e.target.value)
                        }
                        placeholder="Enemy/Item/NPC/Location"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">
                        Count
                      </label>
                      <Input
                        type="number"
                        value={obj.count || 1}
                        onChange={(e) =>
                          updateObjective(
                            index,
                            "count",
                            parseInt(e.target.value) || 1,
                          )
                        }
                        min={1}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                variant="secondary"
                onClick={addObjective}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Objective
              </Button>
            </div>
          </ModalSection>

          <ModalSection title="Rewards">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Experience
                </label>
                <Input
                  type="number"
                  value={formData.rewardsExperience || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rewardsExperience: parseInt(e.target.value) || 0,
                    })
                  }
                  min={0}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Gold
                </label>
                <Input
                  type="number"
                  value={formData.rewardsGold || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rewardsGold: parseInt(e.target.value) || 0,
                    })
                  }
                  min={0}
                  className="w-full"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Items (comma-separated)
                </label>
                <Input
                  type="text"
                  value={formData.rewardsItems || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, rewardsItems: e.target.value })
                  }
                  placeholder="e.g., Magic Sword, Health Potion, Gold Ring"
                  className="w-full"
                />
              </div>
            </div>
          </ModalSection>

          <ModalSection title="Requirements">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Minimum Level
                </label>
                <Input
                  type="number"
                  value={formData.requirementsLevel || 1}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      requirementsLevel: parseInt(e.target.value) || 1,
                    })
                  }
                  min={1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Previous Quests Required (comma-separated)
                </label>
                <Input
                  type="text"
                  value={formData.requirementsPreviousQuests || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      requirementsPreviousQuests: e.target.value,
                    })
                  }
                  placeholder="e.g., Quest 1, Quest 2"
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
