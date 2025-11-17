/**
 * Qdrant vector database initialization
 * Sets up collections for semantic search
 */

import { qdrantService } from "../services/QdrantService";
import { logger } from '../utils/logger';

export async function initializeQdrantCollections(): Promise<void> {
  // Skip initialization if Qdrant is not configured
  if (!process.env.QDRANT_URL) {
    console.log(
      "[Qdrant] QDRANT_URL not configured - skipping vector search initialization",
    );
    return;
  }

  try {
    logger.info({ }, '[Qdrant] Initializing vector search collections...');

    // Health check with timeout to prevent hanging
    const healthCheck = qdrantService.healthCheck();
    const timeout = new Promise<boolean>((_, reject) =>
      setTimeout(() => reject(new Error("Qdrant health check timeout")), 10000),
    );

    const healthy = await Promise.race([healthCheck, timeout]).catch(
      (error) => {
        console.warn(
          "[Qdrant] Health check failed or timed out:",
          error.message,
        );
        return false;
      },
    );

    if (!healthy) {
      console.warn(
        "[Qdrant] Health check failed - vector search may not be available",
      );
      return;
    }

    // Initialize all collections with timeout
    const initialization = qdrantService.initializeCollections();
    const initTimeout = new Promise<void>((_, reject) =>
      setTimeout(
        () => reject(new Error("Qdrant initialization timeout")),
        30000,
      ),
    );

    await Promise.race([initialization, initTimeout]);

    logger.info({ }, '[Qdrant] Vector search initialized successfully');
  } catch (error) {
    logger.error({ err: error }, '[Qdrant] Failed to initialize collections:');
    console.warn(
      "[Qdrant] Vector search will not be available. Server will continue without it.",
    );
  }
}
