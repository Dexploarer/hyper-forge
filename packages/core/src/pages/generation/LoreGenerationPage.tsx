import React from "react";
import { ContentGenerationPage } from "../ContentGenerationPage";

/**
 * Lore Generation Page
 *
 * Specialized page for generating world lore and story content.
 * Wraps the ContentGenerationPage with type pre-selected to 'lore'.
 */
export function LoreGenerationPage() {
  return <ContentGenerationPage initialType="lore" />;
}

export default LoreGenerationPage;
