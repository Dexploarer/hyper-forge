/**
 * Playtester Swarm API Client
 * Client for AI playtester swarm testing
 */

import { apiFetch } from "@/utils/api";

import type {
  RunPlaytestParams,
  PlaytestResult,
  AvailablePersonasResponse,
} from "@/types/playtester";

const API_BASE = "/api";

export class PlaytesterAPIClient {
  /**
   * Get available AI playtester personas
   */
  async getAvailablePersonas(): Promise<AvailablePersonasResponse> {
    const response = await apiFetch(`${API_BASE}/playtester-swarm`);

    if (!response.ok) {
      throw new Error(
        `Failed to get available personas: ${response.statusText}`,
      );
    }

    return await response.json();
  }

  /**
   * Run AI playtester swarm on game content
   */
  async runPlaytest(params: RunPlaytestParams): Promise<PlaytestResult> {
    const response = await apiFetch(`${API_BASE}/playtester-swarm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error ||
          errorData.details ||
          `Failed to run playtest: ${response.statusText}`,
      );
    }

    return await response.json();
  }
}
