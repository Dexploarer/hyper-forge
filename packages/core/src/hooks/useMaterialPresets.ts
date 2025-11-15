import { useCallback } from "react";

import { useGenerationStore } from "../store";
import { MaterialPreset } from "../types";
import { notify } from "../utils/notify";

import { api } from "@/lib/api-client";

export function useMaterialPresets() {
  const {
    materialPresets,
    customMaterials,
    selectedMaterials,
    setMaterialPresets,
    setCustomMaterials,
    setSelectedMaterials,
    setEditingPreset,
    setShowDeleteConfirm,
  } = useGenerationStore();

  const handleSaveCustomMaterials = useCallback(async () => {
    try {
      // Filter valid custom materials
      const validMaterials = customMaterials.filter((m) => m.name && m.prompt);

      // Create each material individually using the POST /material-presets/custom endpoint
      const createdPresets = [];
      for (const mat of validMaterials) {
        const { data, error } = await api.api["material-presets"].custom.post({
          displayName: mat.displayName || mat.name,
          name: mat.name.toLowerCase().replace(/\s+/g, "-"),
          stylePrompt: mat.prompt,
          category: "custom",
          description: "Custom material",
          tier: materialPresets.length + createdPresets.length + 1,
          color: mat.color || "#888888",
          isPublic: false,
        });

        if (error || !data) {
          console.error(`Failed to create material ${mat.name}:`, error);
          throw new Error(`Failed to create material: ${mat.name}`);
        }

        // Convert database result to MaterialPreset instance
        const dbPreset = data as {
          id: string;
          name: string;
          displayName: string;
          category: string;
          tier: number;
          color: string | null;
          stylePrompt: string;
          description: string | null;
        };

        const preset = MaterialPreset.fromJSON({
          id: dbPreset.id,
          name: dbPreset.name,
          displayName: dbPreset.displayName,
          category: dbPreset.category,
          tier: dbPreset.tier,
          color: dbPreset.color || "#888888",
          stylePrompt: dbPreset.stylePrompt,
          description: dbPreset.description || undefined,
        });
        createdPresets.push(preset);
      }

      // Update local state with new presets
      const updatedPresets = [...materialPresets, ...createdPresets];
      setMaterialPresets(updatedPresets);
      setCustomMaterials([]);
      notify.success("Custom materials saved successfully!");
    } catch (error) {
      console.error("Failed to save custom materials:", error);
      notify.error("Failed to save custom materials.");
    }
  }, [
    customMaterials,
    materialPresets,
    setMaterialPresets,
    setCustomMaterials,
  ]);

  const handleUpdatePreset = useCallback(
    async (updatedPreset: MaterialPreset) => {
      try {
        // Use PUT /material-presets/:id endpoint
        const { data, error } = await (api.api["material-presets"] as any)[
          updatedPreset.id
        ].put({
          displayName: updatedPreset.displayName,
          stylePrompt: updatedPreset.stylePrompt,
          category: updatedPreset.category,
          tier: updatedPreset.tier,
          description: updatedPreset.description || undefined,
          color: updatedPreset.color || undefined,
          isActive: true,
          isPublic: false,
        });

        if (error || !data) {
          throw new Error("Failed to update preset");
        }

        // Convert database result to MaterialPreset instance
        const dbPreset = data as {
          id: string;
          name: string;
          displayName: string;
          category: string;
          tier: number;
          color: string | null;
          stylePrompt: string;
          description: string | null;
        };

        const preset = MaterialPreset.fromJSON({
          id: dbPreset.id,
          name: dbPreset.name,
          displayName: dbPreset.displayName,
          category: dbPreset.category,
          tier: dbPreset.tier,
          color: dbPreset.color || "#888888",
          stylePrompt: dbPreset.stylePrompt,
          description: dbPreset.description || undefined,
        });

        // Update local state
        const updatedPresets = materialPresets.map((p) =>
          p.id === updatedPreset.id ? preset : p,
        );
        setMaterialPresets(updatedPresets);
        setEditingPreset(null);
        notify.success("Material preset updated successfully!");
      } catch (error) {
        console.error("Failed to update preset:", error);
        notify.error("Failed to update material preset.");
      }
    },
    [materialPresets, setMaterialPresets, setEditingPreset],
  );

  const handleDeletePreset = useCallback(
    async (presetId: string) => {
      try {
        // Use DELETE /material-presets/:id endpoint
        const { error } = await (api.api["material-presets"] as any)[
          presetId
        ].delete();

        if (error) {
          throw new Error("Failed to delete preset");
        }

        // Update local state
        const updatedPresets = materialPresets.filter(
          (preset) => preset.id !== presetId,
        );
        setMaterialPresets(updatedPresets);
        setSelectedMaterials(selectedMaterials.filter((id) => id !== presetId));
        setShowDeleteConfirm(null);
        notify.success("Material preset deleted successfully!");
      } catch (error) {
        console.error("Failed to delete preset:", error);
        notify.error("Failed to delete material preset.");
      }
    },
    [
      materialPresets,
      selectedMaterials,
      setMaterialPresets,
      setSelectedMaterials,
      setShowDeleteConfirm,
    ],
  );

  return {
    handleSaveCustomMaterials,
    handleUpdatePreset,
    handleDeletePreset,
  };
}
