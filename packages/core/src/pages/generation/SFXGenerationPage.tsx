import React from "react";
import { AudioGenerationPage } from "../AudioGenerationPage";

/**
 * SFX Generation Page
 *
 * Specialized page for generating sound effects.
 * Wraps the AudioGenerationPage with type pre-selected to 'sfx'.
 */
export function SFXGenerationPage() {
  return <AudioGenerationPage initialType="sfx" />;
}

export default SFXGenerationPage;
