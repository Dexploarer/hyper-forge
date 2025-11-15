import React, { useState } from "react";
import { Plus, Info, CheckCircle, AlertCircle } from "lucide-react";

import { Button, Card, CardHeader, CardContent } from "@/components/common";
import { BasicInfoStep } from "./editor-steps/BasicInfoStep";
import { ReviewStep } from "./editor-steps/ReviewStep";
import { worldConfigClient } from "@/services/api/WorldConfigAPIClient";
import { notify } from "@/utils/notify";

interface WorldConfigCreateTabProps {
  onConfigCreated: () => void;
}

const STEPS = [
  { id: 1, name: "Basic Info", icon: Info, component: BasicInfoStep },
  { id: 2, name: "Review", icon: CheckCircle, component: ReviewStep },
];

export const WorldConfigCreateTab: React.FC<WorldConfigCreateTabProps> = ({
  onConfigCreated,
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
  });

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

      await worldConfigClient.createConfiguration({
        name: formData.name,
        description: formData.description,
        genre: formData.genre,
        tags: formData.tags,
        isTemplate: formData.isTemplate,
        templateName: formData.templateName,
        // Use empty arrays/defaults for JSONB fields
        races: [],
        factions: [],
        skills: [],
        npcCategories: [],
      });

      notify.success("Configuration created successfully!");

      // Reset form
      setFormData({
        name: "",
        description: "",
        genre: "",
        tags: [],
        isTemplate: false,
        templateName: undefined,
      });
      setCurrentStep(1);

      // Refresh list
      onConfigCreated();
    } catch (error) {
      console.error("Failed to create configuration:", error);
      notify.error("Failed to create configuration");
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
  const isLastStep = currentStep === STEPS.length;

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                Create World Configuration
              </h2>
              <p className="text-sm text-text-secondary">
                Set up a new world configuration for AI content generation
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Steps Progress */}
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isComplete = currentStep > step.id;

              return (
                <React.Fragment key={step.id}>
                  <div
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${
                      isActive
                        ? "bg-primary/20 text-primary"
                        : isComplete
                          ? "bg-bg-tertiary text-text-primary"
                          : "bg-bg-tertiary/50 text-text-tertiary"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                        isActive
                          ? "bg-primary text-white"
                          : isComplete
                            ? "bg-primary/60 text-white"
                            : "bg-bg-tertiary text-text-tertiary"
                      }`}
                    >
                      {isComplete ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        step.id
                      )}
                    </div>
                    <span className="text-sm font-medium">{step.name}</span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className="flex-1 h-0.5 bg-border-primary mx-4" />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Step Content */}
          <div className="py-4">
            <CurrentStepComponent data={formData} onChange={setFormData} />
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-border-primary">
            <Button
              variant="secondary"
              onClick={handlePrevious}
              disabled={currentStep === 1 || isSaving}
            >
              Previous
            </Button>

            <div className="flex items-center gap-3">
              {!isLastStep ? (
                <Button onClick={handleNext} disabled={isSaving}>
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !validate()}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Configuration
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card className="mt-4 bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm text-text-secondary">
              <p className="font-medium text-primary mb-1">Getting Started</p>
              <p>
                After creating your configuration, you can edit it to add races,
                factions, skills, and other world elements. Configurations guide
                AI content generation to match your world's setting and tone.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
