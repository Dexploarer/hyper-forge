import { ChevronLeft, ChevronRight, Save, Loader2 } from "lucide-react";
import React from "react";

import { Button } from "@/components/common";

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onSave: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  isSaving: boolean;
  isLastStep: boolean;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSave,
  canGoNext,
  canGoPrevious,
  isSaving,
  isLastStep,
}) => {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-border-primary">
      {/* Step Progress */}
      <div className="flex items-center gap-2">
        <div className="text-sm text-text-secondary">
          Step {currentStep} of {totalSteps}
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index + 1 === currentStep
                  ? "w-8 bg-primary"
                  : index + 1 < currentStep
                    ? "w-2 bg-primary/60"
                    : "w-2 bg-bg-tertiary"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-2">
        {canGoPrevious && (
          <Button variant="secondary" onClick={onPrevious} disabled={isSaving}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
        )}

        {!isLastStep ? (
          <Button onClick={onNext} disabled={!canGoNext || isSaving}>
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={onSave} disabled={!canGoNext || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Configuration
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
