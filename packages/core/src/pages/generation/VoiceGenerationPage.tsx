import React from "react";
import { AudioGenerationPage } from "../AudioGenerationPage";

/**
 * Voice Generation Page
 *
 * Specialized page for generating voice and TTS audio.
 * Wraps the AudioGenerationPage with type pre-selected to 'voice'.
 */
export function VoiceGenerationPage() {
  return <AudioGenerationPage initialType="voice" />;
}

export default VoiceGenerationPage;
