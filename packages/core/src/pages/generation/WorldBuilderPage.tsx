import React from "react";
import { GenerationPage } from "../GenerationPage";

interface WorldBuilderPageProps {
  onNavigateToAssets?: () => void;
  onNavigateToAsset?: (assetId: string) => void;
}

/**
 * World Builder Page
 *
 * Specialized page for generating complete game worlds with interconnected content.
 * Wraps the main GenerationPage with world generation flag enabled.
 */
export function WorldBuilderPage({
  onNavigateToAssets,
  onNavigateToAsset,
}: WorldBuilderPageProps) {
  return (
    <GenerationPage
      onNavigateToAssets={onNavigateToAssets}
      onNavigateToAsset={onNavigateToAsset}
      initialPrompt=""
      shouldGenerateWorld={true}
    />
  );
}

export default WorldBuilderPage;
