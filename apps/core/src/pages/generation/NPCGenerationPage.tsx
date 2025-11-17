import React from "react";
import { ContentGenerationPage } from "../ContentGenerationPage";

/**
 * NPC Generation Page
 *
 * Specialized page for generating NPC characters with personality and dialogue.
 * Wraps the ContentGenerationPage with type pre-selected to 'npc'.
 */
export function NPCGenerationPage() {
  return <ContentGenerationPage initialType="npc" />;
}

export default NPCGenerationPage;
