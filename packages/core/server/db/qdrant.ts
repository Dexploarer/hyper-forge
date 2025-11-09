/**
 * Qdrant vector database initialization
 * Sets up collections for semantic search
 */

import { qdrantService } from "../services/QdrantService";

export async function initializeQdrantCollections(): Promise<void> {
  // Skip initialization if Qdrant is not configured
  if (!process.env.QDRANT_URL) {
    console.log(
      "[Qdrant] QDRANT_URL not configured - skipping vector search initialization",
    );
    return;
  }

  try {
    console.log("[Qdrant] Initializing vector search collections...");

    // Health check
    const healthy = await qdrantService.healthCheck();
    if (!healthy) {
      console.warn(
        "[Qdrant] Health check failed - vector search may not be available",
      );
      return;
    }

    // Initialize all collections
    await qdrantService.initializeCollections();

    console.log("[Qdrant] Vector search initialized successfully");
  } catch (error) {
    console.error("[Qdrant] Failed to initialize collections:", error);
    console.warn(
      "[Qdrant] Vector search will not be available. Server will continue without it.",
    );
  }
}
