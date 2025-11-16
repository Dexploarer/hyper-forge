import { Scroll, Loader2, CheckCircle, Sparkles } from "lucide-react";
import React, { useState } from "react";

import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalSection,
  Button,
  Select,
  Input,
  LoadingSpinner,
} from "../common";
import { api } from "@/lib/api-client";
import { notify } from "@/utils/notify";
import type { NPCData, QuestData } from "@/types/content";

interface QuestGenerationModalProps {
  open: boolean;
  onClose: () => void;
  npc: NPCData;
  npcId: string;
  onSuccess: (quest: QuestData & { id: string }) => void;
}

export const QuestGenerationModal: React.FC<QuestGenerationModalProps> = ({
  open,
  onClose,
  npc,
  npcId,
  onSuccess,
}) => {
  const [questType, setQuestType] = useState("Side Quest");
  const [difficulty, setDifficulty] = useState("Medium");
  const [theme, setTheme] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuest, setGeneratedQuest] = useState<
    (QuestData & { id: string }) | null
  >(null);
  const [status, setStatus] = useState<"config" | "generating" | "success">(
    "config",
  );

  const questTypes = [
    "Main Story",
    "Side Quest",
    "Daily Quest",
    "Bounty",
    "Fetch Quest",
    "Escort",
    "Investigation",
    "Raid",
  ];

  const difficulties = ["Easy", "Medium", "Hard", "Epic"];

  const handleGenerate = async () => {
    if (!npcId) {
      notify.error("NPC must be saved before generating quests");
      return;
    }

    try {
      setIsGenerating(true);
      setStatus("generating");

      const result = await api.api.content["generate-quest-for-npc"].post({
        npcId,
        npcName: npc.name,
        archetype: npc.archetype,
        personality: npc.personality.background,
        questType: questType as
          | "custom"
          | "combat"
          | "puzzle"
          | "fetch"
          | "stealth"
          | "crafting"
          | "exploration"
          | "escort"
          | "diplomatic"
          | "mystery",
        difficulty: difficulty.toLowerCase() as
          | "easy"
          | "medium"
          | "hard"
          | "expert",
        theme: theme || undefined,
        quality: "balanced",
      });

      if (result.error) {
        throw new Error(
          result.error.value?.message ||
            result.error.value?.summary ||
            "Failed to generate quest",
        );
      }

      setGeneratedQuest(result.data!.quest);
      setStatus("success");
      notify.success("Quest generated and linked to NPC!");
    } catch (error) {
      console.error("Failed to generate quest:", error);
      notify.error("Failed to generate quest");
      setStatus("config");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleComplete = () => {
    if (generatedQuest) {
      onSuccess(generatedQuest);
    }
    onClose();
  };

  const handleReset = () => {
    setGeneratedQuest(null);
    setStatus("config");
    setTheme("");
  };

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <ModalHeader title="Generate Quest" onClose={onClose} />

      <ModalBody>
        {status === "config" && (
          <ModalSection
            title="Quest Configuration"
            description={`Create a quest given by ${npc.name}`}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Quest Type
                </label>
                <Select
                  value={questType}
                  onChange={(e) => setQuestType(e.target.value)}
                  className="w-full"
                >
                  {questTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Difficulty
                </label>
                <Select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full"
                >
                  {difficulties.map((diff) => (
                    <option key={diff} value={diff}>
                      {diff}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Theme (Optional)
                </label>
                <Input
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="e.g., Ancient ruins, Dragon hunt, Political intrigue..."
                  className="w-full"
                />
                <p className="text-xs text-text-tertiary mt-1">
                  Provide additional context or a specific theme for the quest
                </p>
              </div>

              <div className="p-4 bg-bg-tertiary/30 border border-border-primary rounded-lg">
                <h4 className="text-sm font-semibold text-text-primary mb-2">
                  Quest Giver: {npc.name}
                </h4>
                <p className="text-xs text-text-secondary">
                  Archetype: {npc.archetype}
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  {npc.personality.background}
                </p>
              </div>
            </div>
          </ModalSection>
        )}

        {status === "generating" && (
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner size="md" className="w-16 h-16 text-primary mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Generating Quest...
            </h3>
            <p className="text-sm text-text-secondary text-center max-w-md">
              Creating a {difficulty.toLowerCase()} {questType.toLowerCase()}{" "}
              quest given by {npc.name}
            </p>
          </div>
        )}

        {status === "success" && generatedQuest && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <div>
                <h3 className="text-sm font-semibold text-green-500">
                  Quest Generated!
                </h3>
                <p className="text-xs text-text-secondary">
                  Quest has been linked to {npc.name}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-text-primary mb-2">
                  {generatedQuest.title}
                </h3>
                <p className="text-sm text-text-secondary">
                  {generatedQuest.description}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-text-primary mb-2">
                  Objectives
                </h4>
                <div className="space-y-2">
                  {generatedQuest.objectives.map((obj, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-0.5">•</span>
                      <p className="text-text-secondary">{obj.description}</p>
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
                      {generatedQuest.rewards.experience} XP
                    </span>
                  </p>
                  <p className="text-text-secondary">
                    Gold:{" "}
                    <span className="text-primary">
                      {generatedQuest.rewards.gold} gold
                    </span>
                  </p>
                  {generatedQuest.rewards.items.length > 0 && (
                    <p className="text-text-secondary">
                      Items: {generatedQuest.rewards.items.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        {status === "config" && (
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={isGenerating}>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Quest
            </Button>
          </>
        )}

        {status === "success" && (
          <>
            <Button variant="secondary" onClick={handleReset}>
              Generate Another
            </Button>
            <Button onClick={handleComplete}>
              <Scroll className="w-4 h-4 mr-2" />
              Done
            </Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
};
