import React from "react";
import { ContentGenerationPage } from "../ContentGenerationPage";

/**
 * Dialogue Generation Page
 *
 * Specialized page for generating branching dialogue trees and conversations.
 * Wraps the ContentGenerationPage with type pre-selected to 'dialogue'.
 */
export function DialogueGenerationPage() {
  return <ContentGenerationPage initialType="dialogue" />;
}

export default DialogueGenerationPage;
