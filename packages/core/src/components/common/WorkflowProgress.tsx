import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/styles";

export interface WorkflowProgressProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
  className?: string;
}

/**
 * Workflow Progress Component
 *
 * Displays a step-by-step progress indicator for multi-step workflows
 *
 * @example
 * ```tsx
 * <WorkflowProgress
 *   currentStep={2}
 *   totalSteps={4}
 *   steps={['Select Assets', 'Fit Equipment', 'Bind Weights', 'Export']}
 * />
 * ```
 */
export const WorkflowProgress: React.FC<WorkflowProgressProps> = ({
  currentStep,
  totalSteps,
  steps,
  className,
}) => {
  // Calculate progress percentage
  const progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className={cn("w-full", className)}>
      {/* Progress Bar */}
      <div className="relative mb-8">
        {/* Background track */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-border-primary" />

        {/* Active progress */}
        <div
          className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Step indicators */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;
            const isPending = stepNumber > currentStep;

            return (
              <div key={index} className="flex flex-col items-center">
                {/* Step circle */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 shadow-lg",
                    {
                      "bg-primary text-white ring-4 ring-primary/20 scale-110":
                        isCurrent,
                      "bg-primary text-white": isCompleted,
                      "bg-bg-tertiary text-text-tertiary": isPending,
                    },
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" strokeWidth={3} />
                  ) : (
                    stepNumber
                  )}
                </div>

                {/* Step label */}
                <div
                  className={cn(
                    "mt-3 text-center max-w-[120px] transition-all duration-300",
                    {
                      "text-primary font-semibold": isCurrent,
                      "text-text-primary font-medium": isCompleted,
                      "text-text-tertiary text-sm": isPending,
                    },
                  )}
                >
                  {step}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current step info */}
      <div className="text-center">
        <p className="text-sm text-text-secondary">
          Step {currentStep} of {totalSteps}:{" "}
          <span className="text-text-primary font-medium">
            {steps[currentStep - 1]}
          </span>
        </p>
      </div>
    </div>
  );
};
