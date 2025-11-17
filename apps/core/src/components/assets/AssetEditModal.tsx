import {
  X,
  Save,
  Trash2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState, useEffect } from "react";

import type { Asset, AssetMetadata } from "../../types";
import { Modal, Button, Input } from "../common";
import { useApp } from "../../contexts/AppContext";

interface AssetEditModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedAsset: Partial<Asset>) => Promise<Asset>;
  onDelete?: (asset: Asset, includeVariants?: boolean) => void;
  hasVariants?: boolean;
}

interface AssetEditData {
  name?: string;
  description?: string;
  type?: string;
  metadata?: Partial<AssetMetadata>;
}

export function AssetEditModal({
  asset,
  isOpen,
  onClose,
  onSave,
  onDelete,
  hasVariants = false,
}: AssetEditModalProps) {
  const [editedData, setEditedData] = useState<AssetEditData>({
    name: "",
    description: "",
    type: "",
    metadata: {},
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [nameError, setNameError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { showNotification } = useApp();

  // Collapsible sections state
  const [sectionsOpen, setSectionsOpen] = useState({
    basic: true,
    generation: false,
    files: false,
    status: false,
    advanced: false,
  });

  useEffect(() => {
    if (asset) {
      setEditedData({
        name: asset.name,
        description: asset.description,
        type: asset.type,
        metadata: { ...asset.metadata },
      });
      setIsDirty(false);
      setShowDeleteConfirm(false);
      setNameError("");
    }
  }, [asset]);

  const validateName = (name: string): string => {
    if (!name.trim()) {
      return "Name is required";
    }
    if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
      return "Only letters, numbers, hyphens, and underscores allowed";
    }
    return "";
  };

  const handleChange = (field: string, value: any): void => {
    setEditedData((prev) => {
      if (field.startsWith("metadata.")) {
        const metadataField = field.replace("metadata.", "");
        return {
          ...prev,
          metadata: {
            ...(prev.metadata || {}),
            [metadataField]: value,
          },
        };
      }
      return { ...prev, [field]: value };
    });
    setIsDirty(true);

    if (field === "name") {
      setNameError(validateName(value));
    }
  };

  const handleSave = async (): Promise<void> => {
    const error = validateName(editedData.name || "");
    if (error) {
      setNameError(error);
      return;
    }

    if (asset && isDirty) {
      setIsSaving(true);
      try {
        await onSave({
          id: asset.id,
          name: editedData.name?.trim(),
          description: editedData.description,
          type: editedData.type,
          metadata: {
            ...asset.metadata,
            ...(editedData.metadata || {}),
            updatedAt: new Date().toISOString(),
          } as AssetMetadata,
        });
        // Don't close here - let the parent handle it after successful save
      } catch (error) {
        console.error("Failed to save asset:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to save asset";
        showNotification(errorMessage, "error");
        // Keep modal open on error so user can retry
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleDelete = (): void => {
    if (asset && onDelete) {
      onDelete(asset, hasVariants);
      // Don't close here - let the parent handle it
    }
  };

  const toggleSection = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  if (!asset) return null;

  // Safe accessor for metadata fields (handles union type)
  const metadata = (editedData.metadata || {}) as Record<string, any>;

  return (
    <Modal open={isOpen} onClose={onClose} className="max-w-4xl max-h-[90vh]">
      <div className="flex items-center justify-between mb-4 px-6 pt-6">
        <h2 className="text-lg font-semibold text-text-primary">
          Edit Asset Metadata
        </h2>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-bg-tertiary rounded-lg transition-colors"
        >
          <X size={18} className="text-text-secondary" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="px-6 pb-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-4">
        {/* Basic Info Section */}
        <div className="border border-border-primary rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("basic")}
            className="w-full px-4 py-3 bg-bg-tertiary hover:bg-bg-hover flex items-center justify-between transition-colors"
          >
            <span className="font-medium text-text-primary">
              Basic Information
            </span>
            {sectionsOpen.basic ? (
              <ChevronUp size={18} className="text-text-secondary" />
            ) : (
              <ChevronDown size={18} className="text-text-secondary" />
            )}
          </button>
          {sectionsOpen.basic && (
            <div className="p-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Asset Name *
                </label>
                <Input
                  value={editedData.name || ""}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g., sword-iron-basic"
                  className={`w-full ${nameError ? "border-error" : ""}`}
                />
                {nameError && (
                  <p className="text-xs text-error mt-1">{nameError}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Description
                </label>
                <textarea
                  value={editedData.description || ""}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Asset description..."
                  rows={3}
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary placeholder-text-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Type *
                  </label>
                  <select
                    value={editedData.type || ""}
                    onChange={(e) => handleChange("type", e.target.value)}
                    className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="character">Character</option>
                    <option value="weapon">Weapon</option>
                    <option value="armor">Armor</option>
                    <option value="consumable">Consumable</option>
                    <option value="tool">Tool</option>
                    <option value="decoration">Decoration</option>
                    <option value="building">Building</option>
                    <option value="environment">Environment</option>
                    <option value="prop">Prop</option>
                    <option value="resource">Resource</option>
                    <option value="misc">Misc</option>
                  </select>
                </div>

                {/* Subtype */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Subtype
                  </label>
                  <Input
                    value={metadata.subtype || ""}
                    onChange={(e) =>
                      handleChange("metadata.subtype", e.target.value)
                    }
                    placeholder="e.g., body, helmet, sword"
                  />
                </div>
              </div>

              {/* Tier */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Tier
                </label>
                <select
                  value={metadata.tier || ""}
                  onChange={(e) =>
                    handleChange("metadata.tier", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">None</option>
                  <option value="base">Base</option>
                  <option value="bronze">Bronze</option>
                  <option value="iron">Iron</option>
                  <option value="steel">Steel</option>
                  <option value="mithril">Mithril</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Notes
                </label>
                <textarea
                  value={metadata.notes || ""}
                  onChange={(e) =>
                    handleChange("metadata.notes", e.target.value)
                  }
                  placeholder="Add notes about this asset..."
                  rows={3}
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary placeholder-text-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Generation Data Section */}
        <div className="border border-border-primary rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("generation")}
            className="w-full px-4 py-3 bg-bg-tertiary hover:bg-bg-hover flex items-center justify-between transition-colors"
          >
            <span className="font-medium text-text-primary">
              Generation Data
            </span>
            {sectionsOpen.generation ? (
              <ChevronUp size={18} className="text-text-secondary" />
            ) : (
              <ChevronDown size={18} className="text-text-secondary" />
            )}
          </button>
          {sectionsOpen.generation && (
            <div className="p-4 space-y-4">
              {/* Meshy Task ID */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Meshy Task ID
                </label>
                <Input
                  value={metadata.meshyTaskId || ""}
                  onChange={(e) =>
                    handleChange("metadata.meshyTaskId", e.target.value)
                  }
                  placeholder="Meshy task ID for retexturing"
                />
              </div>

              {/* Generation Method */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Generation Method
                  </label>
                  <select
                    value={metadata.generationMethod || ""}
                    onChange={(e) =>
                      handleChange("metadata.generationMethod", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">None</option>
                    <option value="gpt-image-meshy">GPT + Image + Meshy</option>
                    <option value="direct-meshy">Direct Meshy</option>
                    <option value="manual">Manual</option>
                    <option value="placeholder">Placeholder</option>
                  </select>
                </div>

                {/* Workflow */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Workflow
                  </label>
                  <Input
                    value={metadata.workflow || ""}
                    onChange={(e) =>
                      handleChange("metadata.workflow", e.target.value)
                    }
                    placeholder="e.g., standard, quick, premium"
                  />
                </div>
              </div>

              {/* Game ID */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Game ID
                </label>
                <Input
                  value={metadata.gameId || ""}
                  onChange={(e) =>
                    handleChange("metadata.gameId", e.target.value)
                  }
                  placeholder="Game-specific identifier"
                />
              </div>
            </div>
          )}
        </div>

        {/* Status & Workflow Section */}
        <div className="border border-border-primary rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("status")}
            className="w-full px-4 py-3 bg-bg-tertiary hover:bg-bg-hover flex items-center justify-between transition-colors"
          >
            <span className="font-medium text-text-primary">
              Status & Workflow
            </span>
            {sectionsOpen.status ? (
              <ChevronUp size={18} className="text-text-secondary" />
            ) : (
              <ChevronDown size={18} className="text-text-secondary" />
            )}
          </button>
          {sectionsOpen.status && (
            <div className="p-4 space-y-4">
              {/* Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Status
                  </label>
                  <select
                    value={metadata.status || "draft"}
                    onChange={(e) =>
                      handleChange("metadata.status", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="draft">Draft</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                    <option value="approved">Approved</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                {/* Project ID */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Project ID
                  </label>
                  <Input
                    value={metadata.projectId || ""}
                    onChange={(e) =>
                      handleChange("metadata.projectId", e.target.value)
                    }
                    placeholder="Project identifier"
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={metadata.gddCompliant || false}
                    onChange={(e) =>
                      handleChange("metadata.gddCompliant", e.target.checked)
                    }
                    className="w-4 h-4 rounded border-border-primary bg-bg-tertiary checked:bg-primary cursor-pointer"
                  />
                  <span className="text-sm text-text-secondary">
                    GDD Compliant
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={metadata.isPlaceholder || false}
                    onChange={(e) =>
                      handleChange("metadata.isPlaceholder", e.target.checked)
                    }
                    className="w-4 h-4 rounded border-border-primary bg-bg-tertiary checked:bg-primary cursor-pointer"
                  />
                  <span className="text-sm text-text-secondary">
                    Is Placeholder
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={metadata.isFavorite || false}
                    onChange={(e) =>
                      handleChange("metadata.isFavorite", e.target.checked)
                    }
                    className="w-4 h-4 rounded border-border-primary bg-bg-tertiary checked:bg-primary cursor-pointer"
                  />
                  <span className="text-sm text-text-secondary">Favorite</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={metadata.normalized || false}
                    onChange={(e) =>
                      handleChange("metadata.normalized", e.target.checked)
                    }
                    className="w-4 h-4 rounded border-border-primary bg-bg-tertiary checked:bg-primary cursor-pointer"
                  />
                  <span className="text-sm text-text-secondary">
                    Normalized
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Files & CDN Section */}
        <div className="border border-border-primary rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("files")}
            className="w-full px-4 py-3 bg-bg-tertiary hover:bg-bg-hover flex items-center justify-between transition-colors"
          >
            <span className="font-medium text-text-primary">Files & CDN</span>
            {sectionsOpen.files ? (
              <ChevronUp size={18} className="text-text-secondary" />
            ) : (
              <ChevronDown size={18} className="text-text-secondary" />
            )}
          </button>
          {sectionsOpen.files && (
            <div className="p-4 space-y-4">
              {/* Model Path */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Model Path
                </label>
                <Input
                  value={metadata.modelPath || ""}
                  onChange={(e) =>
                    handleChange("metadata.modelPath", e.target.value)
                  }
                  placeholder="Path to model file"
                />
              </div>

              {/* Concept Art Path */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Concept Art Path
                </label>
                <Input
                  value={metadata.conceptArtPath || ""}
                  onChange={(e) =>
                    handleChange("metadata.conceptArtPath", e.target.value)
                  }
                  placeholder="Path to concept art"
                />
              </div>

              {/* CDN URLs (Read-only) */}
              {asset.cdnUrl && (
                <div className="p-3 bg-bg-tertiary rounded-lg">
                  <p className="text-xs text-text-tertiary mb-2">
                    CDN URL (read-only):
                  </p>
                  <p className="text-xs text-text-secondary font-mono break-all">
                    {asset.cdnUrl}
                  </p>
                </div>
              )}

              {/* Format */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Format
                </label>
                <select
                  value={metadata.format || "GLB"}
                  onChange={(e) =>
                    handleChange("metadata.format", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="GLB">GLB</option>
                  <option value="FBX">FBX</option>
                  <option value="OBJ">OBJ</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Advanced Section */}
        <div className="border border-border-primary rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("advanced")}
            className="w-full px-4 py-3 bg-bg-tertiary hover:bg-bg-hover flex items-center justify-between transition-colors"
          >
            <span className="font-medium text-text-primary">Advanced</span>
            {sectionsOpen.advanced ? (
              <ChevronUp size={18} className="text-text-secondary" />
            ) : (
              <ChevronDown size={18} className="text-text-secondary" />
            )}
          </button>
          {sectionsOpen.advanced && (
            <div className="p-4 space-y-4">
              {/* Read-only metadata info */}
              <div className="space-y-2 p-3 bg-bg-tertiary rounded-lg">
                <div className="flex justify-between text-xs">
                  <span className="text-text-tertiary">Is Base Model:</span>
                  <span className="text-text-secondary">
                    {metadata.isBaseModel ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-tertiary">Is Variant:</span>
                  <span className="text-text-secondary">
                    {metadata.isVariant ? "Yes" : "No"}
                  </span>
                </div>
                {metadata.createdAt && (
                  <div className="flex justify-between text-xs">
                    <span className="text-text-tertiary">Created:</span>
                    <span className="text-text-secondary">
                      {new Date(metadata.createdAt).toLocaleString()}
                    </span>
                  </div>
                )}
                {metadata.updatedAt && (
                  <div className="flex justify-between text-xs">
                    <span className="text-text-tertiary">Updated:</span>
                    <span className="text-text-secondary">
                      {new Date(metadata.updatedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2 pt-2">
                {asset.hasModel && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500 bg-opacity-20 text-green-300">
                    Has Model
                  </span>
                )}
                {hasVariants && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500 bg-opacity-20 text-blue-300">
                    Has Variants
                  </span>
                )}
                {metadata.isBaseModel && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-bg-tertiary text-text-secondary">
                    Base Model
                  </span>
                )}
                {metadata.isPlaceholder && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-500 bg-opacity-20 text-yellow-300">
                    Placeholder
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons - Fixed at bottom */}
      <div className="flex justify-between items-center mt-4 px-6 pb-6 border-t border-border-primary pt-4">
        {/* Delete Button */}
        {onDelete && (
          <div>
            {!showDeleteConfirm ? (
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-error hover:text-error"
              >
                <Trash2 size={16} className="mr-1.5" />
                Delete
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-error" />
                <span className="text-sm text-text-primary mr-2">Delete?</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  No
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleDelete}
                  className="bg-error hover:bg-error hover:opacity-90"
                >
                  Yes
                </Button>
              </div>
            )}
          </div>
        )}

        {/* If no delete option, add empty div to maintain layout */}
        {!onDelete && <div />}

        {/* Save/Cancel Buttons */}
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!isDirty || !!nameError || isSaving}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} className="mr-1.5" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
