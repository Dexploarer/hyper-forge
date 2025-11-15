import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

import { Button, Drawer } from "@/components/common";
import {
  worldConfigClient,
  type WorldConfigurationData,
} from "@/services/api/WorldConfigAPIClient";
import { notify } from "@/utils/notify";

import { BasicInfoStep } from "./editor-steps/BasicInfoStep";
import { RacesStep } from "./editor-steps/RacesStep";
import { FactionsStep } from "./editor-steps/FactionsStep";
import { SkillsStep } from "./editor-steps/SkillsStep";
import { NPCCategoriesStep } from "./editor-steps/NPCCategoriesStep";
import { QuestConfigStep } from "./editor-steps/QuestConfigStep";
import { AdvancedConfigStep } from "./editor-steps/AdvancedConfigStep";
import { ReviewStep } from "./editor-steps/ReviewStep";
import { StepNavigation } from "./shared";

interface WorldConfigEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  editConfig?: WorldConfigurationData | null;
}

const STEPS = [
  { id: 1, name: "Basic Info", component: BasicInfoStep },
  { id: 2, name: "Races", component: RacesStep },
  { id: 3, name: "Factions", component: FactionsStep },
  { id: 4, name: "Skills", component: SkillsStep },
  { id: 5, name: "NPC Categories", component: NPCCategoriesStep },
  { id: 6, name: "Quests", component: QuestConfigStep },
  { id: 7, name: "Advanced", component: AdvancedConfigStep },
  { id: 8, name: "Review", component: ReviewStep },
];

export const WorldConfigEditor: React.FC<WorldConfigEditorProps> = ({
  open,
  onClose,
  onSave,
  editConfig,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    genre: "",
    tags: [] as string[],
    isTemplate: false,
    templateName: undefined as string | undefined,
    races: [] as any[],
    factions: [] as any[],
    skills: [] as any[],
    npcCategories: [] as any[],
    questConfig: undefined as any,
    itemsConfig: undefined as any,
    locationsConfig: undefined as any,
    economySettings: undefined as any,
    aiPreferences: undefined as any,
  });

  // Initialize form data when editing
  useEffect(() => {
    if (editConfig) {
      setFormData({
        name: editConfig.name,
        description: editConfig.description,
        genre: editConfig.genre,
        tags: editConfig.tags,
        isTemplate: editConfig.isTemplate,
        templateName: editConfig.templateName || undefined,
        races: editConfig.races || [],
        factions: editConfig.factions || [],
        skills: editConfig.skills || [],
        npcCategories: editConfig.npcCategories || [],
        questConfig: editConfig.questConfig,
        itemsConfig: editConfig.itemsConfig,
        locationsConfig: editConfig.locationsConfig,
        economySettings: editConfig.economySettings,
        aiPreferences: editConfig.aiPreferences,
      });
    } else {
      // Reset to defaults
      setFormData({
        name: "",
        description: "",
        genre: "",
        tags: [],
        isTemplate: false,
        templateName: undefined,
        races: [],
        factions: [],
        skills: [],
        npcCategories: [],
        questConfig: undefined,
        itemsConfig: undefined,
        locationsConfig: undefined,
        economySettings: undefined,
        aiPreferences: undefined,
      });
    }
    setCurrentStep(1);
  }, [editConfig, open]);

  const validate = (): boolean => {
    if (!formData.name.trim()) {
      notify.warning("Please enter a configuration name");
      return false;
    }
    if (!formData.description.trim()) {
      notify.warning("Please enter a description");
      return false;
    }
    if (!formData.genre) {
      notify.warning("Please select a genre");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setIsSaving(true);

      if (editConfig) {
        // Update existing configuration
        await worldConfigClient.updateConfiguration(editConfig.id, {
          name: formData.name,
          description: formData.description,
          genre: formData.genre,
          tags: formData.tags,
          isTemplate: formData.isTemplate,
          templateName: formData.templateName,
          races: formData.races,
          factions: formData.factions,
          skills: formData.skills,
          npcCategories: formData.npcCategories,
          questConfig: formData.questConfig,
          itemsConfig: formData.itemsConfig,
          locationsConfig: formData.locationsConfig,
          economySettings: formData.economySettings,
          aiPreferences: formData.aiPreferences,
        });
        notify.success("Configuration updated successfully!");
      } else {
        // Create new configuration
        await worldConfigClient.createConfiguration({
          name: formData.name,
          description: formData.description,
          genre: formData.genre,
          tags: formData.tags,
          isTemplate: formData.isTemplate,
          templateName: formData.templateName,
          races: formData.races,
          factions: formData.factions,
          skills: formData.skills,
          npcCategories: formData.npcCategories,
          questConfig: formData.questConfig,
          itemsConfig: formData.itemsConfig,
          locationsConfig: formData.locationsConfig,
          economySettings: formData.economySettings,
          aiPreferences: formData.aiPreferences,
        });
        notify.success("Configuration created successfully!");
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("Failed to save configuration:", error);
      notify.error("Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && !validate()) {
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const CurrentStepComponent = STEPS[currentStep - 1].component;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editConfig ? "Edit Configuration" : "Create Configuration"}
      size="lg"
    >
      <div className="flex flex-col h-full">
        {/* Steps Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-primary">
          <div className="flex items-center gap-2">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                    currentStep === step.id
                      ? "bg-primary/20 text-primary"
                      : currentStep > step.id
                        ? "bg-bg-tertiary text-text-primary"
                        : "bg-bg-tertiary/50 text-text-tertiary"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                      currentStep === step.id
                        ? "bg-primary text-white"
                        : currentStep > step.id
                          ? "bg-primary/60 text-white"
                          : "bg-bg-tertiary text-text-tertiary"
                    }`}
                  >
                    {step.id}
                  </div>
                  <span className="text-sm font-medium">{step.name}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className="w-8 h-0.5 bg-border-primary" />
                )}
              </React.Fragment>
            ))}
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto pr-2">
          <CurrentStepComponent data={formData} onChange={setFormData} />
        </div>

        {/* Navigation */}
        <div className="mt-6">
          <StepNavigation
            currentStep={currentStep}
            totalSteps={STEPS.length}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onSave={handleSave}
            canGoNext={true}
            canGoPrevious={currentStep > 1}
            isSaving={isSaving}
            isLastStep={currentStep === STEPS.length}
          />
        </div>
      </div>
    </Drawer>
  );
};
