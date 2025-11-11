import React from "react";
import { ContentGenerationPage } from "../ContentGenerationPage";

/**
 * Quest Generation Page
 *
 * Specialized page for generating quest content with objectives and rewards.
 * Wraps the ContentGenerationPage with type pre-selected to 'quest'.
 */
export function QuestGenerationPage() {
  return <ContentGenerationPage initialType="quest" />;
}

export default QuestGenerationPage;
