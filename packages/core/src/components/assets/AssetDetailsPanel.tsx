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
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  Download,
  Share2,
  FileText,
  Trash2,
  Edit,
  Palette,
  FileCode,
  Link,
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
  const [copiedLink, setCopiedLink] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
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

  const getShareUrl = () => {
    return `${window.location.origin}/assets/${asset.id}`;
  };

  const getShareText = () => {
    return `Check out my ${asset.type} '${asset.name}' created with Hyperforge, part of the Hyperscape Ecosystem! 🎮✨`;
  };

  const handleCopyLink = () => {
    const shareUrl = getShareUrl();
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => {
      setCopiedLink(false);
      setShowShareMenu(false);
    }, 2000);
  };

  const handleShareOnX = () => {
    const text = getShareText();
    const url = getShareUrl();
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, "_blank", "noopener,noreferrer");
    setShowShareMenu(false);
  };

  const handleShareOnFarcaster = () => {
    const text = getShareText();
    const url = getShareUrl();
    const farcasterUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(`${text}\n\n${url}`)}`;
    window.open(farcasterUrl, "_blank", "noopener,noreferrer");
    setShowShareMenu(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-overlay"
        data-overlay="true"
        onClick={onClose}
      />

      {/* Sliding Panel */}
      <div className="fixed top-0 right-0 h-screen w-[400px] bg-bg-primary shadow-2xl z-modal flex flex-col border-l border-border-primary">
        {/* Header with Preview Image */}
        <div className="relative h-48 bg-gradient-to-br from-bg-secondary to-bg-tertiary flex-shrink-0">
          {hasPreview ? (
            <img
              src={previewUrl}
              alt={asset.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="w-20 h-20 text-text-muted opacity-20" />
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-lg bg-white/95 hover:bg-white transition-colors shadow-lg"
            aria-label="Close panel"
          >
            <X size={18} className="text-gray-900" />
          </button>

          {/* Asset name and badges */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h2 className="text-lg font-bold text-white mb-2 line-clamp-2 drop-shadow-lg">
              {asset.name}
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {asset.hasModel && (
                <span className="px-2 py-1 bg-success/90 backdrop-blur-sm text-white rounded text-xs font-semibold flex items-center gap-1 shadow-sm">
                  <Sparkles size={12} />
                  3D Model
                </span>
              )}
              {asset.metadata?.isBaseModel && (
                <span className="px-2 py-1 bg-primary/90 backdrop-blur-sm text-white rounded text-xs font-semibold shadow-sm">
                  BASE
                </span>
              )}
              {asset.metadata?.isPlaceholder && (
                <span className="px-2 py-1 bg-warning/90 backdrop-blur-sm text-white rounded text-xs font-semibold flex items-center gap-1 shadow-sm">
                  <AlertCircle size={12} />
                  Placeholder
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-primary bg-bg-secondary flex-shrink-0">
          <button
            onClick={() => setActiveTab("info")}
            className={`flex-1 px-4 py-3 text-xs font-semibold transition-all relative ${
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
            className={`flex-1 px-4 py-3 text-xs font-semibold transition-all relative ${
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
            className={`flex-1 px-4 py-3 text-xs font-semibold transition-all relative ${
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* INFORMATION TAB */}
          {activeTab === "info" && (
            <div className="p-5 space-y-4">
              {/* Asset ID */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-text-muted uppercase">
                  Asset ID
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-bg-secondary border border-border-primary rounded text-xs font-mono text-text-primary">
                    {asset.id}
                  </code>
                  <button
                    onClick={() => copyToClipboard(asset.id)}
                    className="p-2 hover:bg-bg-secondary rounded transition-colors"
                    title="Copy ID"
                  >
                    {copiedId ? (
                      <Check size={16} className="text-success" />
                    ) : (
                      <Copy size={16} className="text-text-muted" />
                    )}
                  </button>
                </div>
              </div>

              {/* Type */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-text-muted uppercase">
                  Type
                </label>
                <div className="px-3 py-2 bg-bg-secondary border border-border-primary rounded">
                  <p className="text-sm font-semibold text-text-primary capitalize">
                    {asset.type}
                  </p>
                </div>
              </div>

              {/* Subtype */}
              {asset.metadata?.subtype && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-text-muted uppercase">
                    Subtype
                  </label>
                  <div className="px-3 py-2 bg-bg-secondary border border-border-primary rounded">
                    <p className="text-sm font-semibold text-text-primary capitalize">
                      {asset.metadata.subtype}
                    </p>
                  </div>
                </div>
              )}

              {/* Tier */}
              {asset.metadata?.tier && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-text-muted uppercase">
                    Tier
                  </label>
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded font-semibold text-sm"
                    style={{
                      backgroundColor: `${getTierColor(asset.metadata.tier)}15`,
                      color: getTierColor(asset.metadata.tier),
                      borderWidth: "2px",
                      borderStyle: "solid",
                      borderColor: getTierColor(asset.metadata.tier),
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: getTierColor(asset.metadata.tier),
                      }}
                    />
                    {asset.metadata.tier}
                  </div>
                </div>
              )}

              {/* Created Date */}
              {asset.generatedAt && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-text-muted uppercase">
                    Created
                  </label>
                  <div className="px-3 py-2 bg-bg-secondary border border-border-primary rounded">
                    <p className="text-sm font-semibold text-text-primary">
                      {new Date(asset.generatedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* Model Stats */}
              {asset.hasModel && (
                <>
                  <div className="border-t border-border-primary pt-4" />
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-text-primary uppercase">
                      3D Model Stats
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-text-muted uppercase">
                          Polygons
                        </p>
                        <p className="text-xl font-bold text-text-primary">
                          {modelInfo?.faces
                            ? modelInfo.faces.toLocaleString()
                            : "—"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-text-muted uppercase">
                          Vertices
                        </p>
                        <p className="text-xl font-bold text-text-primary">
                          {modelInfo?.vertices
                            ? modelInfo.vertices.toLocaleString()
                            : "—"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-text-muted uppercase">
                          File Size
                        </p>
                        <p className="text-xl font-bold text-text-primary">
                          {modelInfo?.fileSize
                            ? formatFileSize(modelInfo.fileSize)
                            : "—"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-text-muted uppercase">
                          Format
                        </p>
                        <p className="text-xl font-bold text-text-primary">
                          GLB
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Description */}
              {asset.description && (
                <>
                  <div className="border-t border-border-primary pt-4" />
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-text-muted uppercase">
                      Description
                    </label>
                    <div className="px-3 py-2 bg-bg-secondary border border-border-primary rounded">
                      <p className="text-sm text-text-secondary leading-relaxed">
                        {asset.description}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* METADATA TAB */}
          {activeTab === "metadata" && (
            <div className="p-5">
              {Object.keys(asset.metadata).filter(
                (key) =>
                  !["tier", "subtype", "isPlaceholder", "isFavorite"].includes(
                    key,
                  ),
              ).length > 0 ? (
                <div className="space-y-4">
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
                      <div key={key} className="space-y-1.5">
                        <label className="block text-xs font-semibold text-text-muted uppercase">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </label>
                        <div className="px-3 py-2 bg-bg-secondary border border-border-primary rounded">
                          <p className="text-sm text-text-primary font-medium break-all">
                            {typeof value === "boolean"
                              ? value
                                ? "Yes"
                                : "No"
                              : typeof value === "object"
                                ? JSON.stringify(value, null, 2)
                                : String(value)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <FileCode
                    size={48}
                    className="text-text-muted mx-auto mb-4 opacity-20"
                  />
                  <p className="text-sm font-semibold text-text-tertiary mb-1">
                    No additional metadata
                  </p>
                  <p className="text-xs text-text-muted">
                    Additional properties will appear here
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ACTIONS TAB */}
          {activeTab === "actions" && (
            <div className="p-5 space-y-3">
              {onCreateVariants && (
                <button
                  onClick={() => onCreateVariants(asset)}
                  className="w-full px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded transition-colors flex items-center gap-2.5 text-sm font-semibold"
                >
                  <Palette size={18} />
                  <span>Create Variants</span>
                </button>
              )}

              <button
                onClick={handleDownload}
                className="w-full px-4 py-3 bg-bg-secondary hover:bg-bg-tertiary text-text-primary rounded transition-colors flex items-center gap-2.5 text-sm font-semibold border border-border-primary"
              >
                <Download size={18} />
                <span>Download Model</span>
              </button>

              {/* Share Asset Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="w-full px-4 py-3 bg-bg-secondary hover:bg-bg-tertiary text-text-primary rounded transition-colors flex items-center gap-2.5 text-sm font-semibold border border-border-primary"
                >
                  <Share2 size={18} />
                  <span>Share Asset</span>
                </button>

                {/* Share Menu Dropdown */}
                {showShareMenu && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-bg-primary border border-border-primary rounded-lg shadow-xl overflow-hidden z-dropdown">
                    <button
                      onClick={handleShareOnX}
                      className="w-full px-4 py-3 hover:bg-bg-hover text-text-primary transition-colors flex items-center gap-3 text-sm font-medium border-b border-border-primary"
                    >
                      <X size={16} />
                      <span>Share on X</span>
                    </button>
                    <button
                      onClick={handleShareOnFarcaster}
                      className="w-full px-4 py-3 hover:bg-bg-hover text-text-primary transition-colors flex items-center gap-3 text-sm font-medium border-b border-border-primary"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 1000 1000"
                        fill="currentColor"
                        className="flex-shrink-0"
                      >
                        <path d="M257.778 155.556H742.222V844.444H671.111V528.889H670.414C662.554 441.677 589.258 373.333 500 373.333C410.742 373.333 337.446 441.677 329.586 528.889H328.889V844.444H257.778V155.556Z" />
                        <path d="M128.889 253.333L156.444 326.111H184V485.556H156.444L128.889 558.333H256.111L283.667 485.556H256.111V326.111H283.667L256.111 253.333H128.889Z" />
                        <path d="M743.889 253.333L771.444 326.111H799V485.556H771.444L743.889 558.333H871.111L898.667 485.556H871.111V326.111H898.667L871.111 253.333H743.889Z" />
                      </svg>
                      <span>Share on Farcaster</span>
                    </button>
                    <button
                      onClick={handleCopyLink}
                      className="w-full px-4 py-3 hover:bg-bg-hover text-text-primary transition-colors flex items-center gap-3 text-sm font-medium"
                    >
                      {copiedLink ? (
                        <>
                          <Check size={16} className="text-success" />
                          <span className="text-success">Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Link size={16} />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {onEdit && (
                <button
                  onClick={() => onEdit(asset)}
                  className="w-full px-4 py-3 bg-bg-secondary hover:bg-bg-tertiary text-text-primary rounded transition-colors flex items-center gap-2.5 text-sm font-semibold border border-border-primary"
                >
                  <Edit size={18} />
                  <span>Edit Metadata</span>
                </button>
              )}

              {onDelete && (
                <>
                  <div className="border-t border-border-primary my-5" />
                  <button
                    onClick={() => onDelete(asset)}
                    className="w-full px-4 py-3 bg-error hover:bg-error/90 text-white rounded transition-colors flex items-center gap-2.5 text-sm font-semibold"
                  >
                    <Trash2 size={18} />
                    <span>Delete Asset</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AssetDetailsPanel;
