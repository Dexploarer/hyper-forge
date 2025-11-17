import { useRef, useCallback, useEffect, useState } from "react";
import { RotateCcw, X, Package, Sparkles, Loader2 } from "lucide-react";

import { useHandRiggingStore } from "../store";
import type { ProcessingStage } from "../store";

import {
  HandAvatarSelector,
  HandProcessingSteps,
  HandRiggingControls,
  ModelViewer,
  DebugImages,
  HelpSection,
  ExportModal,
  HandViewportControls,
  HandPanelToggles,
} from "@/components/hand-rigging";
import {
  CollapsibleSection,
  ErrorNotification,
  LoadingSpinner,
} from "@/components/common";
import { ThreeViewerRef } from "@/components/shared/ThreeViewer";
import { FittingProgress } from "@/components/armor-fitting";
import {
  HandRiggingService,
  HandRiggingResult,
} from "@/services/hand-rigging/HandRiggingService";
import {
  SimpleHandRiggingService,
  SimpleHandRiggingResult,
} from "@/services/hand-rigging/SimpleHandRiggingService";
import { apiFetch } from "@/utils/api";

export function HandRiggingPage() {
  const viewerRef = useRef<ThreeViewerRef>(null);
  const handRiggingService = useRef<HandRiggingService | null>(null);
  const simpleHandRiggingService = useRef<SimpleHandRiggingService | null>(
    null,
  );
  const [showAssetsPanel, setShowAssetsPanel] = useState(true);
  const [showControlsPanel, setShowControlsPanel] = useState(true);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showHelpPanel, setShowHelpPanel] = useState(false);

  // Get state and actions from store
  const {
    selectedAvatar,
    cdnUrl,
    processingStage,
    leftHandData,
    rightHandData,
    showSkeleton,
    modelInfo,
    riggingResult,
    debugImages,
    useSimpleMode,
    showExportModal,
    setCdnUrl,
    setProcessingStage,
    setLeftHandData,
    setRightHandData,
    setError,
    setModelInfo,
    setRiggingResult,
    setServiceInitialized,
    setDebugImages,
    setShowExportModal,
    reset: _reset,
    toggleSkeleton,
    getProcessingSteps: _getProcessingSteps,
    canExport,
  } = useHandRiggingStore();

  // Initialize services
  useEffect(() => {
    const initServices = async () => {
      try {
        console.log("Initializing hand rigging services...");

        if (useSimpleMode) {
          simpleHandRiggingService.current = new SimpleHandRiggingService();
        } else {
          const service = new HandRiggingService();
          await service.initialize();
          handRiggingService.current = service;
        }

        setServiceInitialized(true);
        console.log("Hand rigging services initialized");
      } catch (err) {
        console.error("Failed to initialize services:", err);
        setError(
          "Failed to initialize hand rigging service. Please refresh the page.",
        );
      }
    };

    initServices();

    return () => {
      if (handRiggingService.current) {
        handRiggingService.current.dispose();
      }
    };
  }, [useSimpleMode, setServiceInitialized, setError]);

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      if (cdnUrl && cdnUrl.startsWith("blob:")) {
        URL.revokeObjectURL(cdnUrl);
      }
    };
  }, [cdnUrl]);

  const handleStartProcessing = async () => {
    if (
      !selectedAvatar ||
      !cdnUrl ||
      (!handRiggingService.current && !simpleHandRiggingService.current)
    ) {
      setError("Please select an avatar first");
      return;
    }

    setError(null);
    setProcessingStage("idle");
    setLeftHandData(null);
    setRightHandData(null);
    setDebugImages({} as { [key: string]: string | undefined });

    // Artificial delay to show UI state
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      // Fetch the model data from the already set cdnUrl (which points to t-pose if available)
      const response = await apiFetch(cdnUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch avatar model");
      }

      const modelBlob = await response.blob();
      const modelFile = new File([modelBlob], `${selectedAvatar.name}.glb`, {
        type: "model/gltf-binary",
      });

      // Update stages
      const updateStage = (stage: ProcessingStage) => {
        setProcessingStage(stage);
        return new Promise((resolve) => setTimeout(resolve, 1000));
      };

      // Simulate stage progression based on service events
      // In a real implementation, the service would emit events
      updateStage("detecting-wrists");

      let result: HandRiggingResult | SimpleHandRiggingResult;

      if (useSimpleMode && simpleHandRiggingService.current) {
        // Run the simple rigging process
        result = await simpleHandRiggingService.current.rigHands(modelFile, {
          debugMode: true,
          palmBoneLength: 0.05, // 5cm palm (reduced from 8cm)
          fingerBoneLength: 0.08, // 8cm fingers (reduced from 10cm)
        });

        // Update UI for simple mode
        updateStage("creating-bones");
        await new Promise((resolve) => setTimeout(resolve, 1500));
        updateStage("applying-weights");
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } else if (handRiggingService.current) {
        // Run the complex AI-based rigging process
        result = await handRiggingService.current.rigHands(modelFile, {
          debugMode: true,
          minConfidence: 0.7,
          smoothingIterations: 3,
          captureResolution: 512,
          viewerRef: viewerRef, // Pass the viewer reference for better captures
        });

        if ("debugCaptures" in result && result.debugCaptures) {
          setDebugImages(
            result.debugCaptures as { [key: string]: string | undefined },
          );
        }

        // Update hand data for complex mode
        if ("leftHand" in result && result.leftHand) {
          setLeftHandData({
            fingerCount: result.leftHand.detectionConfidence > 0 ? 5 : 0,
            confidence: result.leftHand.detectionConfidence,
            bonesAdded: result.leftHand.bones
              ? Object.keys(result.leftHand.bones).length
              : 0,
          });
        }

        if ("rightHand" in result && result.rightHand) {
          setRightHandData({
            fingerCount: result.rightHand.detectionConfidence > 0 ? 5 : 0,
            confidence: result.rightHand.detectionConfidence,
            bonesAdded: result.rightHand.bones
              ? Object.keys(result.rightHand.bones).length
              : 0,
          });
        }
      } else {
        throw new Error("No service available");
      }

      setRiggingResult(result);

      // Update the model in the viewer with the rigged version
      if (result.riggedModel) {
        const blob = new Blob([result.riggedModel], {
          type: "model/gltf-binary",
        });
        const newUrl = URL.createObjectURL(blob);
        setCdnUrl(newUrl);

        // If skeleton was visible, turn it off and on to refresh with new bones
        if (showSkeleton && viewerRef.current) {
          console.log("Refreshing skeleton view to show new bones...");
          // Wait a bit for the model to load, then refresh skeleton
          setTimeout(() => {
            if (viewerRef.current && viewerRef.current.refreshSkeleton) {
              viewerRef.current.refreshSkeleton();
            }
          }, 500);
        }
      }

      updateStage("complete");
    } catch (err) {
      console.error("Hand rigging failed:", err);
      setError(err instanceof Error ? err.message : "Hand rigging failed");
      setProcessingStage("error");
    }
  };

  const handleModelLoad = useCallback(
    (info: { vertices: number; faces: number; materials: number }) => {
      setModelInfo(info);
    },
    [setModelInfo],
  );

  const handleToggleSkeleton = () => {
    if (viewerRef.current) {
      viewerRef.current.toggleSkeleton();
      toggleSkeleton();
    }
  };

  const handleExport = () => {
    if (!riggingResult || !riggingResult.riggedModel) return;

    // Create download link
    const blob = new Blob([riggingResult.riggedModel], {
      type: "model/gltf-binary",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    // Generate a proper filename
    let filename = "rigged_model.glb";
    if (selectedAvatar) {
      const baseName = selectedAvatar.name;
      // Remove any existing rigged suffix
      const nameWithoutRigged = baseName.replace(/[-_]?rigged$/i, "");
      // Add _rigged suffix and .glb extension
      filename = `${nameWithoutRigged}_rigged.glb`;
    }

    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const { error: storeError } = useHandRiggingStore();

  return (
    <>
      <div className="page-container">
        {/* Error Toast */}
        {storeError && (
          <ErrorNotification
            error={storeError}
            onClose={() => setError(null)}
          />
        )}

        {/* Center - Full 3D Viewport */}
        <div className="flex-1 flex flex-col">
          <div className="overflow-hidden flex-1 relative bg-gradient-to-br from-bg-primary to-bg-secondary rounded-xl flex items-center justify-center">
            {/* 3D Model Viewer - Full Screen */}
            <ModelViewer
              cdnUrl={cdnUrl}
              selectedAvatar={selectedAvatar}
              leftHandData={leftHandData}
              rightHandData={rightHandData}
              processingStage={processingStage}
              viewerRef={viewerRef}
              onModelLoad={handleModelLoad}
            />

            {/* Viewport Controls (top-right) */}
            {cdnUrl && (
              <HandViewportControls
                showSkeleton={showSkeleton}
                canExport={canExport()}
                onToggleSkeleton={handleToggleSkeleton}
                onResetCamera={() => viewerRef.current?.resetCamera?.()}
                onExport={() => setShowExportModal(true)}
              />
            )}

            {/* Bottom-center: Processing Buttons */}
            {selectedAvatar && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-3 z-10 max-w-[90%]">
                <button
                  onClick={handleStartProcessing}
                  disabled={
                    processingStage !== "idle" &&
                    processingStage !== "complete" &&
                    processingStage !== "error"
                  }
                  className="px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2.5 bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-lg"
                >
                  {processingStage === "idle" || processingStage === "error" ? (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Start Rigging</span>
                    </>
                  ) : processingStage === "complete" ? (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>Rig Again</span>
                    </>
                  ) : (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Processing...</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => useHandRiggingStore.getState().reset()}
                  disabled={
                    processingStage !== "idle" &&
                    processingStage !== "complete" &&
                    processingStage !== "error"
                  }
                  className="px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2.5 bg-bg-primary/80 border border-white/10 text-text-primary hover:bg-bg-secondary hover:border-white/20 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset</span>
                </button>
              </div>
            )}

            {/* Panel Toggle Buttons (bottom-right) */}
            <HandPanelToggles
              showAssetsPanel={showAssetsPanel}
              showControlsPanel={showControlsPanel}
              showDebugPanel={showDebugPanel}
              showHelpPanel={showHelpPanel}
              hasDebugImages={Object.keys(debugImages).length > 0}
              hasSelectedAvatar={!!selectedAvatar}
              onToggleAssets={() => setShowAssetsPanel(!showAssetsPanel)}
              onToggleControls={() => setShowControlsPanel(!showControlsPanel)}
              onToggleDebug={() => setShowDebugPanel(!showDebugPanel)}
              onToggleHelp={() => setShowHelpPanel(!showHelpPanel)}
            />

            {/* Processing Progress Overlay */}
            {processingStage !== "idle" &&
              processingStage !== "complete" &&
              processingStage !== "error" && (
                <FittingProgress
                  progress={
                    processingStage === "detecting-wrists"
                      ? 33
                      : processingStage === "creating-bones"
                        ? 66
                        : 90
                  }
                  message={
                    processingStage === "detecting-wrists"
                      ? "Detecting wrist positions..."
                      : processingStage === "creating-bones"
                        ? "Creating hand bones..."
                        : "Applying bone weights..."
                  }
                />
              )}
          </div>
        </div>
      </div>

      {/* Assets Side Panel (left) */}
      {showAssetsPanel && (
        <div className="absolute top-4 left-4 bg-bg-secondary bg-opacity-95 rounded-lg border border-border-primary p-3 z-20 min-w-[280px] max-w-[340px] max-h-[calc(100vh-2rem)] flex flex-col animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-text-primary text-sm font-semibold">
              Avatar Selection
            </h3>
            <button
              onClick={() => setShowAssetsPanel(false)}
              className="p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-bg-hover transition-colors"
              aria-label="Close Assets Panel"
            >
              <X size={16} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1">
            <HandAvatarSelector />
          </div>
        </div>
      )}

      {/* Controls Side Panel (right) */}
      {showControlsPanel && selectedAvatar && (
        <div className="absolute top-4 right-4 bg-bg-secondary bg-opacity-95 rounded-lg border border-border-primary p-3 z-20 min-w-[300px] max-w-[360px] max-h-[calc(100vh-2rem)] flex flex-col animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-text-primary text-sm font-semibold">
              Rigging Controls
            </h3>
            <button
              onClick={() => setShowControlsPanel(false)}
              className="p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-bg-hover transition-colors"
              aria-label="Close Controls Panel"
            >
              <X size={16} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1 space-y-4">
            <HandRiggingControls onStartProcessing={handleStartProcessing} />

            {/* Processing Pipeline */}
            <CollapsibleSection
              title="Processing Pipeline"
              defaultOpen={true}
              icon={Package}
            >
              <HandProcessingSteps />
            </CollapsibleSection>
          </div>
        </div>
      )}

      {/* Debug Images Panel (bottom) */}
      {showDebugPanel && Object.keys(debugImages).length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-bg-secondary bg-opacity-95 rounded-lg border border-border-primary p-3 z-20 max-w-[90%] max-h-[40vh] flex flex-col animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-text-primary text-sm font-semibold">
              Debug Images
            </h3>
            <button
              onClick={() => setShowDebugPanel(false)}
              className="p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-bg-hover transition-colors"
              aria-label="Close Debug Panel"
            >
              <X size={16} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1">
            <DebugImages debugImages={debugImages} showDebugImages={true} />
          </div>
        </div>
      )}

      {/* Help Panel (bottom) */}
      {showHelpPanel && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-bg-secondary bg-opacity-95 rounded-lg border border-border-primary p-3 z-20 max-w-[90%] max-h-[50vh] flex flex-col animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-text-primary text-sm font-semibold">
              Help & Documentation
            </h3>
            <button
              onClick={() => setShowHelpPanel(false)}
              className="p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-bg-hover transition-colors"
              aria-label="Close Help Panel"
            >
              <X size={16} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1">
            <HelpSection useSimpleMode={useSimpleMode} />
          </div>
        </div>
      )}

      {/* Export Modal */}
      <ExportModal
        showModal={showExportModal}
        selectedAvatar={selectedAvatar}
        riggingResult={riggingResult}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
      />
    </>
  );
}
