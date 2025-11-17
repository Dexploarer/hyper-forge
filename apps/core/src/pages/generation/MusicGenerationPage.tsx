import React from "react";
import { AudioGenerationPage } from "../AudioGenerationPage";

/**
 * Music Generation Page
 *
 * Specialized page for generating music and soundtracks.
 * Wraps the AudioGenerationPage with type pre-selected to 'music'.
 */
export function MusicGenerationPage() {
  return <AudioGenerationPage initialType="music" />;
}

export default MusicGenerationPage;
