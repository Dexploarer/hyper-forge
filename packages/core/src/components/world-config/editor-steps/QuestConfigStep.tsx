import { Plus, Edit, Trash2, Target, TrendingUp, Coins } from "lucide-react";
import React, { useState } from "react";

import { Button, Input } from "@/components/common";
import { ArrayItemEditor } from "../shared/ArrayItemEditor";
import { notify } from "@/utils/notify";

interface QuestType {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

interface QuestDifficulty {
  id: string;
  name: string;
  levelRange: { min: number; max: number };
  rewardMultiplier: number;
  enabled: boolean;
}

interface QuestConfig {
  types: QuestType[];
  difficulties: QuestDifficulty[];
  objectiveTypes: string[];
  defaultRewards: {
    experienceBase: number;
    goldBase: number;
  };
}

interface QuestConfigStepProps {
  data: { questConfig?: QuestConfig };
  onChange: (data: any) => void;
}

const QUEST_TYPE_FIELDS = [
  {
    name: "name",
    label: "Type Name",
    type: "text" as const,
    placeholder: "e.g., Main Story, Side Quest",
    required: true,
    maxLength: 100,
  },
  {
    name: "description",
    label: "Description",
    type: "textarea" as const,
    placeholder: "Describe this quest type",
    required: true,
    maxLength: 500,
  },
  {
    name: "enabled",
    label: "Enabled",
    type: "checkbox" as const,
  },
];

const QUEST_DIFFICULTY_FIELDS = [
  {
    name: "name",
    label: "Difficulty Name",
    type: "text" as const,
    placeholder: "e.g., Easy, Hard",
    required: true,
    maxLength: 50,
  },
  {
    name: "levelRange",
    label: "Level Range (min-max)",
    type: "text" as const,
    placeholder: 'Enter as JSON: {"min": 1, "max": 10}',
    required: true,
  },
  {
    name: "rewardMultiplier",
    label: "Reward Multiplier",
    type: "number" as const,
    placeholder: "1.0 = normal, 2.0 = double",
    min: 0.1,
    max: 10,
    required: true,
  },
  {
    name: "enabled",
    label: "Enabled",
    type: "checkbox" as const,
  },
];

export const QuestConfigStep: React.FC<QuestConfigStepProps> = ({
  data,
  onChange,
}) => {
  const [editingType, setEditingType] = useState<QuestType | null>(null);
  const [editingDifficulty, setEditingDifficulty] =
    useState<QuestDifficulty | null>(null);
  const [isTypeEditorOpen, setIsTypeEditorOpen] = useState(false);
  const [isDifficultyEditorOpen, setIsDifficultyEditorOpen] = useState(false);

  const questConfig = data.questConfig || {
    types: [],
    difficulties: [],
    objectiveTypes: [],
    defaultRewards: { experienceBase: 100, goldBase: 50 },
  };

  const updateQuestConfig = (updates: Partial<QuestConfig>) => {
    onChange({
      ...data,
      questConfig: { ...questConfig, ...updates },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-text-primary">
          Quest Configuration
        </h3>
        <p className="text-sm text-text-secondary">
          Define quest types, difficulties, and default rewards
        </p>
      </div>

      {/* Quest Types */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-semibold text-text-primary">
              Quest Types
            </h4>
          </div>
          <Button
            onClick={() => {
              setEditingType(null);
              setIsTypeEditorOpen(true);
            }}
            size="sm"
            variant="secondary"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Type
          </Button>
        </div>
        <div className="space-y-2">
          {questConfig.types.map((type) => (
            <div
              key={type.id}
              className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg"
            >
              <div>
                <span className="text-sm font-medium text-text-primary">
                  {type.name}
                </span>
                <p className="text-xs text-text-secondary">
                  {type.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditingType(type);
                    setIsTypeEditorOpen(true);
                  }}
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() =>
                    updateQuestConfig({
                      types: questConfig.types.filter((t) => t.id !== type.id),
                    })
                  }
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quest Difficulties */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-semibold text-text-primary">
              Difficulties
            </h4>
          </div>
          <Button
            onClick={() => {
              setEditingDifficulty(null);
              setIsDifficultyEditorOpen(true);
            }}
            size="sm"
            variant="secondary"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Difficulty
          </Button>
        </div>
        <div className="space-y-2">
          {questConfig.difficulties.map((diff) => (
            <div
              key={diff.id}
              className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg"
            >
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-text-primary">
                  {diff.name}
                </span>
                <span className="text-xs text-text-tertiary">
                  Lvl {diff.levelRange.min}-{diff.levelRange.max}
                </span>
                <span className="text-xs text-text-tertiary">
                  {diff.rewardMultiplier}x rewards
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditingDifficulty(diff);
                    setIsDifficultyEditorOpen(true);
                  }}
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() =>
                    updateQuestConfig({
                      difficulties: questConfig.difficulties.filter(
                        (d) => d.id !== diff.id,
                      ),
                    })
                  }
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Default Rewards */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-semibold text-text-primary">
            Default Rewards
          </h4>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Experience Base
            </label>
            <Input
              type="number"
              value={questConfig.defaultRewards.experienceBase}
              onChange={(e) =>
                updateQuestConfig({
                  defaultRewards: {
                    ...questConfig.defaultRewards,
                    experienceBase: parseInt(e.target.value) || 0,
                  },
                })
              }
              min={0}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Gold Base
            </label>
            <Input
              type="number"
              value={questConfig.defaultRewards.goldBase}
              onChange={(e) =>
                updateQuestConfig({
                  defaultRewards: {
                    ...questConfig.defaultRewards,
                    goldBase: parseInt(e.target.value) || 0,
                  },
                })
              }
              min={0}
            />
          </div>
        </div>
      </div>

      <ArrayItemEditor
        open={isTypeEditorOpen}
        onClose={() => setIsTypeEditorOpen(false)}
        onSave={(type: QuestType) => {
          if (editingType) {
            updateQuestConfig({
              types: questConfig.types.map((t) =>
                t.id === type.id ? type : t,
              ),
            });
          } else {
            updateQuestConfig({
              types: [...questConfig.types, type],
            });
          }
        }}
        item={editingType}
        fields={QUEST_TYPE_FIELDS}
        title="Quest Type"
      />

      <ArrayItemEditor
        open={isDifficultyEditorOpen}
        onClose={() => setIsDifficultyEditorOpen(false)}
        onSave={(diff: any) => {
          // Parse levelRange if it's a string
          let parsedLevelRange = diff.levelRange;

          if (typeof diff.levelRange === "string") {
            try {
              parsedLevelRange = JSON.parse(diff.levelRange);
            } catch (error) {
              notify.error(
                'Invalid level range format. Please use valid JSON like: {"min": 1, "max": 10}',
              );
              return false; // Keep modal open for user to fix
            }
          }

          const difficulty = {
            ...diff,
            levelRange: parsedLevelRange,
          };

          if (editingDifficulty) {
            updateQuestConfig({
              difficulties: questConfig.difficulties.map((d) =>
                d.id === difficulty.id ? difficulty : d,
              ),
            });
          } else {
            updateQuestConfig({
              difficulties: [...questConfig.difficulties, difficulty],
            });
          }
        }}
        item={editingDifficulty}
        fields={QUEST_DIFFICULTY_FIELDS}
        title="Quest Difficulty"
      />
    </div>
  );
};
