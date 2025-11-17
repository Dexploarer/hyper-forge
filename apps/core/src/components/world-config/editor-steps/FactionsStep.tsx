import { Plus, Edit, Trash2, Shield } from "lucide-react";
import React, { useState } from "react";

import { Button } from "@/components/common";
import { ArrayItemEditor } from "../shared/ArrayItemEditor";

interface WorldFaction {
  id: string;
  name: string;
  description: string;
  alignment: "good" | "neutral" | "evil";
  goals: string[];
  rivals: string[];
  allies: string[];
  enabled: boolean;
  createdAt: string;
}

interface FactionsStepProps {
  data: { factions?: WorldFaction[] };
  onChange: (data: any) => void;
}

const FACTION_FIELDS = [
  {
    name: "name",
    label: "Faction Name",
    type: "text" as const,
    placeholder: "e.g., Knights of the Silver Hand",
    required: true,
    maxLength: 100,
  },
  {
    name: "description",
    label: "Description",
    type: "textarea" as const,
    placeholder: "Describe the faction's purpose and influence",
    required: true,
    maxLength: 500,
  },
  {
    name: "alignment",
    label: "Alignment",
    type: "select" as const,
    options: [
      { value: "good", label: "Good" },
      { value: "neutral", label: "Neutral" },
      { value: "evil", label: "Evil" },
    ],
    required: true,
  },
  {
    name: "goals",
    label: "Goals",
    type: "list" as const,
    placeholder: "e.g., Protect the realm, Seek knowledge",
    required: true,
  },
  {
    name: "rivals",
    label: "Rival Faction IDs",
    type: "list" as const,
    placeholder: "Enter faction IDs",
  },
  {
    name: "allies",
    label: "Allied Faction IDs",
    type: "list" as const,
    placeholder: "Enter faction IDs",
  },
  {
    name: "enabled",
    label: "Enabled",
    type: "checkbox" as const,
  },
];

const ALIGNMENT_COLORS = {
  good: "text-green-400 bg-green-500/10",
  neutral: "text-yellow-400 bg-yellow-500/10",
  evil: "text-red-400 bg-red-500/10",
};

export const FactionsStep: React.FC<FactionsStepProps> = ({
  data,
  onChange,
}) => {
  const [editingFaction, setEditingFaction] = useState<WorldFaction | null>(
    null,
  );
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const factions = data.factions || [];

  const handleAddFaction = () => {
    setEditingFaction(null);
    setIsEditorOpen(true);
  };

  const handleEditFaction = (faction: WorldFaction) => {
    setEditingFaction(faction);
    setIsEditorOpen(true);
  };

  const handleDeleteFaction = (id: string) => {
    onChange({
      ...data,
      factions: factions.filter((f) => f.id !== id),
    });
  };

  const handleSaveFaction = (faction: WorldFaction) => {
    if (editingFaction) {
      onChange({
        ...data,
        factions: factions.map((f) => (f.id === faction.id ? faction : f)),
      });
    } else {
      onChange({
        ...data,
        factions: [...factions, faction],
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Factions</h3>
          <p className="text-sm text-text-secondary">
            Define the major factions, organizations, and power structures
          </p>
        </div>
        <Button onClick={handleAddFaction} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Faction
        </Button>
      </div>

      {factions.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border-primary rounded-lg">
          <p className="text-text-secondary mb-4">No factions defined yet</p>
          <Button onClick={handleAddFaction} variant="secondary">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Faction
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {factions.map((faction) => (
            <div
              key={faction.id}
              className="p-4 bg-bg-tertiary border border-border-primary rounded-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <h4 className="text-base font-medium text-text-primary">
                      {faction.name}
                    </h4>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        ALIGNMENT_COLORS[faction.alignment]
                      }`}
                    >
                      {faction.alignment}
                    </span>
                    {!faction.enabled && (
                      <span className="text-xs px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded">
                        Disabled
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary line-clamp-2 mb-2">
                    {faction.description}
                  </p>
                  {faction.goals.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-xs text-text-tertiary">Goals:</span>
                      {faction.goals.map((goal, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full"
                        >
                          {goal}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEditFaction(faction)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteFaction(faction.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ArrayItemEditor
        open={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveFaction}
        item={editingFaction}
        fields={FACTION_FIELDS}
        title="Faction"
        description="Define a faction's purpose, allegiances, and influence in your world"
      />
    </div>
  );
};
