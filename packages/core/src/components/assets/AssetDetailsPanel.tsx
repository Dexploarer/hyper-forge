/**
 * Asset Details Panel
 * Sliding side panel with asset information, metadata, and actions
 */

import {
  X,
  Package,
  Hash,
  Tag,
  Calendar,
  Layers,
  Palette,
  Box,
  FileCode,
  ChevronRight,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  Download,
  Share2,
  Code,
  FileText,
  Trash2,
  Edit,
  Image as ImageIcon,
} from "lucide-react";
import React, { useState } from "react";

import { getTierColor } from "@/constants";
import { Asset } from "@/types";
import { AssetService } from "@/services/api/AssetService";

interface AssetDetailsPanelProps {
  asset: Asset;
  isOpen: boolean;
  onClose: () => void;
  onCreateVariants?: (asset: Asset) => void;
  onDelete?: (asset: Asset) => void;
  onEdit?: (asset: Asset) => void;
  modelInfo?: {
    vertices: number;
    faces: number;
    materials: number;
    fileSize?: number;
  } | null;
}

const AssetDetailsPanel: React.FC<AssetDetailsPanelProps> = ({
  asset,
  isOpen,
  onClose,
  onCreateVariants,
  onDelete,
  onEdit,
  modelInfo,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "metadata" | "actions">(
    "info",
  );
  const [imageError, setImageError] = useState(false);

  const previewUrl = AssetService.getPreviewImageUrl(asset);
  const hasPreview = previewUrl && !imageError;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "Unknown";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleDownload = async () => {
    try {
      const modelUrl = AssetService.getModelUrl(asset.id);
      const response = await fetch(modelUrl);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${asset.name}.glb`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download model:", error);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-96 solid-panel shadow-2xl transform transition-all duration-300 ease-out z-40 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Preview Image Header */}
          <div className="relative h-56 bg-bg-tertiary border-b border-border-primary">
            {hasPreview ? (
              <img
                src={previewUrl}
                alt={asset.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-bg-tertiary to-bg-secondary">
                <Package className="w-16 h-16 text-text-tertiary opacity-30" />
              </div>
            )}

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/50 to-transparent" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg bg-white/90 backdrop-blur-sm hover:bg-white transition-all shadow-sm z-10"
              aria-label="Close details panel"
            >
              <X size={18} className="text-gray-900" />
            </button>

            {/* Asset info overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <h2 className="text-xl font-bold text-white mb-2 line-clamp-2">
                {asset.name}
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {asset.hasModel && (
                  <div className="px-2 py-1 bg-success/90 backdrop-blur-sm text-white rounded-md text-xs font-medium flex items-center gap-1">
                    <Sparkles size={12} />
                    <span>3D Model</span>
                  </div>
                )}
                {asset.metadata?.isBaseModel && (
                  <div className="px-2 py-1 bg-primary/90 backdrop-blur-sm text-white rounded-md text-xs font-medium">
                    BASE
                  </div>
                )}
                {asset.metadata?.isPlaceholder && (
                  <div className="px-2 py-1 bg-warning/90 backdrop-blur-sm text-white rounded-md text-xs font-medium flex items-center gap-1">
                    <AlertCircle size={12} />
                    <span>Placeholder</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border-primary bg-bg-secondary">
            <button
              onClick={() => setActiveTab("info")}
              className={`flex-1 px-4 py-3 text-xs font-medium transition-colors relative ${
                activeTab === "info"
                  ? "text-primary bg-bg-primary"
                  : "text-text-tertiary hover:text-text-secondary hover:bg-bg-hover"
              }`}
            >
              Information
              {activeTab === "info" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("metadata")}
              className={`flex-1 px-4 py-3 text-xs font-medium transition-colors relative ${
                activeTab === "metadata"
                  ? "text-primary bg-bg-primary"
                  : "text-text-tertiary hover:text-text-secondary hover:bg-bg-hover"
              }`}
            >
              Metadata
              {activeTab === "metadata" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("actions")}
              className={`flex-1 px-4 py-3 text-xs font-medium transition-colors relative ${
                activeTab === "actions"
                  ? "text-primary bg-bg-primary"
                  : "text-text-tertiary hover:text-text-secondary hover:bg-bg-hover"
              }`}
            >
              Actions
              {activeTab === "actions" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Information Tab */}
            {activeTab === "info" && (
              <div className="p-5 space-y-4">
                {/* Basic Info */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3 group">
                    <Hash className="text-text-muted mt-0.5" size={14} />
                    <div className="flex-1">
                      <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">
                        Asset ID
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-text-secondary font-mono">
                          {asset.id}
                        </p>
                        <button
                          onClick={() => copyToClipboard(asset.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {copiedId ? (
                            <Check size={12} className="text-success" />
                          ) : (
                            <Copy
                              size={12}
                              className="text-text-muted hover:text-text-primary"
                            />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Package className="text-text-muted mt-0.5" size={14} />
                    <div className="flex-1">
                      <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">
                        Type
                      </p>
                      <p className="text-xs text-text-primary capitalize font-medium">
                        {asset.type}
                      </p>
                    </div>
                  </div>

                  {asset.metadata?.subtype && (
                    <div className="flex items-start gap-3">
                      <Tag className="text-text-muted mt-0.5" size={14} />
                      <div className="flex-1">
                        <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">
                          Subtype
                        </p>
                        <p className="text-xs text-text-primary capitalize font-medium">
                          {asset.metadata.subtype}
                        </p>
                      </div>
                    </div>
                  )}

                  {asset.metadata?.tier && (
                    <div className="flex items-start gap-3">
                      <Layers className="text-text-muted mt-0.5" size={14} />
                      <div className="flex-1">
                        <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">
                          Tier
                        </p>
                        <div
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium"
                          style={{
                            backgroundColor: `${getTierColor(asset.metadata.tier)}20`,
                            color: getTierColor(asset.metadata.tier),
                          }}
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: getTierColor(
                                asset.metadata.tier,
                              ),
                            }}
                          />
                          {asset.metadata.tier}
                        </div>
                      </div>
                    </div>
                  )}

                  {asset.generatedAt && (
                    <div className="flex items-start gap-3">
                      <Calendar className="text-text-muted mt-0.5" size={14} />
                      <div className="flex-1">
                        <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">
                          Created
                        </p>
                        <p className="text-xs text-text-primary font-medium">
                          {new Date(asset.generatedAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Model Info */}
                {asset.hasModel && (
                  <div className="pt-4 border-t border-border-primary">
                    <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                      <Box size={14} className="text-primary" />
                      3D Model Information
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-bg-secondary rounded-lg border border-border-primary">
                        <p className="text-xs text-text-tertiary mb-1">
                          Polygons
                        </p>
                        <p className="text-sm text-text-primary font-semibold">
                          {modelInfo?.faces
                            ? modelInfo.faces.toLocaleString()
                            : "..."}
                        </p>
                      </div>
                      <div className="p-3 bg-bg-secondary rounded-lg border border-border-primary">
                        <p className="text-xs text-text-tertiary mb-1">
                          Vertices
                        </p>
                        <p className="text-sm text-text-primary font-semibold">
                          {modelInfo?.vertices
                            ? modelInfo.vertices.toLocaleString()
                            : "..."}
                        </p>
                      </div>
                      <div className="p-3 bg-bg-secondary rounded-lg border border-border-primary">
                        <p className="text-xs text-text-tertiary mb-1">
                          File Size
                        </p>
                        <p className="text-sm text-text-primary font-semibold">
                          {modelInfo?.fileSize
                            ? formatFileSize(modelInfo.fileSize)
                            : "..."}
                        </p>
                      </div>
                      <div className="p-3 bg-bg-secondary rounded-lg border border-border-primary">
                        <p className="text-xs text-text-tertiary mb-1">
                          Format
                        </p>
                        <p className="text-sm text-text-primary font-semibold uppercase">
                          GLB
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Description */}
                {asset.description && (
                  <div className="pt-4 border-t border-border-primary">
                    <h3 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                      <FileText size={14} className="text-primary" />
                      Description
                    </h3>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {asset.description}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Metadata Tab */}
            {activeTab === "metadata" && (
              <div className="p-5">
                {Object.keys(asset.metadata).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(asset.metadata)
                      .filter(
                        ([key]) =>
                          ![
                            "tier",
                            "subtype",
                            "isPlaceholder",
                            "isFavorite",
                          ].includes(key),
                      )
                      .map(([key, value]) => (
                        <div
                          key={key}
                          className="py-2.5 border-b border-border-primary last:border-0"
                        >
                          <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </p>
                          <p className="text-xs text-text-primary font-medium">
                            {typeof value === "boolean"
                              ? value
                                ? "Yes"
                                : "No"
                              : typeof value === "object"
                                ? JSON.stringify(value, null, 2)
                                : String(value)}
                          </p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileCode
                      size={32}
                      className="text-text-muted mx-auto mb-3 opacity-50"
                    />
                    <p className="text-sm text-text-tertiary">
                      No additional metadata
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Actions Tab */}
            {activeTab === "actions" && (
              <div className="p-5 space-y-2">
                {onCreateVariants && (
                  <button
                    onClick={() => onCreateVariants(asset)}
                    className="w-full px-4 py-3 bg-primary bg-opacity-10 hover:bg-opacity-20 text-primary rounded-lg transition-all flex items-center justify-between group text-sm font-medium border border-primary border-opacity-20"
                  >
                    <div className="flex items-center gap-2">
                      <Palette size={16} />
                      <span>Create Variants</span>
                    </div>
                    <ChevronRight
                      size={16}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </button>
                )}

                <button
                  onClick={handleDownload}
                  className="w-full px-4 py-3 bg-bg-secondary hover:bg-bg-tertiary text-text-primary rounded-lg transition-all flex items-center justify-between group text-sm font-medium border border-border-primary"
                >
                  <div className="flex items-center gap-2">
                    <Download size={16} />
                    <span>Download Model</span>
                  </div>
                  <ChevronRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </button>

                <button className="w-full px-4 py-3 bg-bg-secondary hover:bg-bg-tertiary text-text-primary rounded-lg transition-all flex items-center justify-between group text-sm font-medium border border-border-primary">
                  <div className="flex items-center gap-2">
                    <Code size={16} />
                    <span>View in Editor</span>
                  </div>
                  <ChevronRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </button>

                <button className="w-full px-4 py-3 bg-bg-secondary hover:bg-bg-tertiary text-text-primary rounded-lg transition-all flex items-center justify-between group text-sm font-medium border border-border-primary">
                  <div className="flex items-center gap-2">
                    <Share2 size={16} />
                    <span>Share Asset</span>
                  </div>
                  <ChevronRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </button>

                {onEdit && (
                  <button
                    onClick={() => onEdit(asset)}
                    className="w-full px-4 py-3 bg-bg-secondary hover:bg-bg-tertiary text-text-primary rounded-lg transition-all flex items-center justify-between group text-sm font-medium border border-border-primary"
                  >
                    <div className="flex items-center gap-2">
                      <Edit size={16} />
                      <span>Edit Metadata</span>
                    </div>
                    <ChevronRight
                      size={16}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </button>
                )}

                {onDelete && (
                  <>
                    <div className="border-t border-border-primary my-4" />
                    <button
                      onClick={() => onDelete(asset)}
                      className="w-full px-4 py-3 bg-error bg-opacity-10 hover:bg-opacity-20 text-error rounded-lg transition-all flex items-center justify-between group text-sm font-medium border border-error border-opacity-20"
                    >
                      <div className="flex items-center gap-2">
                        <Trash2 size={16} />
                        <span>Delete Asset</span>
                      </div>
                      <ChevronRight
                        size={16}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AssetDetailsPanel;
