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

export function usePipelineStatus({
  apiClient,
  onComplete,
  onAssetListInvalidate,
}: UsePipelineStatusOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [connected, setConnected] = useState(false);
  const [pollingError, setPollingError] = useState<string | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

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
        "[SSE] Pipeline status effect triggered. currentPipelineId:",
        currentPipelineId,
      );

    if (!currentPipelineId) {
      // Clean up if no pipeline
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setConnected(false);
      return;
    }

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

    const connectSSE = () => {
      // Clean up existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      const sseUrl = `/api/generation/${currentPipelineId}/status/stream`;
      if (DEBUG) console.log("[SSE] Connecting to:", sseUrl);

      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        if (DEBUG) console.log("[SSE] Connection opened");
        setConnected(true);
        setPollingError(null);
        reconnectAttemptsRef.current = 0; // Reset reconnect attempts on success
      };

      eventSource.addEventListener("pipeline-update", (event) => {
        try {
          const status = JSON.parse(event.data);
          if (DEBUG) console.log("[SSE] Received update:", status);

          if (status) {
            // Update pipeline stages
            Object.entries(status.stages || {}).forEach(
              ([stageName, stageData]: [string, any]) => {
                if (DEBUG)
                  console.log("[SSE] Processing stage:", stageName, stageData);
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
                console.log("[SSE] Pipeline completed with results:", results);
                console.log("[SSE] Rigging results:", results.rigging);
              }

              const finalAsset: GeneratedAsset = {
                id: baseAssetId,
                name: config.name || assetName,
                description:
                  config.description || `${config.type || assetType} asset`,
                type: config.type || assetType,
                pipelineId: currentPipelineId,
                status: "completed",
                modelUrl: results.image3D?.cdnUrl || results.rigging?.cdnUrl,
                conceptArtUrl: results.conceptArt?.cdnUrl,
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
                  meshyTaskId: "",
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

              // Close connection after completion
              eventSource.close();
              setConnected(false);
              if (DEBUG)
                console.log("[SSE] Connection closed after completion");
            } else if (status.status === "failed") {
              setIsGenerating(false);
              setPollingError(status.error || "Pipeline failed");
              eventSource.close();
              setConnected(false);
              if (DEBUG) console.log("[SSE] Connection closed after failure");
            }
          }
        } catch (error) {
          console.error("[SSE] Failed to parse event data:", error);
          setPollingError("Failed to parse server update");
        }
      });

      eventSource.addEventListener("error", (event) => {
        console.error("[SSE] Error event:", event);
      });

      eventSource.onerror = (error) => {
        console.error("[SSE] Connection error:", error);
        setConnected(false);
        eventSource.close();

        // Attempt reconnection with exponential backoff if not completed/failed
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            10000,
          );
          reconnectAttemptsRef.current++;

          if (DEBUG) {
            console.log(
              `[SSE] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`,
            );
          }

          setPollingError(
            `Connection lost. Reconnecting in ${delay / 1000}s...`,
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            if (currentPipelineId) {
              connectSSE();
            }
          }, delay);
        } else {
          setPollingError(
            "Connection failed after multiple attempts. Please refresh.",
          );
          if (DEBUG) console.log("[SSE] Max reconnection attempts reached");
        }
      };
    };

    // Initial connection
    connectSSE();

    // Cleanup function
    return () => {
      if (DEBUG) console.log("[SSE] Cleaning up connection");

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      setConnected(false);
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

  return { connected, pollingError };
}
