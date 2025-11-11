import React, { useEffect } from "react";
import { GenerationPage } from "../GenerationPage";
import { useGenerationStore } from "@/store";

interface EnvironmentGenerationPageProps {
  onNavigateToAssets?: () => void;
  onNavigateToAsset?: (assetId: string) => void;
}

/**
 * Environment Generation Page
 *
 * Specialized page for generating environment and scenery 3D models.
 * Wraps the main GenerationPage with environment-specific configuration.
 */
export function EnvironmentGenerationPage({
  onNavigateToAssets,
  onNavigateToAsset,
}: EnvironmentGenerationPageProps) {
  const { setGenerationType } = useGenerationStore();

  useEffect(() => {
    // Set generation type to environment for environment/scenery generation
    setGenerationType("environment");

    // Don't reset on unmount to preserve state if user navigates back
  }, [setGenerationType]);

  return (
    <GenerationPage
      onNavigateToAssets={onNavigateToAssets}
      onNavigateToAsset={onNavigateToAsset}
      initialPrompt=""
      shouldGenerateWorld={false}
    />
  );
}

export default EnvironmentGenerationPage;
