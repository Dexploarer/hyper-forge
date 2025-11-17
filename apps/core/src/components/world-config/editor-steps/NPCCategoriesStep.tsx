import { Plus, Edit, Trash2, Users } from "lucide-react";
import React, { useState } from "react";

import { Button } from "@/components/common";
import { ArrayItemEditor } from "../shared/ArrayItemEditor";

interface NPCCategory {
  id: string;
  name: string;
  archetypes: string[];
  commonTraits: string[];
  typicalRoles: string[];
  enabled: boolean;
}

interface NPCCategoriesStepProps {
  data: { npcCategories?: NPCCategory[] };
  onChange: (data: any) => void;
}

const NPC_CATEGORY_FIELDS = [
  {
    name: "name",
    label: "Category Name",
    type: "text" as const,
    placeholder: "e.g., Merchants, Guards, Scholars",
    required: true,
    maxLength: 100,
  },
  {
    name: "archetypes",
    label: "Archetypes",
    type: "list" as const,
    placeholder: "e.g., Greedy merchant, Corrupt guard",
    required: true,
  },
  {
    name: "commonTraits",
    label: "Common Traits",
    type: "list" as const,
    placeholder: "e.g., Greedy, Loyal, Cunning",
    required: true,
  },
  {
    name: "typicalRoles",
    label: "Typical Roles",
    type: "list" as const,
    placeholder: "e.g., Shop keeper, Quest giver",
    required: true,
  },
  {
    name: "enabled",
    label: "Enabled",
    type: "checkbox" as const,
  },
];

export const NPCCategoriesStep: React.FC<NPCCategoriesStepProps> = ({
  data,
  onChange,
}) => {
  const [editingCategory, setEditingCategory] = useState<NPCCategory | null>(
    null,
  );
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const categories = data.npcCategories || [];

  const handleAddCategory = () => {
    setEditingCategory(null);
    setIsEditorOpen(true);
  };

  const handleEditCategory = (category: NPCCategory) => {
    setEditingCategory(category);
    setIsEditorOpen(true);
  };

  const handleDeleteCategory = (id: string) => {
    onChange({
      ...data,
      npcCategories: categories.filter((c) => c.id !== id),
    });
  };

  const handleSaveCategory = (category: NPCCategory) => {
    if (editingCategory) {
      onChange({
        ...data,
        npcCategories: categories.map((c) =>
          c.id === category.id ? category : c,
        ),
      });
    } else {
      onChange({
        ...data,
        npcCategories: [...categories, category],
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">
            NPC Categories
          </h3>
          <p className="text-sm text-text-secondary">
            Define common NPC types and their characteristics for AI generation
          </p>
        </div>
        <Button onClick={handleAddCategory} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border-primary rounded-lg">
          <p className="text-text-secondary mb-4">
            No NPC categories defined yet
          </p>
          <Button onClick={handleAddCategory} variant="secondary">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Category
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="p-4 bg-bg-tertiary border border-border-primary rounded-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-primary" />
                    <h4 className="text-base font-medium text-text-primary">
                      {category.name}
                    </h4>
                    {!category.enabled && (
                      <span className="text-xs px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded">
                        Disabled
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 text-xs">
                    {category.archetypes.length > 0 && (
                      <div>
                        <span className="text-text-tertiary">Archetypes: </span>
                        <span className="text-text-secondary">
                          {category.archetypes.join(", ")}
                        </span>
                      </div>
                    )}
                    {category.typicalRoles.length > 0 && (
                      <div>
                        <span className="text-text-tertiary">Roles: </span>
                        <span className="text-text-secondary">
                          {category.typicalRoles.join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEditCategory(category)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteCategory(category.id)}
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
        onSave={handleSaveCategory}
        item={editingCategory}
        fields={NPC_CATEGORY_FIELDS}
        title="NPC Category"
        description="Define a category of NPCs with common characteristics and roles"
      />
    </div>
  );
};
