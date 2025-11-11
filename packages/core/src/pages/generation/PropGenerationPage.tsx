import React, { useEffect } from "react";
import { GenerationPage } from "../GenerationPage";
import { useGenerationStore } from "@/store";

interface PropGenerationPageProps {
  onNavigateToAssets?: () => void;
  onNavigateToAsset?: (assetId: string) => void;
}

/**
 * Prop Generation Page
 *
 * Specialized page for generating props, items, and weapon 3D models.
 * Wraps the main GenerationPage with prop-specific configuration.
 */
export function PropGenerationPage({
  onNavigateToAssets,
  onNavigateToAsset,
}: PropGenerationPageProps) {
  const { setGenerationType } = useGenerationStore();

  useEffect(() => {
    // Set generation type to item for prop/item generation
    setGenerationType("item");

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

export default PropGenerationPage;
