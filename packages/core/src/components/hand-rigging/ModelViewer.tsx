import { Hand, Package } from "lucide-react";
import React from "react";

import { cn } from "../../styles";
import type { Asset } from "../../types";
import { Badge } from "../common";
import ThreeViewer, { ThreeViewerRef } from "../shared/ThreeViewer";

interface ModelViewerProps {
  cdnUrl: string | null;
  selectedAvatar: Asset | null;
  leftHandData: { bonesAdded: number } | null;
  rightHandData: { bonesAdded: number } | null;
  processingStage: string;
  viewerRef: React.RefObject<ThreeViewerRef | null>;
  onModelLoad: (info: {
    vertices: number;
    faces: number;
    materials: number;
  }) => void;
}

export const ModelViewer: React.FC<ModelViewerProps> = ({
  cdnUrl,
  selectedAvatar,
  leftHandData,
  rightHandData,
  processingStage,
  viewerRef,
  onModelLoad,
}) => {
  return (
    <div className="w-full h-full relative">
      {cdnUrl ? (
        <div className="w-full h-full bg-gradient-to-br from-bg-primary to-bg-secondary">
          <ThreeViewer
            ref={viewerRef}
            cdnUrl={cdnUrl}
            showGroundPlane={true}
            onModelLoad={onModelLoad}
            assetInfo={{
              name: selectedAvatar?.name || "Model",
              type: "character",
              format: "GLB",
            }}
          />
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-bg-primary to-bg-secondary">
          <div className="text-center p-8 animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 bg-primary opacity-20 blur-3xl animate-pulse" />
              <Package
                size={80}
                className="text-text-muted mb-6 mx-auto relative z-10 animate-float"
              />
            </div>
            <h3 className="text-2xl font-semibold text-text-primary mb-2">
              No model loaded
            </h3>
            <p className="text-text-tertiary text-lg max-w-md mx-auto">
              Select an avatar to begin
            </p>
          </div>
        </div>
      )}

      {/* Overlay Results */}
      {processingStage === "complete" && (leftHandData || rightHandData) && (
        <div className="absolute top-4 left-4 space-y-2 z-10">
          {leftHandData && leftHandData.bonesAdded > 0 && (
            <Badge
              variant="success"
              className={cn("shadow-lg", "animate-slide-in-left", "text-white")}
            >
              <Hand className="w-3.5 h-3.5 mr-2" />
              Left Hand: {leftHandData.bonesAdded} bones added
            </Badge>
          )}
          {rightHandData && rightHandData.bonesAdded > 0 && (
            <Badge
              variant="success"
              className={cn("shadow-lg", "animate-slide-in-left", "text-white")}
              style={{ animationDelay: "0.1s" }}
            >
              <Hand className="w-3.5 h-3.5 mr-2" />
              Right Hand: {rightHandData.bonesAdded} bones added
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
