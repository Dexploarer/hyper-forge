/**
 * Content Detail Modal
 * Beautiful expanded view for library content items
 * Shows full details in an immersive, content-type-specific layout
 */

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  User,
  Scroll,
  FileText,
  BookOpen,
  MessageSquare,
  Briefcase,
  Calendar,
  Target,
  Coins,
  Sparkles,
  MapPin,
  Users,
  Heart,
  Shield,
  Book,
  Clock,
  Edit,
  Trash2,
  Download,
  Share2,
  RefreshCw,
  Upload,
  Mic,
  Sparkles as SparklesIcon,
  Image as ImageIcon,
} from "lucide-react";
import { LoadingSpinner } from "@/components/common";
import { cn } from "@/styles";
import { ContentItem, type ContentType } from "@/hooks/useContent";
import { api } from "@/lib/api-client";
import { notify } from "@/utils/notify";
import { getAuthToken } from "@/utils/auth-token-store";
import type {
  NPCData,
  QuestData,
  DialogueData,
  LoreData,
} from "@/types/content";

interface ContentDetailModalProps {
  item: ContentItem;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onImageGenerated?: () => void;
}

export const ContentDetailModal: React.FC<ContentDetailModalProps> = ({
  item,
  open,
  onClose,
  onEdit,
  onDelete,
  onImageGenerated,
}) => {
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

  // Fetch portrait for NPC items
  useEffect(() => {
    if (open && item.type === "npc") {
      fetchPortrait();
    }
  }, [open, item.id, item.type]);

  // Periodically refetch portrait when modal is open (to catch updates from LibraryCard)
  useEffect(() => {
    if (!open || item.type !== "npc") return;

    // Refetch immediately when modal opens
    fetchPortrait();

    // Set up periodic refetch every 3 seconds while modal is open
    const interval = setInterval(() => {
      fetchPortrait();
    }, 3000);

    // Also refetch when window regains focus (user switches back to tab)
    const handleFocus = () => {
      fetchPortrait();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [open, item.id, item.type]);

  // Fetch banner for Quest items
  useEffect(() => {
    if (open && item.type === "quest") {
      fetchBanner();
    }
  }, [open, item.id, item.type]);

  // Periodically refetch banner when modal is open (to catch updates from LibraryCard)
  useEffect(() => {
    if (!open || item.type !== "quest") return;

    // Refetch immediately when modal opens
    fetchBanner();

    // Set up periodic refetch every 3 seconds while modal is open
    const interval = setInterval(() => {
      fetchBanner();
    }, 3000);

    // Also refetch when window regains focus (user switches back to tab)
    const handleFocus = () => {
      fetchBanner();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [open, item.id, item.type]);

  const fetchPortrait = async () => {
    try {
      // Use authenticated fetch
      const token = getAuthToken();
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(
        `/api/content/media/${item.type}/${item.id}`,
        { headers },
      );
      if (response.ok) {
        const data = await response.json();
        // API returns { success: true, media: [...] }
        const mediaAssets = data.media || (Array.isArray(data) ? data : []);
        const portrait = mediaAssets.find(
          (asset: any) => asset.type === "portrait",
        );
        if (portrait) {
          // Standardized field access: prefer fileUrl, fallback to cdnUrl
          setPortraitUrl(portrait.fileUrl || portrait.cdnUrl);
        }
        // Don't clear URL if not found - preserve what we have
      }
      // Don't clear portrait URL on error - preserve what we have
    } catch (error) {
      console.error("Failed to fetch portrait:", error);
      // Don't clear portrait URL on error - preserve what we have
    }
  };

  const fetchBanner = async () => {
    try {
      // Use authenticated fetch
      const token = getAuthToken();
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(
        `/api/content/media/${item.type}/${item.id}`,
        { headers },
      );
      if (response.ok) {
        const data = await response.json();
        const mediaAssets = data.media || (Array.isArray(data) ? data : []);
        const banner = mediaAssets.find(
          (asset: any) => asset.type === "banner",
        );
        if (banner) {
          // Standardized field access: prefer fileUrl, fallback to cdnUrl
          setBannerUrl(banner.fileUrl || banner.cdnUrl);
        }
        // Don't clear URL if not found - preserve what we have
      }
      // Don't clear banner URL on error - preserve what we have
    } catch (error) {
      console.error("Failed to fetch banner:", error);
      // Don't clear banner URL on error - preserve what we have
    }
  };

  const handleGeneratePortrait = async () => {
    if (item.type !== "npc") return;
    const npc = item.data as NPCData;

    try {
      setIsGeneratingPortrait(true);
      const result = await api.api.content["generate-npc-portrait"].post({
        npcName: npc.name,
        archetype: npc.archetype || "default",
        appearance:
          npc.appearance?.description || "Generic appearance for a character",
        personality:
          npc.personality?.traits?.join(", ") ||
          "Neutral and balanced personality",
      });

      if (result.error) {
        throw new Error(
          result.error.value?.message ||
            result.error.value?.summary ||
            "Failed to generate portrait",
        );
      }

      setPortraitUrl(result.data!.imageUrl);
      notify.success("Portrait generated! Saving...");
      // Auto-save after generation
      await handleSavePortrait(result.data!.imageUrl);
    } catch (error) {
      console.error("Failed to generate portrait:", error);
      notify.error("Failed to generate portrait");
    } finally {
      setIsGeneratingPortrait(false);
    }
  };

  const handleGenerateBanner = async () => {
    if (item.type !== "quest") return;
    const quest = item.data as QuestData;

    try {
      setIsGeneratingBanner(true);
      // Generate banner with only visual requirements - no game metadata
      const result = await api.api.content["generate-quest-banner"].post({
        questTitle: quest.title,
        description: quest.description || "",
      });

      if (result.error) {
        throw new Error(
          result.error.value?.message ||
            result.error.value?.summary ||
            "Failed to generate banner",
        );
      }

      setBannerUrl(result.data!.imageUrl);
      notify.success("Banner generated! Saving...");
      // Auto-save after generation
      await handleSaveBanner(result.data!.imageUrl);
    } catch (error) {
      console.error("Failed to generate banner:", error);
      notify.error("Failed to generate banner");
    } finally {
      setIsGeneratingBanner(false);
    }
  };

  const handleSavePortrait = async (imageUrl?: string) => {
    const urlToSave = imageUrl || portraitUrl;
    if (!urlToSave || !item.id) return;

    try {
      setIsSavingPortrait(true);

      // Send URL to backend - server fetches it (no CORS issues)
      const result = await api.api.content.media["save-portrait"].post({
        imageUrl: urlToSave,
        entityType: "npc",
        entityId: item.id,
        type: "portrait",
      });

      if (result.error) {
        throw new Error(
          result.error.value?.message || "Failed to save portrait",
        );
      }

      notify.success("Portrait saved successfully!");
      await fetchPortrait();
      // Notify parent to refresh library cards after save completes
      setTimeout(() => {
        onImageGenerated?.();
      }, 1500);
    } catch (error) {
      console.error("Failed to save portrait:", error);
      notify.error("Failed to save portrait");
    } finally {
      setIsSavingPortrait(false);
    }
  };

  const handleSaveBanner = async (imageUrl?: string) => {
    const urlToSave = imageUrl || bannerUrl;
    if (!urlToSave || !item.id) return;

    try {
      setIsSavingBanner(true);

      // Send URL to backend - server fetches it (no CORS issues)
      const result = await api.api.content.media["save-portrait"].post({
        imageUrl: urlToSave,
        entityType: "quest",
        entityId: item.id,
        type: "banner",
      });

      if (result.error) {
        throw new Error(result.error.value?.message || "Failed to save banner");
      }

      notify.success("Banner saved successfully!");
      await fetchBanner();
      // Notify parent to refresh library cards after save completes
      setTimeout(() => {
        onImageGenerated?.();
      }, 1500);
    } catch (error) {
      console.error("Failed to save banner:", error);
      notify.error("Failed to save banner");
    } finally {
      setIsSavingBanner(false);
    }
  };

  const handleUploadPortrait = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !item.id) return;

    if (!file.type.startsWith("image/")) {
      notify.error("Please upload an image file");
      return;
    }

    try {
      setIsSavingPortrait(true);

      // Use FormData for file upload
      const formData = new FormData();
      formData.append("image", file);
      formData.append("entityType", "npc");
      formData.append("entityId", item.id);
      formData.append("type", "portrait");

      // Send as multipart/form-data
      const token = getAuthToken();
      const response = await fetch("/api/content/media/save-portrait", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload portrait");
      }

      notify.success("Portrait uploaded successfully!");
      await fetchPortrait();
      // Notify parent to refresh library cards after upload completes
      setTimeout(() => {
        onImageGenerated?.();
      }, 1500);
    } catch (error) {
      console.error("Failed to upload portrait:", error);
      notify.error("Failed to upload portrait");
    } finally {
      setIsSavingPortrait(false);
      if (event.target) event.target.value = "";
    }
  };

  const handleUploadBanner = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !item.id) return;

    if (!file.type.startsWith("image/")) {
      notify.error("Please upload an image file");
      return;
    }

    try {
      setIsSavingBanner(true);

      // Use FormData for file upload
      const formData = new FormData();
      formData.append("image", file);
      formData.append("entityType", "quest");
      formData.append("entityId", item.id);
      formData.append("type", "banner");

      // Send as multipart/form-data
      const token = getAuthToken();
      const response = await fetch("/api/content/media/save-portrait", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload banner");
      }

      notify.success("Banner uploaded successfully!");
      await fetchBanner();
      // Notify parent to refresh library cards after upload completes
      setTimeout(() => {
        onImageGenerated?.();
      }, 1500);
    } catch (error) {
      console.error("Failed to upload banner:", error);
      notify.error("Failed to upload banner");
    } finally {
      setIsSavingBanner(false);
      if (event.target) event.target.value = "";
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
      setPortraitUrl(null);
      notify.success("Portrait deleted successfully!");
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
      setBannerUrl(null);
      notify.success("Banner deleted successfully!");
      await fetchBanner();
    } catch (error) {
      console.error("Failed to delete banner:", error);
      notify.error("Failed to delete banner");
    } finally {
      setIsSavingBanner(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!open) return null;

  const renderNPCDetails = () => {
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

    return (
      <div className="space-y-6">
        {/* Header with Portrait */}
        <div className="flex items-start gap-6">
          {/* Portrait */}
          <div
            className="w-32 h-32 rounded-xl overflow-hidden flex-shrink-0 border-2 border-border-primary shadow-xl bg-gradient-to-br from-bg-tertiary to-bg-secondary relative group/portrait"
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
                {/* Portrait Edit Controls */}
                {showPortraitControls && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center gap-1.5 animate-fade-in">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGeneratePortrait();
                      }}
                      disabled={isGeneratingPortrait || isSavingPortrait}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Regenerate Portrait"
                    >
                      <RefreshCw className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        portraitInputRef.current?.click();
                      }}
                      disabled={isSavingPortrait}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Upload Portrait"
                    >
                      <Upload className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePortrait();
                      }}
                      disabled={isSavingPortrait}
                      className="p-2 bg-white/10 hover:bg-red-500/80 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete Portrait"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center relative">
                <User className="w-16 h-16 text-text-tertiary/30 relative z-0" />
                {/* Generate Portrait Button */}
                <button
                  onClick={handleGeneratePortrait}
                  disabled={isGeneratingPortrait || isSavingPortrait}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-all disabled:opacity-50 z-10 rounded-xl"
                  title="Generate Portrait"
                >
                  {isGeneratingPortrait || isSavingPortrait ? (
                    <LoadingSpinner size="lg" className="text-white" />
                  ) : (
                    <>
                      <SparklesIcon className="w-8 h-8 text-white" />
                      <span className="text-xs text-white font-medium">
                        Generate
                      </span>
                    </>
                  )}
                </button>
              </div>
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

          {/* Name & Archetype */}
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-text-primary mb-2">
              {npc.name}
            </h2>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-primary/20 border border-primary/30 rounded-lg text-primary font-medium capitalize">
                {archetype}
              </span>
              <span className="px-3 py-1 bg-bg-tertiary border border-border-primary rounded-lg text-text-secondary capitalize">
                {behavior.role}
              </span>
            </div>
          </div>
        </div>

        {/* Personality */}
        <div className="bg-bg-tertiary/50 rounded-xl p-5 border border-border-primary">
          <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-400" />
            Personality
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                Background
              </label>
              <p className="text-text-secondary mt-1 leading-relaxed">
                {personality.background || "No background provided"}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                Traits
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {personality.traits.map((trait, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-sm text-primary"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                Motivations
              </label>
              <ul className="mt-2 space-y-1">
                {personality.motivations.map((motivation, i) => (
                  <li
                    key={i}
                    className="text-text-secondary text-sm flex items-start gap-2"
                  >
                    <span className="text-primary mt-1">•</span>
                    <span>{motivation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-bg-tertiary/50 rounded-xl p-5 border border-border-primary">
          <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            Appearance
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                Description
              </label>
              <p className="text-text-secondary mt-1 leading-relaxed">
                {appearance.description || "No description provided"}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                Equipment
              </label>
              <ul className="mt-2 space-y-1">
                {appearance.equipment.map((item, i) => (
                  <li
                    key={i}
                    className="text-text-secondary text-sm flex items-start gap-2"
                  >
                    <Shield className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Dialogue */}
        <div className="bg-bg-tertiary/50 rounded-xl p-5 border border-border-primary">
          <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-400" />
            Dialogue
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                Greeting
              </label>
              <p className="text-text-secondary mt-1 italic leading-relaxed">
                "{dialogue.greeting || "No greeting"}"
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                Farewell
              </label>
              <p className="text-text-secondary mt-1 italic leading-relaxed">
                "{dialogue.farewell || "No farewell"}"
              </p>
            </div>
            {dialogue.idle && dialogue.idle.length > 0 && (
              <div>
                <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                  Idle Lines
                </label>
                <ul className="mt-2 space-y-2">
                  {dialogue.idle.map((line, i) => (
                    <li
                      key={i}
                      className="text-text-secondary text-sm italic pl-4 border-l-2 border-primary/30"
                    >
                      "{line}"
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Behavior */}
        <div className="bg-bg-tertiary/50 rounded-xl p-5 border border-border-primary">
          <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-amber-400" />
            Behavior
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                Schedule
              </label>
              <p className="text-text-secondary mt-1 leading-relaxed">
                {behavior.schedule || "No schedule provided"}
              </p>
            </div>
            {behavior.relationships && behavior.relationships.length > 0 && (
              <div>
                <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                  Relationships
                </label>
                <ul className="mt-2 space-y-1">
                  {behavior.relationships.map((rel, i) => (
                    <li
                      key={i}
                      className="text-text-secondary text-sm flex items-start gap-2"
                    >
                      <Users className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                      <span>{rel}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderQuestDetails = () => {
    const quest = item.data as QuestData;

    // Safe defaults for quest fields
    const objectives = quest.objectives || [];
    const rewards = quest.rewards || { experience: 0, gold: 0, items: [] };
    const requirements = quest.requirements || {
      level: 1,
      previousQuests: [],
    };
    const npcs = quest.npcs || [];

    return (
      <div className="space-y-6">
        {/* Banner Image */}
        <div
          className="relative h-48 rounded-xl overflow-hidden border-2 border-border-primary shadow-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20"
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
              {/* Banner Edit Controls */}
              {showBannerControls && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center gap-2 animate-fade-in">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenerateBanner();
                    }}
                    disabled={isGeneratingBanner || isSavingBanner}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    title="Regenerate Banner"
                  >
                    <RefreshCw className="w-5 h-5 text-white" />
                    <span className="text-sm text-white font-medium">
                      Retry
                    </span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      bannerInputRef.current?.click();
                    }}
                    disabled={isSavingBanner}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    title="Upload Banner"
                  >
                    <Upload className="w-5 h-5 text-white" />
                    <span className="text-sm text-white font-medium">
                      Upload
                    </span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteBanner();
                    }}
                    disabled={isSavingBanner}
                    className="px-4 py-2 bg-white/10 hover:bg-red-500/80 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    title="Delete Banner"
                  >
                    <X className="w-5 h-5 text-white" />
                    <span className="text-sm text-white font-medium">
                      Delete
                    </span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              <ImageIcon className="w-16 h-16 text-text-tertiary/30 relative z-0" />
              {/* Generate Banner Button */}
              <button
                onClick={handleGenerateBanner}
                disabled={isGeneratingBanner || isSavingBanner}
                className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-all disabled:opacity-50 z-10 rounded-xl"
                title="Generate Banner"
              >
                {isGeneratingBanner || isSavingBanner ? (
                  <LoadingSpinner size="lg" className="text-white" />
                ) : (
                  <>
                    <SparklesIcon className="w-10 h-10 text-white" />
                    <span className="text-sm text-white font-medium">
                      Generate Banner
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
        {/* Hidden file input for banner upload */}
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          onChange={handleUploadBanner}
          className="hidden"
        />

        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-text-primary mb-3">
            {quest.title}
          </h2>
          <p className="text-text-secondary leading-relaxed">
            {quest.description}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
            <Target className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-text-primary">
              {objectives.length}
            </div>
            <div className="text-xs text-text-tertiary uppercase tracking-wide">
              Objectives
            </div>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-center">
            <Sparkles className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-text-primary">
              {rewards.experience}
            </div>
            <div className="text-xs text-text-tertiary uppercase tracking-wide">
              XP Reward
            </div>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
            <Coins className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-text-primary">
              {rewards.gold}
            </div>
            <div className="text-xs text-text-tertiary uppercase tracking-wide">
              Gold Reward
            </div>
          </div>
        </div>

        {/* Story */}
        <div className="bg-bg-tertiary/50 rounded-xl p-5 border border-border-primary">
          <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Book className="w-5 h-5 text-purple-400" />
            Story
          </h3>
          <p className="text-text-secondary leading-relaxed">{quest.story}</p>
        </div>

        {/* Objectives */}
        <div className="bg-bg-tertiary/50 rounded-xl p-5 border border-border-primary">
          <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            Objectives
          </h3>
          <div className="space-y-3">
            {objectives.map((obj, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 bg-bg-secondary rounded-lg border border-border-primary"
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">
                    {i + 1}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-text-primary">
                      {obj.description}
                    </span>
                    <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded text-xs text-primary capitalize">
                      {obj.type}
                    </span>
                  </div>
                  <div className="text-xs text-text-tertiary">
                    Target: {obj.target} • Count: {obj.count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rewards */}
        <div className="bg-bg-tertiary/50 rounded-xl p-5 border border-border-primary">
          <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            Rewards
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                Experience
              </label>
              <div className="text-xl font-bold text-purple-400 mt-1">
                {rewards.experience} XP
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                Gold
              </label>
              <div className="text-xl font-bold text-yellow-400 mt-1">
                {rewards.gold}
              </div>
            </div>
            {rewards.items && rewards.items.length > 0 && (
              <div className="col-span-2">
                <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                  Items
                </label>
                <ul className="mt-2 space-y-1">
                  {rewards.items.map((itemReward, i) => (
                    <li
                      key={i}
                      className="text-text-secondary text-sm flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4 text-blue-400" />
                      <span>{itemReward}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Requirements & Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-bg-tertiary/50 rounded-xl p-5 border border-border-primary">
            <h3 className="text-lg font-semibold text-text-primary mb-3">
              Requirements
            </h3>
            <div className="space-y-2">
              <div>
                <label className="text-xs font-medium text-text-tertiary">
                  Level
                </label>
                <div className="text-text-primary font-medium">
                  {requirements.level}
                </div>
              </div>
              {requirements.previousQuests.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-text-tertiary">
                    Previous Quests
                  </label>
                  <ul className="mt-1 space-y-1">
                    {requirements.previousQuests.map((pq, i) => (
                      <li key={i} className="text-text-secondary text-sm">
                        • {pq}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="bg-bg-tertiary/50 rounded-xl p-5 border border-border-primary">
            <h3 className="text-lg font-semibold text-text-primary mb-3">
              Details
            </h3>
            <div className="space-y-2">
              {quest.location && (
                <div>
                  <label className="text-xs font-medium text-text-tertiary flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Location
                  </label>
                  <div className="text-text-primary">{quest.location}</div>
                </div>
              )}
              {npcs.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-text-tertiary flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    NPCs Involved
                  </label>
                  <div className="text-text-primary">{npcs.join(", ")}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDialogueDetails = () => {
    const dialogue = item.data as DialogueData;
    const nodes = dialogue.nodes || [];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-text-primary mb-3">
            {item.name}
          </h2>
          {dialogue.metadata?.description && (
            <p className="text-text-secondary">
              {dialogue.metadata.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-3">
            <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 font-medium">
              {nodes.length} Nodes
            </span>
            {dialogue.metadata?.characterName && (
              <span className="px-3 py-1 bg-bg-tertiary border border-border-primary rounded-lg text-text-secondary">
                {dialogue.metadata.characterName}
              </span>
            )}
          </div>
        </div>

        {/* Dialogue Flow */}
        <div className="bg-bg-tertiary/50 rounded-xl p-5 border border-border-primary">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-400" />
            Dialogue Flow
          </h3>
          <div className="space-y-4">
            {nodes.map((node, i) => (
              <div
                key={node.id}
                className="bg-bg-secondary rounded-lg p-4 border border-border-primary"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-green-400">
                      {i + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-text-tertiary mb-2">
                      Node: {node.id}
                    </div>
                    <p className="text-text-primary italic leading-relaxed mb-3">
                      "{node.text}"
                    </p>
                    {node.responses && node.responses.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                          Responses ({node.responses.length})
                        </div>
                        {node.responses.map((response, ri) => (
                          <div
                            key={ri}
                            className="pl-4 py-2 border-l-2 border-primary/30 text-sm text-text-secondary"
                          >
                            <div className="mb-1">{response.text}</div>
                            {response.nextNodeId && (
                              <div className="text-xs text-text-tertiary">
                                → Next: {response.nextNodeId}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderLoreDetails = () => {
    const lore = item.data as LoreData;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 font-medium capitalize">
              {lore.category}
            </span>
            {lore.timeline && (
              <span className="px-3 py-1 bg-bg-tertiary border border-border-primary rounded-lg text-text-secondary flex items-center gap-2">
                <Clock className="w-3 h-3" />
                {lore.timeline}
              </span>
            )}
          </div>
          <h2 className="text-3xl font-bold text-text-primary mb-3">
            {lore.title}
          </h2>
          <p className="text-text-secondary text-lg italic leading-relaxed">
            {lore.summary}
          </p>
        </div>

        {/* Content */}
        <div className="bg-bg-tertiary/50 rounded-xl p-5 border border-border-primary">
          <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            Full Text
          </h3>
          <div className="prose prose-invert max-w-none">
            <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
              {lore.content}
            </p>
          </div>
        </div>

        {/* Related Topics */}
        {lore.relatedTopics && lore.relatedTopics.length > 0 && (
          <div className="bg-bg-tertiary/50 rounded-xl p-5 border border-border-primary">
            <h3 className="text-lg font-semibold text-text-primary mb-3">
              Related Topics
            </h3>
            <div className="flex flex-wrap gap-2">
              {lore.relatedTopics.map((topic, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Characters */}
        {lore.characters && lore.characters.length > 0 && (
          <div className="bg-bg-tertiary/50 rounded-xl p-5 border border-border-primary">
            <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Characters Mentioned
            </h3>
            <div className="flex flex-wrap gap-2">
              {lore.characters.map((char, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-bg-secondary border border-border-primary rounded-lg text-text-primary"
                >
                  {char}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (item.type) {
      case "npc":
        return renderNPCDetails();
      case "quest":
        return renderQuestDetails();
      case "dialogue":
        return renderDialogueDetails();
      case "lore":
        return renderLoreDetails();
      default:
        return null;
    }
  };

  const typeIcons: Record<ContentType, any> = {
    npc: User,
    quest: Scroll,
    dialogue: FileText,
    lore: BookOpen,
    audio: Mic,
  };

  const TypeIcon = typeIcons[item.type];

  return (
    <div
      className="fixed inset-x-0 top-0 bottom-16 lg:top-16 lg:bottom-0 z-modal flex items-center justify-center pointer-events-none"
      data-overlay="true"
    >
      {/* Backdrop - only covers content area, not the navigation (top header on desktop, bottom nav on mobile) */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 pointer-events-auto"
        onClick={handleBackdropClick}
      />
      <div className="bg-bg-primary border border-border-primary rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 relative pointer-events-auto z-10">
        {/* Floating Action Buttons */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
          <button
            onClick={() => {
              onEdit();
              onClose();
            }}
            className="p-3 bg-bg-secondary/90 backdrop-blur-sm hover:bg-primary/20 border border-border-primary rounded-xl transition-colors group shadow-lg"
            title="Edit"
          >
            <Edit className="w-5 h-5 text-text-tertiary group-hover:text-primary" />
          </button>
          <button
            onClick={() => {
              onDelete();
              onClose();
            }}
            className="p-3 bg-bg-secondary/90 backdrop-blur-sm hover:bg-red-500/20 border border-border-primary rounded-xl transition-colors group shadow-lg"
            title="Delete"
          >
            <Trash2 className="w-5 h-5 text-text-tertiary group-hover:text-red-400" />
          </button>
          <button
            onClick={onClose}
            className="p-3 bg-bg-secondary/90 backdrop-blur-sm hover:bg-bg-tertiary border border-border-primary rounded-xl transition-colors shadow-lg"
            title="Close"
          >
            <X className="w-5 h-5 text-text-tertiary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[90vh]">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
