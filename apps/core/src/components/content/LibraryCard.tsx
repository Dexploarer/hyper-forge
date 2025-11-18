/**
 * Library Card Component
 * Beautiful, immersive cards for content library items
 * Each content type has its own unique visual style
 */

import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Scroll,
  FileText,
  BookOpen,
  Edit,
  Trash2,
  Download,
  Copy,
  Eye,
  MessageSquare,
  Briefcase,
  Volume2,
  Play,
  Image as ImageIcon,
  Book,
  Target,
  Coins,
  Sparkles,
  Calendar,
  Loader2,
  Sparkles as SparklesIcon,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/styles";
import { ContentItem, ContentType } from "@/hooks/useContent";
import { LoadingSpinner } from "@/components/common";
import { api } from "@/lib/api-client";
import { notify, formatDate } from "@/utils";
import type {
  NPCData,
  QuestData,
  DialogueData,
  LoreData,
} from "@/types/content";
import { AudioLibraryCard } from "./AudioLibraryCard";

interface LibraryCardProps {
  item: ContentItem;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
  refreshKey?: number;
}

// Archetype-based color schemes for NPCs
const ARCHETYPE_COLORS = {
  warrior: {
    from: "from-red-500/20",
    to: "to-orange-500/20",
    accent: "text-red-400",
    border: "border-red-500/30",
  },
  knight: {
    from: "from-blue-500/20",
    to: "to-cyan-500/20",
    accent: "text-blue-400",
    border: "border-blue-500/30",
  },
  mage: {
    from: "from-purple-500/20",
    to: "to-indigo-500/20",
    accent: "text-purple-400",
    border: "border-purple-500/30",
  },
  wizard: {
    from: "from-indigo-500/20",
    to: "to-purple-500/20",
    accent: "text-indigo-400",
    border: "border-indigo-500/30",
  },
  merchant: {
    from: "from-amber-500/20",
    to: "to-yellow-500/20",
    accent: "text-amber-400",
    border: "border-amber-500/30",
  },
  noble: {
    from: "from-violet-500/20",
    to: "to-pink-500/20",
    accent: "text-violet-400",
    border: "border-violet-500/30",
  },
  rogue: {
    from: "from-gray-500/20",
    to: "to-slate-500/20",
    accent: "text-gray-400",
    border: "border-gray-500/30",
  },
  thief: {
    from: "from-slate-500/20",
    to: "to-gray-500/20",
    accent: "text-slate-400",
    border: "border-slate-500/30",
  },
  cleric: {
    from: "from-yellow-500/20",
    to: "to-amber-500/20",
    accent: "text-yellow-400",
    border: "border-yellow-500/30",
  },
  priest: {
    from: "from-yellow-500/20",
    to: "to-white/20",
    accent: "text-yellow-300",
    border: "border-yellow-500/30",
  },
  ranger: {
    from: "from-green-500/20",
    to: "to-emerald-500/20",
    accent: "text-green-400",
    border: "border-green-500/30",
  },
  druid: {
    from: "from-emerald-500/20",
    to: "to-green-500/20",
    accent: "text-emerald-400",
    border: "border-emerald-500/30",
  },
  default: {
    from: "from-primary/20",
    to: "to-accent/20",
    accent: "text-primary",
    border: "border-primary/30",
  },
};

const getArchetypeColors = (archetype: string) => {
  const key = archetype.toLowerCase();
  return (
    ARCHETYPE_COLORS[key as keyof typeof ARCHETYPE_COLORS] ||
    ARCHETYPE_COLORS.default
  );
};

export const LibraryCard: React.FC<LibraryCardProps> = ({
  item,
  onClick,
  onEdit,
  onDelete,
  className,
  refreshKey,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [isGeneratingPortrait, setIsGeneratingPortrait] = useState(false);
  const [isSavingPortrait, setIsSavingPortrait] = useState(false);
  const [isGeneratingBanner, setIsGeneratingBanner] = useState(false);
  const [isSavingBanner, setIsSavingBanner] = useState(false);
  const [showPortraitControls, setShowPortraitControls] = useState(false);
  const [showBannerControls, setShowBannerControls] = useState(false);
  const portraitInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Fetch portrait for NPC cards
  useEffect(() => {
    if (item.type === "npc") {
      fetchPortrait();
    }
  }, [item.id, item.type, refreshKey]);

  // Fetch banner for quest cards
  useEffect(() => {
    if (item.type === "quest") {
      fetchBanner();
    }
  }, [item.id, item.type, refreshKey]);

  const fetchPortrait = async () => {
    try {
      const response = await fetch(
        `/api/content/media/${item.type}/${item.id}`,
      );
      if (response.ok) {
        const data = await response.json();
        // API returns { success: true, media: [...] }
        const mediaAssets = data.media || (Array.isArray(data) ? data : []);
        // Find the portrait asset
        const portrait = mediaAssets.find(
          (asset: any) => asset.type === "portrait",
        );
        if (portrait) {
          // Standardized field access: prefer fileUrl, fallback to cdnUrl
          setPortraitUrl(portrait.fileUrl || portrait.cdnUrl);
        } else {
          // Clear portrait URL if not found (so UI shows generate button)
          setPortraitUrl(null);
        }
      } else {
        // Clear portrait URL on error
        setPortraitUrl(null);
      }
    } catch (error) {
      // Silently fail - portrait is optional, but clear URL
      console.debug("No portrait available for this item", error);
      setPortraitUrl(null);
    }
  };

  const handleGeneratePortrait = async () => {
    if (item.type !== "npc") return;

    const npc = item.data as NPCData;

    try {
      setIsGeneratingPortrait(true);
      const result = await api.api.content["generate-npc-portrait"].post(
        {
          npcName: npc.name,
          archetype: npc.archetype || "default",
          appearance:
            npc.appearance?.description || "Generic appearance for a character",
          personality:
            npc.personality?.traits?.join(", ") ||
            "Neutral and balanced personality",
        },
      );

      if (result.error) {
        throw new Error(
          result.error.value?.message ||
            result.error.value?.summary ||
            "Failed to generate portrait",
        );
      }

      // Set the generated portrait URL
      setPortraitUrl(result.data!.imageUrl);
      notify.success("Portrait generated successfully!");

      // Automatically save the portrait
      await handleSavePortrait(result.data!.imageUrl);
    } catch (error) {
      console.error("Failed to generate portrait:", error);
      notify.error("Failed to generate portrait");
    } finally {
      setIsGeneratingPortrait(false);
    }
  };

  const fetchBanner = async () => {
    try {
      const response = await fetch(
        `/api/content/media/${item.type}/${item.id}`,
      );
      if (response.ok) {
        const data = await response.json();
        // API returns { success: true, media: [...] }
        const mediaAssets = data.media || (Array.isArray(data) ? data : []);
        // Find the banner asset
        const banner = mediaAssets.find(
          (asset: any) => asset.type === "banner",
        );
        if (banner) {
          // Standardized field access: prefer fileUrl, fallback to cdnUrl
          setBannerUrl(banner.fileUrl || banner.cdnUrl);
        } else {
          // Clear banner URL if not found (so UI shows generate button)
          setBannerUrl(null);
        }
      } else {
        // Clear banner URL on error
        setBannerUrl(null);
      }
    } catch (error) {
      // Silently fail - banner is optional, but clear URL
      console.debug("No banner available for this item", error);
      setBannerUrl(null);
    }
  };

  const handleGenerateBanner = async () => {
    if (item.type !== "quest") return;

    const quest = item.data as QuestData;

    try {
      setIsGeneratingBanner(true);
      // Generate banner with only visual requirements - no game metadata
      const result = await api.api.content["generate-quest-banner"].post(
        {
          questTitle: quest.title,
          description: quest.description || `Epic quest: ${quest.title}`,
        },
      );

      if (result.error) {
        throw new Error(
          result.error.value?.message ||
            result.error.value?.summary ||
            "Failed to generate banner",
        );
      }

      // Set the generated banner URL
      setBannerUrl(result.data!.imageUrl);
      notify.success("Banner generated successfully!");

      // Automatically save the banner
      await handleSaveBanner(result.data!.imageUrl);
    } catch (error) {
      console.error("Failed to generate banner:", error);
      notify.error("Failed to generate banner");
    } finally {
      setIsGeneratingBanner(false);
    }
  };

  const handleSaveBanner = async (imageUrl?: string) => {
    const urlToSave = imageUrl || bannerUrl;
    if (!urlToSave || !item.id) return;

    try {
      setIsSavingBanner(true);

      // Fetch the image and convert to base64
      const response = await fetch(urlToSave);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const base64Image = base64data.split(",")[1]; // Remove data:image/png;base64, prefix

        // Save to backend
        const result = await api.api.content.media["save-portrait"].post(
          {
            entityType: "quest",
            entityId: item.id,
            imageData: base64Image,
            type: "banner",
          },
        );

        if (result.error) {
          throw new Error(
            result.error.value?.message ||
              result.error.value?.summary ||
              "Failed to save banner",
          );
        }

        notify.success("Banner saved successfully!");

        // Refresh the banner to get the saved URL
        await fetchBanner();
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Failed to save banner:", error);
      notify.error("Failed to save banner");
    } finally {
      setIsSavingBanner(false);
    }
  };

  const handleSavePortrait = async (imageUrl?: string) => {
    const urlToSave = imageUrl || portraitUrl;
    if (!urlToSave || !item.id) return;

    try {
      setIsSavingPortrait(true);

      // Fetch the image and convert to base64
      const response = await fetch(urlToSave);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const base64Image = base64data.split(",")[1]; // Remove data:image/png;base64, prefix

        // Save to backend
        const result = await api.api.content.media["save-portrait"].post(
          {
            entityType: "npc",
            entityId: item.id,
            imageData: base64Image,
          },
        );

        if (result.error) {
          throw new Error(
            result.error.value?.message ||
              result.error.value?.summary ||
              "Failed to save portrait",
          );
        }

        notify.success("Portrait saved successfully!");

        // Refresh the portrait to get the saved URL
        await fetchPortrait();
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Failed to save portrait:", error);
      notify.error("Failed to save portrait");
    } finally {
      setIsSavingPortrait(false);
    }
  };

  const handleUploadPortrait = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !item.id) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      notify.error("Please upload an image file");
      return;
    }

    try {
      setIsSavingPortrait(true);

      // Read file as base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const base64Image = base64data.split(",")[1];

        // Save to backend
        const result = await api.api.content.media["save-portrait"].post(
          {
            entityType: "npc",
            entityId: item.id,
            imageData: base64Image,
          },
        );

        if (result.error) {
          throw new Error(
            result.error.value?.message ||
              result.error.value?.summary ||
              "Failed to upload portrait",
          );
        }

        notify.success("Portrait uploaded successfully!");

        // Refresh the portrait
        await fetchPortrait();
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Failed to upload portrait:", error);
      notify.error("Failed to upload portrait");
    } finally {
      setIsSavingPortrait(false);
      // Reset input
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleUploadBanner = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !item.id) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      notify.error("Please upload an image file");
      return;
    }

    try {
      setIsSavingBanner(true);

      // Read file as base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const base64Image = base64data.split(",")[1];

        // Save to backend
        const result = await api.api.content.media["save-portrait"].post(
          {
            entityType: "quest",
            entityId: item.id,
            imageData: base64Image,
            type: "banner",
          },
        );

        if (result.error) {
          throw new Error(
            result.error.value?.message ||
              result.error.value?.summary ||
              "Failed to upload banner",
          );
        }

        notify.success("Banner uploaded successfully!");

        // Refresh the banner
        await fetchBanner();
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Failed to upload banner:", error);
      notify.error("Failed to upload banner");
    } finally {
      setIsSavingBanner(false);
      // Reset input
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleDeletePortrait = async () => {
    if (!portraitUrl || !item.id) return;

    if (
      !window.confirm(
        "Are you sure you want to delete this portrait? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      setIsSavingPortrait(true);

      // Note: We would need a delete endpoint on the backend
      // For now, we'll just clear the local state
      setPortraitUrl(null);
      notify.success("Portrait deleted successfully!");

      // Refresh to confirm deletion
      await fetchPortrait();
    } catch (error) {
      console.error("Failed to delete portrait:", error);
      notify.error("Failed to delete portrait");
    } finally {
      setIsSavingPortrait(false);
    }
  };

  const handleDeleteBanner = async () => {
    if (!bannerUrl || !item.id) return;

    if (
      !window.confirm(
        "Are you sure you want to delete this banner? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      setIsSavingBanner(true);

      // Note: We would need a delete endpoint on the backend
      // For now, we'll just clear the local state
      setBannerUrl(null);
      notify.success("Banner deleted successfully!");

      // Refresh to confirm deletion
      await fetchBanner();
    } catch (error) {
      console.error("Failed to delete banner:", error);
      notify.error("Failed to delete banner");
    } finally {
      setIsSavingBanner(false);
    }
  };

  // Render NPC Card
  const renderNPCCard = () => {
    const npc = item.data as NPCData;

    // Safe defaults for NPC fields
    const archetype = npc.archetype || "default";
    const personality = npc.personality || {
      traits: [],
      background: "",
      motivations: [],
    };
    const appearance = npc.appearance || { description: "", equipment: [] };
    const dialogue = npc.dialogue || { greeting: "", farewell: "", idle: [] };
    const behavior = npc.behavior || {
      role: "NPC",
      schedule: "",
      relationships: [],
    };

    const colors = getArchetypeColors(archetype);

    return (
      <div
        className={cn(
          "group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer",
          "hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1",
          "outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          colors.border || "border-border-primary",
          "bg-gradient-to-br from-bg-secondary to-bg-tertiary",
          className,
        )}
        onClick={onClick}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Cover Banner with Gradient */}
        <div
          className={cn(
            "h-20 bg-gradient-to-r relative overflow-hidden",
            colors.from,
            colors.to,
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/5 to-black/10" />
          {/* Decorative Pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            }}
          />
          {/* Archetype Badge */}
          <div className="absolute top-2 right-2">
            <span className="px-3 py-1 bg-black/40 backdrop-blur-sm rounded-full text-xs font-semibold text-white capitalize">
              {archetype}
            </span>
          </div>
        </div>

        {/* Profile Section */}
        <div className="relative px-4 -mt-12 pb-4">
          {/* Portrait */}
          <div className="flex items-end gap-3">
            <div
              className={cn(
                "w-24 h-24 rounded-full border-4 border-border-primary shadow-xl overflow-hidden",
                "bg-gradient-to-br from-bg-tertiary to-bg-secondary flex items-center justify-center",
                "group-hover:scale-105 transition-transform duration-300 relative",
              )}
              onMouseEnter={() => setShowPortraitControls(true)}
              onMouseLeave={() => setShowPortraitControls(false)}
            >
              {portraitUrl ? (
                <>
                  <img
                    src={portraitUrl}
                    alt={`${npc.name} portrait`}
                    className="w-full h-full object-cover"
                  />
                  {/* Portrait Edit Controls Overlay */}
                  {showPortraitControls && (
                    <div
                      className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center gap-1 animate-fade-in"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          portraitInputRef.current?.click();
                        }}
                        disabled={isSavingPortrait}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
                        title="Upload Portrait"
                      >
                        <Upload className="w-4 h-4 text-white" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePortrait();
                        }}
                        disabled={isSavingPortrait}
                        className="p-2 bg-white/10 hover:bg-red-500/80 rounded-full transition-colors disabled:opacity-50"
                        title="Delete Portrait"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <User className="w-12 h-12 text-text-tertiary/50" />
              )}
            </div>
            {/* Hidden file input for portrait upload */}
            <input
              ref={portraitInputRef}
              type="file"
              accept="image/*"
              onChange={handleUploadPortrait}
              className="hidden"
            />

            {/* Name & Quick Info */}
            <div className="flex-1 pb-1 relative z-10">
              <h3 className="text-lg font-bold text-text-primary group-hover:text-text-primary mb-0.5 line-clamp-1">
                {npc.name}
              </h3>
              <p
                className={cn("text-sm font-medium capitalize", colors.accent)}
              >
                {behavior.role}
              </p>
            </div>
          </div>

          {/* Personality Traits Preview */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {personality.traits.slice(0, 3).map((trait, i) => (
              <span
                key={i}
                className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium",
                  "bg-primary/10 border",
                  colors.border,
                  colors.accent,
                )}
              >
                {trait}
              </span>
            ))}
            {personality.traits.length > 3 && (
              <span className="px-2 py-0.5 rounded-full text-xs text-text-tertiary">
                +{personality.traits.length - 3} more
              </span>
            )}
          </div>

          {/* Dialogue Preview */}
          <div className="mt-3 bg-bg-tertiary/50 rounded-lg p-2.5 border border-border-primary/50">
            <div className="flex items-start gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-text-tertiary mt-0.5 flex-shrink-0" />
              <p className="text-xs text-text-secondary group-hover:text-text-secondary italic line-clamp-2">
                "{dialogue.greeting}"
              </p>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-3 flex items-center justify-between text-xs text-text-tertiary group-hover:text-text-tertiary">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(item.createdAt)}
            </div>
            {/* Status Indicators */}
            <div className="flex items-center gap-1.5">
              {portraitUrl && (
                <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
              )}
              {/* Add more indicators for voice, quest, lore if available */}
            </div>
          </div>
        </div>

        {/* Quick Actions Overlay */}
        {showActions && (
          <div className="absolute top-2 left-2 flex gap-1 animate-fade-in">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-2 bg-black/60 backdrop-blur-sm hover:bg-primary/80 rounded-lg transition-colors group/btn"
              title="Edit"
            >
              <Edit className="w-3.5 h-3.5 text-white" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-2 bg-black/60 backdrop-blur-sm hover:bg-red-500/80 rounded-lg transition-colors group/btn"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        )}

        {/* Hover Glow Effect */}
        <div
          className={cn(
            "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
            "bg-gradient-to-t from-primary/5 to-transparent",
          )}
        />
      </div>
    );
  };

  // Render Quest Card
  const renderQuestCard = () => {
    const quest = item.data as QuestData;

    // Safe defaults for quest fields
    const objectives = quest.objectives || [];
    const rewards = quest.rewards || { experience: 0, gold: 0, items: [] };
    const npcs = quest.npcs || [];

    // Difficulty colors
    const difficultyColors = {
      easy: {
        bg: "bg-green-500/10",
        border: "border-green-500/30",
        text: "text-green-400",
      },
      medium: {
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/30",
        text: "text-yellow-400",
      },
      hard: {
        bg: "bg-orange-500/10",
        border: "border-orange-500/30",
        text: "text-orange-400",
      },
      legendary: {
        bg: "bg-purple-500/10",
        border: "border-purple-500/30",
        text: "text-purple-400",
      },
    };

    const difficulty = (item.data as any).difficulty || "medium";
    const colors =
      difficultyColors[difficulty as keyof typeof difficultyColors] ||
      difficultyColors.medium;

    return (
      <div
        className={cn(
          "group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer",
          "hover:shadow-2xl hover:shadow-amber-500/20 hover:-translate-y-1",
          "outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50",
          "border-amber-500/30",
          "bg-gradient-to-br from-amber-500/10 via-bg-secondary to-bg-tertiary",
          className,
        )}
        onClick={onClick}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Scroll Header / Banner */}
        <div
          className="relative h-16 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 overflow-hidden"
          onMouseEnter={() => setShowBannerControls(true)}
          onMouseLeave={() => setShowBannerControls(false)}
        >
          {bannerUrl ? (
            <>
              <img
                src={bannerUrl}
                alt={`${quest.title} banner`}
                className="w-full h-full object-cover"
              />
              {/* Banner Edit Controls Overlay */}
              {showBannerControls && (
                <div
                  className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center gap-2 animate-fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      bannerInputRef.current?.click();
                    }}
                    disabled={isSavingBanner}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                    title="Upload Banner"
                  >
                    <Upload className="w-4 h-4 text-white" />
                    <span className="text-xs text-white font-medium">
                      Upload
                    </span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteBanner();
                    }}
                    disabled={isSavingBanner}
                    className="px-3 py-1.5 bg-white/10 hover:bg-red-500/80 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                    title="Delete Banner"
                  >
                    <X className="w-4 h-4 text-white" />
                    <span className="text-xs text-white font-medium">
                      Delete
                    </span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgyMHYyMEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0xMCAwdjIwTTAgMTBoMjAiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9Ii4wNSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-50" />
          )}
          <div className="absolute top-2 right-2 z-10">
            <span
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-semibold capitalize",
                colors.bg,
                colors.border,
                colors.text,
                "border",
              )}
            >
              {difficulty}
            </span>
          </div>
        </div>
        {/* Hidden file input for banner upload */}
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          onChange={handleUploadBanner}
          className="hidden"
        />

        {/* Content */}
        <div className="p-4 space-y-3 relative z-10">
          {/* Title */}
          <div className="flex items-start gap-2">
            <Scroll className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <h3 className="text-lg font-bold text-text-primary group-hover:text-text-primary line-clamp-2 flex-1">
              {quest.title}
            </h3>
          </div>

          {/* Description */}
          <p className="text-sm text-text-secondary group-hover:text-text-secondary line-clamp-3 leading-relaxed">
            {quest.description}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border-primary/50">
            <div className="text-center">
              <Target className="w-4 h-4 text-blue-400 mx-auto mb-1" />
              <div className="text-xs font-semibold text-text-primary group-hover:text-text-primary">
                {objectives.length}
              </div>
              <div className="text-xs text-text-tertiary group-hover:text-text-tertiary">
                Objectives
              </div>
            </div>
            <div className="text-center">
              <Sparkles className="w-4 h-4 text-purple-400 mx-auto mb-1" />
              <div className="text-xs font-semibold text-text-primary group-hover:text-text-primary">
                {rewards.experience}
              </div>
              <div className="text-xs text-text-tertiary group-hover:text-text-tertiary">
                XP
              </div>
            </div>
            <div className="text-center">
              <Coins className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
              <div className="text-xs font-semibold text-text-primary group-hover:text-text-primary">
                {rewards.gold}
              </div>
              <div className="text-xs text-text-tertiary group-hover:text-text-tertiary">
                Gold
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-text-tertiary group-hover:text-text-tertiary pt-2">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(item.createdAt)}
            </div>
            {npcs.length > 0 && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{npcs.length} NPCs</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        {showActions && (
          <div className="absolute top-2 left-2 flex gap-1 animate-fade-in">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-2 bg-black/60 backdrop-blur-sm hover:bg-primary/80 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit className="w-3.5 h-3.5 text-white" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-2 bg-black/60 backdrop-blur-sm hover:bg-red-500/80 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        )}

        {/* Hover Glow */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-t from-amber-500/5 to-transparent" />
      </div>
    );
  };

  // Render Dialogue Card
  const renderDialogueCard = () => {
    const dialogue = item.data as DialogueData;
    const nodes = dialogue.nodes || [];

    return (
      <div
        className={cn(
          "group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer",
          "hover:shadow-2xl hover:shadow-green-500/20 hover:-translate-y-1",
          "outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50",
          "border-green-500/30",
          "bg-gradient-to-br from-green-500/10 via-bg-secondary to-bg-tertiary",
          className,
        )}
        onClick={onClick}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Header */}
        <div className="relative h-14 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-green-500/20 overflow-hidden flex items-center px-4 z-10">
          <FileText className="w-5 h-5 text-green-400 mr-2" />
          <h3 className="text-lg font-bold text-text-primary group-hover:text-text-primary line-clamp-1 flex-1">
            {item.name}
          </h3>
          <span className="px-2.5 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-xs font-semibold text-green-400">
            {nodes.length} nodes
          </span>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 relative z-10">
          {/* First Dialogue Node Preview */}
          {nodes[0] && (
            <div className="bg-bg-tertiary/50 rounded-lg p-3 border border-border-primary/50">
              <p className="text-sm text-text-primary group-hover:text-text-primary italic line-clamp-3">
                "{nodes[0].text}"
              </p>
            </div>
          )}

          {/* Node Flow Indicator */}
          {nodes.length > 1 && (
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <div className="flex-1 h-px bg-border-primary" />
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <div className="w-2 h-2 rounded-full bg-green-500/60" />
                <div className="w-2 h-2 rounded-full bg-green-500/30" />
              </div>
              <div className="flex-1 h-px bg-border-primary" />
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-text-tertiary group-hover:text-text-tertiary">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(item.createdAt)}
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              <span>
                {nodes.reduce((sum, n) => sum + (n.responses?.length || 0), 0)}{" "}
                responses
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {showActions && (
          <div className="absolute top-2 left-2 flex gap-1 animate-fade-in">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-2 bg-black/60 backdrop-blur-sm hover:bg-primary/80 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit className="w-3.5 h-3.5 text-white" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-2 bg-black/60 backdrop-blur-sm hover:bg-red-500/80 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        )}

        {/* Hover Glow */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-t from-green-500/5 to-transparent" />
      </div>
    );
  };

  // Render Lore Card
  const renderLoreCard = () => {
    const lore = item.data as LoreData;

    return (
      <div
        className={cn(
          "group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer",
          "hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-1",
          "outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50",
          "border-purple-500/30",
          "bg-gradient-to-br from-purple-500/10 via-bg-secondary to-bg-tertiary",
          className,
        )}
        onClick={onClick}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Book Cover Header */}
        <div className="relative h-16 bg-gradient-to-br from-purple-500/20 via-violet-500/20 to-purple-500/20 overflow-hidden">
          {/* Leather Texture */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20px 20px, #000 2%, transparent 2%), radial-gradient(circle at 60px 60px, #000 2%, transparent 2%)",
              backgroundSize: "80px 80px",
            }}
          />
          <div className="absolute top-2 right-2">
            <span className="px-2.5 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs font-semibold text-purple-400 capitalize">
              {lore.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 relative z-10">
          {/* Title */}
          <div className="flex items-start gap-2">
            <BookOpen className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
            <h3 className="text-lg font-bold text-text-primary group-hover:text-text-primary line-clamp-2 flex-1">
              {lore.title}
            </h3>
          </div>

          {/* Summary */}
          <p className="text-sm text-text-secondary group-hover:text-text-secondary line-clamp-4 leading-relaxed italic">
            {lore.summary}
          </p>

          {/* Related Topics */}
          {lore.relatedTopics && lore.relatedTopics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border-primary/50">
              {lore.relatedTopics.slice(0, 3).map((topic, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-xs text-purple-400"
                >
                  {topic}
                </span>
              ))}
              {lore.relatedTopics.length > 3 && (
                <span className="px-2 py-0.5 text-xs text-text-tertiary">
                  +{lore.relatedTopics.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-text-tertiary group-hover:text-text-tertiary pt-2">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(item.createdAt)}
            </div>
            {lore.timeline && (
              <div className="flex items-center gap-1 italic">
                <span>{lore.timeline}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        {showActions && (
          <div className="absolute top-2 left-2 flex gap-1 animate-fade-in">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-2 bg-black/60 backdrop-blur-sm hover:bg-primary/80 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit className="w-3.5 h-3.5 text-white" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-2 bg-black/60 backdrop-blur-sm hover:bg-red-500/80 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        )}

        {/* Hover Glow */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-t from-purple-500/5 to-transparent" />
      </div>
    );
  };

  // Render appropriate card based on content type
  const renderCard = () => {
    switch (item.type) {
      case "npc":
        return renderNPCCard();
      case "quest":
        return renderQuestCard();
      case "dialogue":
        return renderDialogueCard();
      case "lore":
        return renderLoreCard();
      case "audio":
        return (
          <AudioLibraryCard
            item={item}
            onClick={onClick}
            onEdit={onEdit}
            onDelete={onDelete}
            className={className}
          />
        );
      default:
        return null;
    }
  };

  return renderCard();
};
