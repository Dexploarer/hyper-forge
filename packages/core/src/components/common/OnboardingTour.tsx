import React, { useState, useEffect } from "react";
import Joyride, { CallBackProps, STATUS, EVENTS, Step } from "react-joyride";

export interface OnboardingTourProps {
  run: boolean;
  onComplete: () => void;
}

const ONBOARDING_STORAGE_KEY = "asset-forge-onboarding-completed";

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  run,
  onComplete,
}) => {
  const [runTour, setRunTour] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    // Check if onboarding has been completed
    const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!completed && run) {
      // Small delay to ensure DOM elements are rendered
      setTimeout(() => setRunTour(true), 500);
    }
  }, [run]);

  const steps: Step[] = [
    {
      target: "body",
      content: (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-text-primary">
            Welcome to Asset Forge!
          </h2>
          <p className="text-text-secondary">
            Let's take a quick tour of the key features to help you get started
            creating amazing 3D assets for your game.
          </p>
        </div>
      ),
      placement: "center",
      disableBeacon: true,
    },
    {
      target: '[data-tour="generation-type-selector"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-text-primary">
            Choose Asset Type
          </h3>
          <p className="text-text-secondary">
            Start by selecting what you want to create - avatars for characters
            or items like weapons and tools.
          </p>
        </div>
      ),
      placement: "bottom",
      disableBeacon: true,
    },
    {
      target: '[data-tour="asset-details"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-text-primary">
            Describe Your Asset
          </h3>
          <p className="text-text-secondary">
            Give your asset a name and detailed description. The more specific
            you are, the better the results!
          </p>
        </div>
      ),
      placement: "right",
      disableBeacon: true,
    },
    {
      target: '[data-tour="pipeline-options"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-text-primary">
            Configure Options
          </h3>
          <p className="text-text-secondary">
            Enable features like GPT-4 enhancement, material variants, sprites,
            or auto-rigging. Hover over the help icons for details.
          </p>
        </div>
      ),
      placement: "left",
      disableBeacon: true,
    },
    {
      target: '[data-tour="start-generation"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-text-primary">
            Generate Your Asset
          </h3>
          <p className="text-text-secondary">
            Click here to start the generation process. You'll see real-time
            progress as your asset is created.
          </p>
        </div>
      ),
      placement: "top",
      disableBeacon: true,
    },
    {
      target: '[data-tour="results-tab"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-text-primary">
            View & Export
          </h3>
          <p className="text-text-secondary">
            Once generation is complete, view your asset in 3D, download models,
            sprites, or generate more variants.
          </p>
        </div>
      ),
      placement: "bottom",
      disableBeacon: true,
    },
    {
      target: "body",
      content: (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-text-primary">
            You're All Set!
          </h2>
          <p className="text-text-secondary">
            Ready to create your first asset? If you need help later, check out
            our docs or join the Discord community.
          </p>
        </div>
      ),
      placement: "center",
      disableBeacon: true,
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index } = data;

    // Update step index
    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      setStepIndex(index + (data.action === "prev" ? -1 : 1));
    }

    // Handle tour completion or skip
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRunTour(false);
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
      onComplete();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={runTour}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: "var(--color-primary)",
          backgroundColor: "var(--color-bg-secondary)",
          textColor: "var(--color-text-primary)",
          overlayColor: "rgba(0, 0, 0, 0.6)",
          arrowColor: "var(--color-bg-secondary)",
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: "12px",
          padding: "20px",
        },
        tooltipContainer: {
          textAlign: "left",
        },
        buttonNext: {
          backgroundColor: "var(--color-primary)",
          borderRadius: "8px",
          padding: "8px 16px",
        },
        buttonBack: {
          color: "var(--color-text-secondary)",
          marginRight: "10px",
        },
        buttonSkip: {
          color: "var(--color-text-tertiary)",
        },
      }}
      locale={{
        back: "Back",
        close: "Close",
        last: "Finish",
        next: "Next",
        skip: "Skip Tour",
      }}
    />
  );
};

// Helper function to check if onboarding has been completed
export const hasCompletedOnboarding = (): boolean => {
  return localStorage.getItem(ONBOARDING_STORAGE_KEY) === "true";
};

// Helper function to reset onboarding (for testing)
export const resetOnboarding = (): void => {
  localStorage.removeItem(ONBOARDING_STORAGE_KEY);
};
