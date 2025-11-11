import React, { useEffect } from "react";
import { GenerationPage } from "../GenerationPage";
import { useGenerationStore } from "@/store";

interface CharacterGenerationPageProps {
  onNavigateToAssets?: () => void;
  onNavigateToAsset?: (assetId: string) => void;
}

/**
 * Character Generation Page
 *
 * Specialized page for generating character 3D models.
 * Wraps the main GenerationPage with character-specific configuration.
 */
export function CharacterGenerationPage({
  onNavigateToAssets,
  onNavigateToAsset,
}: CharacterGenerationPageProps) {
  const { setGenerationType } = useGenerationStore();

  useEffect(() => {
    // Set generation type to avatar for character generation
    setGenerationType("avatar");

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

export default CharacterGenerationPage;
