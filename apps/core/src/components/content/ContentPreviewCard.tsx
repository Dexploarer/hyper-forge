import {
  Download,
  FileJson,
  FileText,
  Copy,
  Check,
  Sparkles,
  Loader2,
  User,
  Volume2,
  Play,
  Pause,
  Save,
  Scroll,
  Book,
  TestTube2,
  ChevronDown,
  Image as ImageIcon,
  Eye,
  MessageSquare,
  Briefcase,
  Maximize2,
} from "lucide-react";
import React, { useState, useRef, useEffect } from "react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  LoadingSpinner,
} from "../common";
import { api } from "@/lib/api-client";
import { AudioAPIClient } from "@/services/api/AudioAPIClient";
import { notify } from "@/utils/notify";
import { useNavigation } from "@/hooks/useNavigation";
import { cn } from "@/styles";
import {
  DialogueData,
  type GeneratedContent,
  type NPCData,
  type QuestData,
  type DialogueNode,
  type LoreData,
} from "@/types/content";
import { ViewModeToggle, type ViewMode } from "./Workflow/ViewModeToggle";
import { DialogueWorkflowView } from "./Workflow/DialogueWorkflowView";
import { QuestWorkflowView } from "./Workflow/QuestWorkflowView";
import { QuestGenerationModal } from "./QuestGenerationModal";
import { LoreGenerationModal } from "./LoreGenerationModal";
import { ImageEnlargeModal } from "./ImageEnlargeModal";

interface ContentPreviewCardProps {
  content: GeneratedContent;
}

export const ContentPreviewCard: React.FC<ContentPreviewCardProps> = ({
  content,
}) => {
  const { navigateToPlaytester } = useNavigation();
  const [audioClient] = useState(() => new AudioAPIClient());
  const [copied, setCopied] = useState(false);
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null);
  const [isGeneratingPortrait, setIsGeneratingPortrait] = useState(false);
  const [isSavingPortrait, setIsSavingPortrait] = useState(false);
  const [voiceAudioUrl, setVoiceAudioUrl] = useState<string | null>(null);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [isSavingVoice, setIsSavingVoice] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [savedPortraitId, setSavedPortraitId] = useState<string | null>(null);
  const [savedVoiceId, setSavedVoiceId] = useState<string | null>(null);
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [showLoreModal, setShowLoreModal] = useState(false);
  const [generatedQuestId, setGeneratedQuestId] = useState<string | null>(null);
  const [generatedLoreId, setGeneratedLoreId] = useState<string | null>(null);
  const [showGenerateDropdown, setShowGenerateDropdown] = useState(false);
  const generateDropdownRef = useRef<HTMLDivElement>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  const handleGeneratePortrait = async () => {
    if (content.type !== "npc") return;

    const npc = content.data as NPCData;

    try {
      setIsGeneratingPortrait(true);
      const result = await api.api.content["generate-npc-portrait"].post(
        {
          npcName: npc.name,
          archetype: npc.archetype,
          appearance: npc.appearance.description,
          personality: npc.personality.traits.join(", "),
        },
      );

      if (result.error) {
        throw new Error(
          result.error.value?.message ||
            result.error.value?.summary ||
            "Failed to generate portrait",
        );
      }

      setPortraitUrl(result.data!.imageUrl);
      notify.success("Portrait generated successfully!");
    } catch (error) {
      console.error("Failed to generate portrait:", error);
      notify.error("Failed to generate portrait");
    } finally {
      setIsGeneratingPortrait(false);
    }
  };

  const handleGenerateVoice = async () => {
    if (content.type !== "npc") return;

    const npc = content.data as NPCData;

    try {
      setIsGeneratingVoice(true);

      // Get voice library to select an appropriate voice
      const voices = await audioClient.getVoiceLibrary();

      // Simple voice selection based on archetype
      let selectedVoice = voices[0]; // default

      // Try to match archetype to voice category
      const archetypeLower = npc.archetype.toLowerCase();
      if (
        archetypeLower.includes("warrior") ||
        archetypeLower.includes("knight")
      ) {
        selectedVoice =
          voices.find(
            (v) =>
              v.category === "strong" || v.name.toLowerCase().includes("male"),
          ) || voices[0];
      } else if (
        archetypeLower.includes("mage") ||
        archetypeLower.includes("wizard")
      ) {
        selectedVoice =
          voices.find(
            (v) =>
              v.category === "wise" || v.name.toLowerCase().includes("old"),
          ) || voices[0];
      } else if (
        archetypeLower.includes("merchant") ||
        archetypeLower.includes("noble")
      ) {
        selectedVoice =
          voices.find(
            (v) => v.category === "smooth" || v.category === "professional",
          ) || voices[0];
      }

      // Generate voice using greeting dialogue
      const audioData = await audioClient.generateVoice({
        text: npc.dialogue.greeting,
        voiceId: selectedVoice.voiceId,
        settings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
        },
      });

      // Convert base64 to blob URL
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);

      setVoiceAudioUrl(url);
      notify.success("Voice generated successfully!");
    } catch (error) {
      console.error("Failed to generate voice:", error);
      notify.error("Failed to generate voice");
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  const handlePlayVoice = () => {
    if (!voiceAudioUrl) return;

    if (audioRef.current) {
      if (isPlayingVoice) {
        audioRef.current.pause();
        setIsPlayingVoice(false);
      } else {
        audioRef.current.play();
        setIsPlayingVoice(true);
      }
    } else {
      const audio = new Audio(voiceAudioUrl);
      audioRef.current = audio;
      audio.onended = () => setIsPlayingVoice(false);
      audio.play();
      setIsPlayingVoice(true);
    }
  };

  const handleSavePortrait = async () => {
    if (!portraitUrl || !content.id) return;

    try {
      setIsSavingPortrait(true);

      // Fetch the image and convert to base64
      const response = await fetch(portraitUrl);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const base64Image = base64data.split(",")[1]; // Remove data:image/png;base64, prefix

        // Save to backend
        const result = await api.api.content.media["save-portrait"].post(
          {
            entityType: "npc",
            entityId: content.id!,
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

        setSavedPortraitId(result.data!.mediaId);
        notify.success("Portrait saved successfully!");
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Failed to save portrait:", error);
      notify.error("Failed to save portrait");
    } finally {
      setIsSavingPortrait(false);
    }
  };

  const handleSaveVoice = async () => {
    if (!voiceAudioUrl || !content.id) return;

    try {
      setIsSavingVoice(true);

      // Fetch the audio and convert to base64
      const response = await fetch(voiceAudioUrl);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const base64Audio = base64data.split(",")[1]; // Remove data:audio/mpeg;base64, prefix

        // Save to backend
        const result = await api.api.content.media["save-voice"].post({
          entityType: "npc",
          entityId: content.id!,
          audioData: base64Audio,
        });

        if (result.error) {
          throw new Error(
            result.error.value?.message ||
              result.error.value?.summary ||
              "Failed to save voice",
          );
        }

        setSavedVoiceId(result.data!.mediaId);
        notify.success("Voice saved successfully!");
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Failed to save voice:", error);
      notify.error("Failed to save voice");
    } finally {
      setIsSavingVoice(false);
    }
  };

  const handleQuestSuccess = (quest: QuestData & { id: string }) => {
    setGeneratedQuestId(quest.id);
    notify.success("Quest generated and linked!");
    setShowQuestModal(false);
  };

  const handleLoreSuccess = (lore: LoreData & { id: string }) => {
    setGeneratedLoreId(lore.id);
    notify.success("Lore generated and linked!");
    setShowLoreModal(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showGenerateDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        generateDropdownRef.current &&
        !generateDropdownRef.current.contains(event.target as Node)
      ) {
        setShowGenerateDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showGenerateDropdown]);

  const handleGenerateOption = (
    option: "portrait" | "voice" | "quest" | "lore",
  ) => {
    setShowGenerateDropdown(false);
    switch (option) {
      case "portrait":
        handleGeneratePortrait();
        break;
      case "voice":
        handleGenerateVoice();
        break;
      case "quest":
        setShowQuestModal(true);
        break;
      case "lore":
        setShowLoreModal(true);
        break;
    }
  };

  const handleCopyJSON = () => {
    const jsonData = JSON.stringify(content.data, null, 2);
    navigator.clipboard.writeText(jsonData);
    setCopied(true);
    notify.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const jsonData = JSON.stringify(content.data, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${content.name.toLowerCase().replace(/\s+/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify.success("Downloaded JSON file!");
  };

  const handleDownloadTXT = () => {
    let textContent = "";

    if (content.type === "npc") {
      const npc = content.data as NPCData;
      textContent = `${npc.name} - ${npc.archetype}\n\n`;
      textContent += `PERSONALITY\n${npc.personality.traits.join(", ")}\n${npc.personality.background}\n\n`;
      textContent += `APPEARANCE\n${npc.appearance.description}\n\n`;
      textContent += `DIALOGUE\nGreeting: ${npc.dialogue.greeting}\nFarewell: ${npc.dialogue.farewell}\n\n`;
      textContent += `BEHAVIOR\n${npc.behavior.role}\n${npc.behavior.schedule}`;
    } else if (content.type === "quest") {
      const quest = content.data as QuestData;
      textContent = `${quest.title}\n\n${quest.description}\n\n`;
      textContent += `OBJECTIVES:\n${quest.objectives.map((o) => `- ${o.description}`).join("\n")}\n\n`;
      textContent += `STORY:\n${quest.story}`;
    } else if (content.type === "dialogue") {
      const dialogue = content.data as DialogueData;
      const nodes = dialogue.nodes;
      textContent = `DIALOGUE TREE\n\n`;
      nodes.forEach((node, i) => {
        textContent += `Node ${i + 1} (${node.id}):\n${node.text}\n`;
        if (node.responses) {
          node.responses.forEach((r) => {
            textContent += `  → ${r.text}${r.nextNodeId ? ` (goes to ${r.nextNodeId})` : ""}\n`;
          });
        }
        textContent += "\n";
      });
    } else if (content.type === "lore") {
      const lore = content.data as LoreData;
      textContent = `${lore.title}\nCategory: ${lore.category}\n\n`;
      textContent += `${lore.content}\n\n`;
      textContent += `Summary: ${lore.summary}\n\n`;
      if (lore.relatedTopics.length > 0) {
        textContent += `Related: ${lore.relatedTopics.join(", ")}`;
      }
    }

    const blob = new Blob([textContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${content.name.toLowerCase().replace(/\s+/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify.success("Downloaded text file!");
  };

  const handleImportToPlaytester = () => {
    // Map content types to playtester content types
    const contentTypeMap: Record<
      string,
      "quest" | "dialogue" | "npc" | "combat" | "puzzle"
    > = {
      quest: "quest",
      dialogue: "dialogue",
      npc: "npc",
      lore: "quest", // Lore can be tested as quest-like content
    };

    const playtestContentType = contentTypeMap[content.type];
    if (!playtestContentType) {
      notify.warning("This content type cannot be imported to playtester");
      return;
    }

    // Extract the actual content data (remove metadata/id fields that aren't needed)
    let contentToTest: unknown = content.data;

    // For quests, ensure we have the full quest structure
    if (content.type === "quest") {
      const quest = content.data as QuestData & {
        id?: string;
        difficulty?: string;
        questType?: string;
        metadata?: any;
      };
      // Remove non-quest fields
      const { id, metadata, ...questData } = quest;
      contentToTest = questData;
    }

    // For NPCs, use the NPC data structure
    if (content.type === "npc") {
      const npc = content.data as NPCData & { id?: string; metadata?: any };
      const { id, metadata, ...npcData } = npc;
      contentToTest = npcData;
    }

    // For dialogue, extract nodes from DialogueData
    if (content.type === "dialogue") {
      const dialogue = content.data as DialogueData;
      contentToTest = dialogue.nodes;
    }

    // Navigate to playtester with the content
    navigateToPlaytester(contentToTest, playtestContentType);
    notify.success(`Imported ${content.type} to playtester!`);
  };

  const renderContent = () => {
    if (content.type === "npc") {
      const npc = content.data as NPCData;
      return (
        <div className="space-y-6">
          {/* Social Network Style Profile Header */}
          <div className="relative">
            {/* Cover/Banner Area */}
            <div className="h-24 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-t-xl border-b border-border-primary relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/5 to-black/10" />
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                }}
              />
            </div>

            {/* Profile Picture & Name Section */}
            <div className="relative px-6 -mt-16">
              <div className="flex items-end gap-4">
                {/* Large Circular Profile Picture */}
                <div className="relative">
                  <button
                    onClick={() => portraitUrl && setShowImageModal(true)}
                    disabled={!portraitUrl}
                    className={cn(
                      "w-32 h-32 rounded-full border-4 border-bg-primary shadow-xl overflow-hidden transition-all duration-300",
                      portraitUrl
                        ? "cursor-pointer hover:scale-105 hover:shadow-2xl hover:border-primary/50"
                        : "cursor-default",
                      isGeneratingPortrait && "animate-pulse",
                    )}
                    aria-label={
                      portraitUrl ? "Click to enlarge portrait" : undefined
                    }
                  >
                    {portraitUrl ? (
                      <div className="relative w-full h-full group">
                        <img
                          src={portraitUrl}
                          alt={`${npc.name} portrait`}
                          className="w-full h-full object-cover"
                        />
                        {/* Enlarge icon overlay on hover */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Maximize2 className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-bg-tertiary to-bg-secondary flex items-center justify-center">
                        <User className="w-16 h-16 text-text-tertiary/50" />
                      </div>
                    )}
                  </button>

                  {/* Profile completion indicator */}
                  {savedPortraitId && (
                    <div className="absolute bottom-1 right-1 w-8 h-8 bg-green-500 rounded-full border-2 border-bg-primary flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                {/* Name and Archetype */}
                <div className="flex-1 pb-2">
                  <h3 className="text-2xl font-bold text-text-primary mb-1">
                    {npc.name}
                  </h3>
                  <p className="text-base text-text-secondary capitalize mb-2">
                    {npc.archetype}
                  </p>

                  {/* Generated Content Status Pills */}
                  <div className="flex flex-wrap gap-2">
                    {portraitUrl && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-xs text-blue-400">
                        <ImageIcon className="w-3 h-3" />
                        Portrait
                      </span>
                    )}
                    {voiceAudioUrl && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/10 border border-green-500/30 rounded-full text-xs text-green-400">
                        <Volume2 className="w-3 h-3" />
                        Voice
                      </span>
                    )}
                    {generatedQuestId && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs text-amber-400">
                        <Scroll className="w-3 h-3" />
                        Quest
                      </span>
                    )}
                    {generatedLoreId && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-xs text-purple-400">
                        <Book className="w-3 h-3" />
                        Lore
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Generation Actions - Prominent Buttons */}
          <div className="flex flex-col gap-3 px-6">
            {/* Primary Generation Actions Row */}
            <div
              className="relative flex items-center gap-2"
              ref={generateDropdownRef}
            >
              <Button
                onClick={() => {
                  // Default action: generate portrait if not generated, otherwise open dropdown
                  if (!portraitUrl && !isGeneratingPortrait) {
                    handleGeneratePortrait();
                  } else {
                    setShowGenerateDropdown(!showGenerateDropdown);
                  }
                }}
                disabled={isGeneratingPortrait || isGeneratingVoice}
                className="flex-1 relative overflow-hidden bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg shadow-primary/20 micro-shimmer-button"
              >
                {isGeneratingPortrait || isGeneratingVoice ? (
                  <>
                    <LoadingSpinner size="md" className="mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    AI Generate Content
                  </>
                )}
              </Button>

              {/* Dropdown Button */}
              <button
                onClick={() => setShowGenerateDropdown(!showGenerateDropdown)}
                disabled={isGeneratingPortrait || isGeneratingVoice}
                className={cn(
                  "px-4 py-2 rounded-lg border border-border-primary bg-bg-secondary hover:bg-bg-tertiary transition-all",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  showGenerateDropdown &&
                    "bg-bg-tertiary ring-2 ring-primary/30",
                )}
                aria-label="More generation options"
              >
                <ChevronDown
                  className={cn(
                    "w-5 h-5 text-text-secondary transition-transform",
                    showGenerateDropdown && "rotate-180",
                  )}
                />
              </button>

              {/* Dropdown Menu */}
              {showGenerateDropdown && (
                <div className="absolute top-full mt-2 right-0 bg-bg-secondary border border-border-primary rounded-lg shadow-xl overflow-hidden z-dropdown min-w-[180px] animate-fade-in">
                  <button
                    onClick={() => handleGenerateOption("portrait")}
                    disabled={isGeneratingPortrait}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors disabled:opacity-50"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Generate Portrait</span>
                    {portraitUrl && (
                      <Check className="w-3 h-3 ml-auto text-green-500" />
                    )}
                  </button>
                  <button
                    onClick={() => handleGenerateOption("voice")}
                    disabled={isGeneratingVoice}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors disabled:opacity-50"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Generate Voice</span>
                    {voiceAudioUrl && (
                      <Check className="w-3 h-3 ml-auto text-green-500" />
                    )}
                  </button>
                  <button
                    onClick={() => handleGenerateOption("quest")}
                    disabled={!content.id}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors disabled:opacity-50"
                  >
                    <Scroll className="w-4 h-4" />
                    <span>Generate Quest</span>
                    {generatedQuestId && (
                      <Check className="w-3 h-3 ml-auto text-green-500" />
                    )}
                  </button>
                  <button
                    onClick={() => handleGenerateOption("lore")}
                    disabled={!content.id}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors disabled:opacity-50"
                  >
                    <Book className="w-4 h-4" />
                    <span>Generate Lore</span>
                    {generatedLoreId && (
                      <Check className="w-3 h-3 ml-auto text-green-500" />
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Action Buttons Row (Save/Play) */}
            {(portraitUrl || voiceAudioUrl) && (
              <div className="flex flex-col items-center gap-2">
                {/* Info message if content not saved yet */}
                {!content.id && portraitUrl && (
                  <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-1.5">
                    Portrait will be temporary until NPC is saved to library
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {portraitUrl && !savedPortraitId && content.id && (
                    <Button
                      onClick={handleSavePortrait}
                      disabled={isSavingPortrait}
                      size="sm"
                      variant="secondary"
                      className="text-xs"
                    >
                      {isSavingPortrait ? (
                        <>
                          <LoadingSpinner size="xs" className="mr-1" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-3 h-3 mr-1" />
                          Save Portrait
                        </>
                      )}
                    </Button>
                  )}
                  {voiceAudioUrl && (
                    <>
                      {!savedVoiceId && (
                        <Button
                          onClick={handleSaveVoice}
                          disabled={isSavingVoice}
                          size="sm"
                          variant="secondary"
                          className="text-xs"
                        >
                          {isSavingVoice ? (
                            <>
                              <LoadingSpinner size="xs" className="mr-1" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-3 h-3 mr-1" />
                              Save Voice
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        onClick={handlePlayVoice}
                        size="sm"
                        variant="secondary"
                        className="text-xs"
                      >
                        {isPlayingVoice ? (
                          <>
                            <Pause className="w-3 h-3 mr-1" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 mr-1" />
                            Play
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Card-Based Information Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6">
            {/* Personality Card */}
            <div className="bg-bg-secondary/50 border border-border-primary rounded-xl p-4 hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <h4 className="text-base font-semibold text-text-primary">
                  Personality
                </h4>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed mb-3">
                {npc.personality.background}
              </p>
              <div className="flex flex-wrap gap-2">
                {npc.personality.traits.map((trait, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-primary/10 border border-primary/30 rounded-full text-xs font-medium text-primary"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>

            {/* Appearance Card */}
            <div className="bg-bg-secondary/50 border border-border-primary rounded-xl p-4 hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Eye className="w-4 h-4 text-accent" />
                </div>
                <h4 className="text-base font-semibold text-text-primary">
                  Appearance
                </h4>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                {npc.appearance.description}
              </p>
            </div>

            {/* Dialogue Card */}
            <div className="bg-bg-secondary/50 border border-border-primary rounded-xl p-4 hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-green-400" />
                </div>
                <h4 className="text-base font-semibold text-text-primary">
                  Dialogue
                </h4>
              </div>
              <div className="space-y-3">
                <div className="bg-bg-tertiary/30 rounded-lg p-3 border-l-2 border-green-500/50">
                  <p className="text-xs text-text-tertiary mb-1">Greeting</p>
                  <p className="text-sm text-text-primary italic">
                    "{npc.dialogue.greeting}"
                  </p>
                </div>
                <div className="bg-bg-tertiary/30 rounded-lg p-3 border-l-2 border-blue-500/50">
                  <p className="text-xs text-text-tertiary mb-1">Farewell</p>
                  <p className="text-sm text-text-primary italic">
                    "{npc.dialogue.farewell}"
                  </p>
                </div>
              </div>
            </div>

            {/* Behavior Card */}
            <div className="bg-bg-secondary/50 border border-border-primary rounded-xl p-4 hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-amber-400" />
                </div>
                <h4 className="text-base font-semibold text-text-primary">
                  Behavior & Role
                </h4>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-text-tertiary mb-1">Role</p>
                  <p className="text-sm text-text-primary font-medium">
                    {npc.behavior.role}
                  </p>
                </div>
                <div className="border-t border-border-primary/50 pt-2">
                  <p className="text-xs text-text-tertiary mb-1">Schedule</p>
                  <p className="text-sm text-text-secondary">
                    {npc.behavior.schedule}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Image Enlarge Modal */}
          {portraitUrl && (
            <ImageEnlargeModal
              open={showImageModal}
              onClose={() => setShowImageModal(false)}
              imageUrl={portraitUrl}
              alt={`${npc.name} portrait`}
              title={`${npc.name} - ${npc.archetype}`}
              onDownload={() => {
                const a = document.createElement("a");
                a.href = portraitUrl;
                a.download = `${npc.name.toLowerCase().replace(/\s+/g, "-")}-portrait.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                notify.success("Portrait downloaded!");
              }}
            />
          )}

          {/* Quest Generation Modal */}
          {content.id && (
            <QuestGenerationModal
              open={showQuestModal}
              onClose={() => setShowQuestModal(false)}
              npc={npc}
              npcId={content.id}
              onSuccess={handleQuestSuccess}
            />
          )}

          {/* Lore Generation Modal */}
          {content.id && (
            <LoreGenerationModal
              open={showLoreModal}
              onClose={() => setShowLoreModal(false)}
              npc={npc}
              npcId={content.id}
              onSuccess={handleLoreSuccess}
            />
          )}
        </div>
      );
    } else if (content.type === "quest") {
      const quest = content.data as QuestData;
      return (
        <div className="space-y-4 h-full flex flex-col">
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />

          {viewMode === "list" ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-text-primary mb-2">
                  {quest.title}
                </h3>
                <p className="text-sm text-text-secondary">
                  {quest.description}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-text-primary mb-2">
                  Objectives
                </h4>
                <div className="space-y-2">
                  {quest.objectives.map((obj, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-0.5">•</span>
                      <div className="flex-1">
                        <p className="text-text-secondary">{obj.description}</p>
                        <p className="text-xs text-text-tertiary capitalize">
                          {obj.type} - {obj.target} ({obj.count}x)
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-text-primary mb-2">
                  Rewards
                </h4>
                <div className="space-y-1 text-sm">
                  <p className="text-text-secondary">
                    Experience:{" "}
                    <span className="text-primary">
                      {quest.rewards.experience} XP
                    </span>
                  </p>
                  <p className="text-text-secondary">
                    Gold:{" "}
                    <span className="text-primary">
                      {quest.rewards.gold} gold
                    </span>
                  </p>
                  {quest.rewards.items.length > 0 && (
                    <p className="text-text-secondary">
                      Items: {quest.rewards.items.join(", ")}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-text-primary mb-2">
                  Story
                </h4>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {quest.story}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-[500px]">
              <QuestWorkflowView quest={quest} />
            </div>
          )}
        </div>
      );
    } else if (content.type === "dialogue") {
      // Handle both old format (DialogueNode[]) and new format (DialogueData)
      let dialogueData: DialogueData;
      if (Array.isArray(content.data)) {
        // Old format - convert to DialogueData class
        dialogueData = DialogueData.create({
          nodes: content.data,
          metadata: {
            characterName: content.name,
            description: `Dialogue tree with ${content.data.length} nodes`,
          },
        });
      } else {
        // New format - already DialogueData
        dialogueData = content.data as DialogueData;
      }
      const nodes = dialogueData.nodes;

      return (
        <div className="space-y-4 h-full flex flex-col">
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />

          {viewMode === "list" ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary">
                Dialogue Tree ({nodes.length} nodes)
              </h3>
              {nodes.map((node, i) => (
                <div
                  key={node.id}
                  className="p-4 bg-bg-tertiary/30 border border-border-primary rounded-lg"
                >
                  <div className="text-xs text-text-tertiary mb-2">
                    Node {i + 1} - {node.id}
                  </div>
                  <p className="text-sm text-text-primary mb-3">
                    "{node.text}"
                  </p>
                  {node.responses && node.responses.length > 0 && (
                    <div className="space-y-2 pl-4 border-l-2 border-primary/30">
                      {node.responses.map((response, ri) => (
                        <div key={ri} className="text-sm">
                          <p className="text-text-secondary">
                            → "{response.text}"
                          </p>
                          {response.nextNodeId && (
                            <p className="text-xs text-text-tertiary mt-1">
                              Goes to: {response.nextNodeId}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 min-h-[500px]">
              <DialogueWorkflowView dialogue={dialogueData} />
            </div>
          )}
        </div>
      );
    } else if (content.type === "lore") {
      const lore = content.data as LoreData;
      return (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-text-primary mb-1">
              {lore.title}
            </h3>
            <p className="text-sm text-text-tertiary capitalize">
              {lore.category}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-2">
              Summary
            </h4>
            <p className="text-sm text-text-secondary italic">{lore.summary}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-2">
              Content
            </h4>
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
              {lore.content}
            </p>
          </div>

          {lore.relatedTopics.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-2">
                Related Topics
              </h4>
              <div className="flex flex-wrap gap-2">
                {lore.relatedTopics.map((topic, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-bg-tertiary/50 border border-border-primary rounded text-xs text-text-secondary"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {lore.timeline && (
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-2">
                Timeline
              </h4>
              <p className="text-sm text-text-secondary">{lore.timeline}</p>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <Card className="h-full flex flex-col bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-tertiary border-border-primary">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold capitalize">
            {content.type} Preview
          </CardTitle>
          <div className="flex gap-2">
            {(content.type === "quest" ||
              content.type === "dialogue" ||
              content.type === "npc") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleImportToPlaytester}
                className="text-purple-500 hover:text-purple-400 hover:bg-purple-500/10"
              >
                <TestTube2 className="w-4 h-4 mr-1" />
                Test
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyJSON}
              className="text-text-secondary hover:text-text-primary"
            >
              {copied ? (
                <Check className="w-4 h-4 mr-1" />
              ) : (
                <Copy className="w-4 h-4 mr-1" />
              )}
              Copy
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownloadJSON}
              className="text-text-secondary hover:text-text-primary"
            >
              <FileJson className="w-4 h-4 mr-1" />
              JSON
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownloadTXT}
              className="text-text-secondary hover:text-text-primary"
            >
              <FileText className="w-4 h-4 mr-1" />
              TXT
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-6">
        {renderContent()}
      </CardContent>
    </Card>
  );
};
