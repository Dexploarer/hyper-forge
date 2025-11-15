import { Plus, Edit, Trash2 } from "lucide-react";
import React, { useState } from "react";

import { Button } from "@/components/common";
import { ArrayItemEditor } from "../shared/ArrayItemEditor";

interface WorldRace {
  id: string;
  name: string;
  description: string;
  traits: string[];
  culturalBackground: string;
  enabled: boolean;
  createdAt: string;
}

interface RacesStepProps {
  data: { races?: WorldRace[] };
  onChange: (data: any) => void;
}

const RACE_FIELDS = [
  {
    name: "name",
    label: "Race Name",
    type: "text" as const,
    placeholder: "e.g., Elves, Dwarves, Humans",
    required: true,
    maxLength: 100,
  },
  {
    name: "description",
    label: "Description",
    type: "textarea" as const,
    placeholder: "Describe the race's characteristics and history",
    required: true,
    maxLength: 500,
  },
  {
    name: "traits",
    label: "Traits",
    type: "list" as const,
    placeholder: "e.g., Agile, Long-lived, Nature-affinity",
    required: true,
  },
  {
    name: "culturalBackground",
    label: "Cultural Background",
    type: "textarea" as const,
    placeholder: "Describe the race's culture, traditions, and society",
    required: true,
    maxLength: 500,
  },
  {
    name: "enabled",
    label: "Enabled",
    type: "checkbox" as const,
  },
];

export const RacesStep: React.FC<RacesStepProps> = ({ data, onChange }) => {
  const [editingRace, setEditingRace] = useState<WorldRace | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const races = data.races || [];

  const handleAddRace = () => {
    setEditingRace(null);
    setIsEditorOpen(true);
  };

  const handleEditRace = (race: WorldRace) => {
    setEditingRace(race);
    setIsEditorOpen(true);
  };

  const handleDeleteRace = (id: string) => {
    onChange({
      ...data,
      races: races.filter((r) => r.id !== id),
    });
  };

  const handleSaveRace = (race: WorldRace) => {
    if (editingRace) {
      // Update existing
      onChange({
        ...data,
        races: races.map((r) => (r.id === race.id ? race : r)),
      });
    } else {
      // Add new
      onChange({
        ...data,
        races: [...races, race],
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Races</h3>
          <p className="text-sm text-text-secondary">
            Define the playable and non-playable races in your world
          </p>
        </div>
        <Button onClick={handleAddRace} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Race
        </Button>
      </div>

      {races.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border-primary rounded-lg">
          <p className="text-text-secondary mb-4">No races defined yet</p>
          <Button onClick={handleAddRace} variant="secondary">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Race
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {races.map((race) => (
            <div
              key={race.id}
              className="p-4 bg-bg-tertiary border border-border-primary rounded-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-base font-medium text-text-primary">
                      {race.name}
                    </h4>
                    {!race.enabled && (
                      <span className="text-xs px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded">
                        Disabled
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary line-clamp-2 mb-2">
                    {race.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {race.traits.map((trait, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEditRace(race)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteRace(race.id)}
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
        onSave={handleSaveRace}
        item={editingRace}
        fields={RACE_FIELDS}
        title="Race"
        description="Define a race's characteristics and cultural identity"
      />
    </div>
  );
};
