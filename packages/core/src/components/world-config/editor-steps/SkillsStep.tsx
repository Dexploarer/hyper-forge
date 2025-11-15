import {
  Plus,
  Edit,
  Trash2,
  Sword,
  Wand2,
  EyeOff,
  MessageSquare,
  Hammer,
} from "lucide-react";
import React, { useState } from "react";

import { Button } from "@/components/common";
import { ArrayItemEditor } from "../shared/ArrayItemEditor";

interface WorldSkill {
  id: string;
  name: string;
  category: "combat" | "magic" | "stealth" | "social" | "crafting";
  description: string;
  prerequisites: string[];
  tier: number;
  enabled: boolean;
  createdAt: string;
}

interface SkillsStepProps {
  data: { skills?: WorldSkill[] };
  onChange: (data: any) => void;
}

const SKILL_FIELDS = [
  {
    name: "name",
    label: "Skill Name",
    type: "text" as const,
    placeholder: "e.g., Sword Mastery, Fireball",
    required: true,
    maxLength: 100,
  },
  {
    name: "category",
    label: "Category",
    type: "select" as const,
    options: [
      { value: "combat", label: "Combat" },
      { value: "magic", label: "Magic" },
      { value: "stealth", label: "Stealth" },
      { value: "social", label: "Social" },
      { value: "crafting", label: "Crafting" },
    ],
    required: true,
  },
  {
    name: "description",
    label: "Description",
    type: "textarea" as const,
    placeholder: "Describe what the skill does and its effects",
    required: true,
    maxLength: 500,
  },
  {
    name: "tier",
    label: "Tier (1-5)",
    type: "number" as const,
    min: 1,
    max: 5,
    required: true,
  },
  {
    name: "prerequisites",
    label: "Prerequisite Skill IDs",
    type: "list" as const,
    placeholder: "Enter skill IDs",
  },
  {
    name: "enabled",
    label: "Enabled",
    type: "checkbox" as const,
  },
];

const CATEGORY_ICONS = {
  combat: Sword,
  magic: Wand2,
  stealth: EyeOff,
  social: MessageSquare,
  crafting: Hammer,
};

const CATEGORY_COLORS = {
  combat: "text-red-400 bg-red-500/10",
  magic: "text-purple-400 bg-purple-500/10",
  stealth: "text-gray-400 bg-gray-500/10",
  social: "text-blue-400 bg-blue-500/10",
  crafting: "text-orange-400 bg-orange-500/10",
};

export const SkillsStep: React.FC<SkillsStepProps> = ({ data, onChange }) => {
  const [editingSkill, setEditingSkill] = useState<WorldSkill | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const skills = data.skills || [];

  // Group skills by category
  const skillsByCategory = skills.reduce(
    (acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = [];
      acc[skill.category].push(skill);
      return acc;
    },
    {} as Record<string, WorldSkill[]>,
  );

  const handleAddSkill = () => {
    setEditingSkill(null);
    setIsEditorOpen(true);
  };

  const handleEditSkill = (skill: WorldSkill) => {
    setEditingSkill(skill);
    setIsEditorOpen(true);
  };

  const handleDeleteSkill = (id: string) => {
    onChange({
      ...data,
      skills: skills.filter((s) => s.id !== id),
    });
  };

  const handleSaveSkill = (skill: WorldSkill) => {
    if (editingSkill) {
      onChange({
        ...data,
        skills: skills.map((s) => (s.id === skill.id ? skill : s)),
      });
    } else {
      onChange({
        ...data,
        skills: [...skills, skill],
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Skills</h3>
          <p className="text-sm text-text-secondary">
            Define the skills and abilities available in your world
          </p>
        </div>
        <Button onClick={handleAddSkill} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Skill
        </Button>
      </div>

      {skills.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border-primary rounded-lg">
          <p className="text-text-secondary mb-4">No skills defined yet</p>
          <Button onClick={handleAddSkill} variant="secondary">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Skill
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(skillsByCategory).map(
            ([category, categorySkills]) => {
              const Icon =
                CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-primary" />
                    <h4 className="text-sm font-semibold text-text-primary capitalize">
                      {category}
                    </h4>
                    <span className="text-xs text-text-tertiary">
                      ({categorySkills.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {categorySkills.map((skill) => (
                      <div
                        key={skill.id}
                        className="p-3 bg-bg-tertiary border border-border-primary rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="text-sm font-medium text-text-primary">
                                {skill.name}
                              </h5>
                              <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                                Tier {skill.tier}
                              </span>
                              {!skill.enabled && (
                                <span className="text-xs px-1.5 py-0.5 bg-gray-500/20 text-gray-400 rounded">
                                  Disabled
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-text-secondary line-clamp-2">
                              {skill.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleEditSkill(skill)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteSkill(skill.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            },
          )}
        </div>
      )}

      <ArrayItemEditor
        open={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveSkill}
        item={editingSkill}
        fields={SKILL_FIELDS}
        title="Skill"
        description="Define a skill's category, power level, and requirements"
      />
    </div>
  );
};
