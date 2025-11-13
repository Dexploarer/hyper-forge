import { useEffect, useRef, useState } from "react";

import { useGenerationStore } from "../store";
import {
  GeneratedAsset,
  AssetType,
  BaseAssetMetadata,
  GenerationAssetMetadata,
} from "../types";

import { GenerationAPIClient } from "@/services/api/GenerationAPIClient";

interface UsePipelineStatusOptions {
  apiClient: GenerationAPIClient;
  onComplete?: (asset: GeneratedAsset) => void;
  onAssetListInvalidate?: () => void;
}

/**
 * Calculate polling interval based on elapsed time using exponential backoff
 * @param elapsedTime Time in milliseconds since polling started
 * @returns Polling interval in milliseconds
 */
const getPollingInterval = (elapsedTime: number): number => {
  const seconds = elapsedTime / 1000;

  // Aggressive polling for quick jobs (0-30s)
  if (seconds < 30) return 1000; // 1s for first 30s

  // Moderate polling for short jobs (30s-2min)
  if (seconds < 120) return 2000; // 2s for 30s-2min

  // Slower polling for medium jobs (2min-5min)
  if (seconds < 300) return 5000; // 5s for 2min-5min

  // Very slow polling for long jobs (5min-10min)
  if (seconds < 600) return 10000; // 10s for 5min-10min

  // Maximum interval for very long jobs (10min+)
  return 30000; // 30s max
};

export function usePipelineStatus({
  apiClient,
  onComplete,
  onAssetListInvalidate,
}: UsePipelineStatusOptions) {
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const [pollingError, setPollingError] = useState<string | null>(null);

  const {
    currentPipelineId,
    useGPT4Enhancement,
    enableRetexturing,
    enableSprites,
    assetName,
    assetType,
    generationType,
    characterHeight,
    generatedAssets,
    setIsGenerating,
    updatePipelineStage,
    setGeneratedAssets,
    setSelectedAsset,
    setActiveView,
  } = useGenerationStore();

  useEffect(() => {
    const DEBUG = (import.meta as any).env?.VITE_DEBUG_PIPELINE === "true";
    if (DEBUG)
      console.log(
        "Pipeline status effect triggered. currentPipelineId:",
        currentPipelineId,
      );
    if (!currentPipelineId) return;

    // Reset start time when pipeline starts
    startTimeRef.current = Date.now();

    const stageMapping: Record<string, string> = {
      textInput: "text-input",
      promptOptimization: "gpt4-enhancement",
      imageGeneration: "image-generation",
      image3D: "image-to-3d",
      baseModel: "image-to-3d",
      textureGeneration: "retexturing",
      spriteGeneration: "sprites",
      rigging: "rigging",
    };

    let currentInterval = 1000; // Start with 1 second

    const poll = async () => {
      try {
        if (DEBUG)
          console.log("Fetching pipeline status for:", currentPipelineId);
        const status = await apiClient.fetchPipelineStatus(currentPipelineId);
        if (DEBUG) console.log("Received status:", status);

        if (status) {
          // Update pipeline stages
          Object.entries(status.stages || {}).forEach(
            ([stageName, stageData]) => {
              if (DEBUG) console.log("Processing stage:", stageName, stageData);
              const uiStageId = stageMapping[stageName];
              if (uiStageId) {
                let uiStatus =
                  stageData.status === "processing"
                    ? "active"
                    : stageData.status;

                // Check configuration overrides
                if (uiStageId === "gpt4-enhancement" && !useGPT4Enhancement)
                  uiStatus = "skipped";
                if (uiStageId === "retexturing" && !enableRetexturing)
                  uiStatus = "skipped";
                if (uiStageId === "sprites" && !enableSprites)
                  uiStatus = "skipped";

                // Use updatePipelineStage to update individual stage
                updatePipelineStage(uiStageId, uiStatus);
              }
            },
          );

          // Handle completion
          if (status.status === "completed") {
            setIsGenerating(false);
            const results = status.results;
            const config = status.config;
            const baseAssetId =
              config.assetId || assetName.toLowerCase().replace(/\s+/g, "-");

            // Debug logging
            if (DEBUG) {
              console.log("Pipeline completed with results:", results);
              console.log("Rigging results:", results.rigging);
            }

            const finalAsset: GeneratedAsset = {
              id: baseAssetId,
              name: config.name || assetName,
              description:
                config.description || `${config.type || assetType} asset`,
              type: config.type || assetType,
              pipelineId: currentPipelineId,
              status: "completed",
              modelUrl:
                results.image3D?.localPath || results.rigging?.localPath
                  ? `/api/assets/${baseAssetId}/model`
                  : undefined,
              conceptArtUrl: `/api/assets/${baseAssetId}/concept-art.png`,
              variants: results.textureGeneration?.variants || [],
              hasSpriteMetadata:
                results.spriteGeneration?.status === "metadata_created" ||
                Boolean(config.enableSprites && results.image3D?.localPath),
              hasSprites: false,
              sprites: null,
              hasModel: !!(
                results.image3D?.localPath || results.rigging?.localPath
              ),
              modelFile:
                results.rigging?.localPath || results.image3D?.localPath,
              createdAt: new Date().toISOString(),
              generatedAt: new Date().toISOString(),
              metadata: {
                id: baseAssetId,
                gameId: baseAssetId,
                name: config.name,
                description: config.description,
                type: config.type as AssetType,
                subtype: config.subtype || "",
                isBaseModel: true,
                meshyTaskId: "", // Not available from pipeline results
                generationMethod: "gpt-image-meshy" as const,
                variants: [],
                variantCount: 0,
                modelPath:
                  results.rigging?.localPath ||
                  results.image3D?.localPath ||
                  "",
                hasModel: !!(
                  results.image3D?.localPath || results.rigging?.localPath
                ),
                hasConceptArt: true,
                workflow: "ai-generation",
                gddCompliant: true,
                isPlaceholder: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                generatedAt: new Date().toISOString(),
                // Extended properties
                isRigged: !!results.rigging && !!results.rigging?.localPath,
                animations: results.rigging?.localPath ? {} : undefined,
                riggedModelPath: results.rigging?.localPath,
                characterHeight:
                  generationType === "avatar" ? characterHeight : undefined,
              } as BaseAssetMetadata & GenerationAssetMetadata,
            };

            // Only add if not already exists
            const exists = generatedAssets.some(
              (asset) => asset.id === baseAssetId,
            );
            if (!exists) {
              setGeneratedAssets([...generatedAssets, finalAsset]);
            }
            setSelectedAsset(finalAsset);
            setActiveView("results");

            // Call onComplete callback if provided
            if (onComplete) {
              onComplete(finalAsset);
            }

            // Invalidate asset list cache for instant visibility with CDN URLs
            if (onAssetListInvalidate) {
              onAssetListInvalidate();
            }

            // Clear the interval
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return; // Exit polling
          } else if (status.status === "failed") {
            setIsGenerating(false);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return; // Exit polling
          }
        }

        // Calculate next interval based on elapsed time
        if (startTimeRef.current) {
          const elapsed = Date.now() - startTimeRef.current;
          const nextInterval = getPollingInterval(elapsed);

          // Adjust polling frequency if interval has changed
          if (nextInterval !== currentInterval) {
            if (DEBUG) {
              console.log(
                `Adjusting poll interval: ${currentInterval}ms → ${nextInterval}ms (elapsed: ${(elapsed / 1000).toFixed(1)}s)`,
              );
            }
            currentInterval = nextInterval;

            // Clear existing interval and schedule next poll
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            intervalRef.current = setInterval(poll, currentInterval);
          }
        }
      } catch (error) {
        if (DEBUG) console.error("Failed to get pipeline status:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to fetch pipeline status";
        setPollingError(errorMessage);
        // Continue polling even on error
      }
    };

    // Start initial polling
    intervalRef.current = setInterval(poll, currentInterval);
    poll(); // Execute immediately

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    currentPipelineId,
    apiClient,
    useGPT4Enhancement,
    enableRetexturing,
    enableSprites,
    assetName,
    assetType,
    generationType,
    characterHeight,
    generatedAssets,
    setIsGenerating,
    updatePipelineStage,
    setGeneratedAssets,
    setSelectedAsset,
    setActiveView,
    onComplete,
    onAssetListInvalidate,
  ]);

  return { intervalRef, pollingError };
}
