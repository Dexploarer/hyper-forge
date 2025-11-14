import React, { useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ArrowLeft, Upload, Download, CheckCircle } from "lucide-react";

import ThreeViewer, {
  type ThreeViewerRef,
} from "../components/shared/ThreeViewer";
import { VRMTestViewer } from "../components/VRMTestViewer";
import { convertGLBToVRM } from "../services/retargeting/VRMConverter";

/**
 * Free VRM Converter Page - Public Access
 *
 * Allows anyone to convert their GLB/GLTF files to VRM format without authentication.
 * This is a simplified version of RetargetAnimatePage focused solely on conversion.
 */
export const FreeVRMConverterPage: React.FC = () => {
  const viewerRef = useRef<ThreeViewerRef | null>(null);

  // Local state for conversion workflow
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [modelUrl, setModelUrl] = useState<string>("");
  const [vrmConverted, setVrmConverted] = useState(false);
  const [vrmUrl, setVrmUrl] = useState<string>("");
  const [conversionWarnings, setConversionWarnings] = useState<string[]>([]);
  const [loadingState, setLoadingState] = useState<string>("");
  const [showBones, setShowBones] = useState(false);
  const [showVRMTestViewer, setShowVRMTestViewer] = useState(false);

  // Handle file upload
  const handleFileUpload = (file: File) => {
    if (file) {
      const url = URL.createObjectURL(file);
      setModelFile(file);
      setModelUrl(url);
      setVrmConverted(false);
      setVrmUrl("");
      setConversionWarnings([]);
      console.log("[FreeVRMConverter] Loaded file:", file.name);
    }
  };

  // Convert GLB to VRM format
  const handleConvertToVRM = async () => {
    if (!modelUrl || !modelFile) {
      alert("Please upload a GLB/GLTF file first");
      return;
    }

    try {
      setLoadingState("Converting to VRM format...");
      console.log("[FreeVRMConverter] Starting VRM conversion...");

      // Load the GLB file
      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(modelUrl);

      // Validate GLB loaded correctly
      if (!gltf || !gltf.scene) {
        throw new Error("Failed to load GLB file - scene is empty");
      }

      console.log("[FreeVRMConverter] GLB loaded successfully");
      console.log(`  - Scene children: ${gltf.scene.children.length}`);

      // Convert to VRM
      const result = await convertGLBToVRM(gltf.scene, {
        avatarName: modelFile.name.replace(/\.(glb|gltf)$/i, ""),
        author: "Asset Forge User",
        version: "1.0",
        commercialUsage: "personalNonProfit",
      });

      console.log("[FreeVRMConverter] VRM conversion complete!");
      console.log(`  - Bones mapped: ${result.boneMappings.size}`);
      console.log(`  - Warnings: ${result.warnings.length}`);

      // Create blob URL for the VRM file
      const blob = new Blob([result.vrmData], {
        type: "application/octet-stream",
      });
      const url = URL.createObjectURL(blob);
      setConversionWarnings(result.warnings);
      setVrmUrl(url);
      setVrmConverted(true);

      // Auto-download the VRM file
      const a = document.createElement("a");
      a.href = url;
      a.download = modelFile.name.replace(/\.(glb|gltf)$/i, ".vrm");
      a.click();

      setLoadingState("VRM conversion complete! File downloaded.");
      setTimeout(() => setLoadingState(""), 3000);
    } catch (error) {
      setLoadingState("");
      console.error("[FreeVRMConverter] Error converting to VRM:", error);
      alert("Error converting to VRM: " + (error as Error).message);
    }
  };

  // Reset everything
  const handleReset = () => {
    if (modelUrl) URL.revokeObjectURL(modelUrl);
    if (vrmUrl) URL.revokeObjectURL(vrmUrl);
    setModelFile(null);
    setModelUrl("");
    setVrmConverted(false);
    setVrmUrl("");
    setConversionWarnings([]);
    setLoadingState("");
  };

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Header */}
      <header className="relative z-20 w-full px-6 py-4 flex items-center justify-between border-b border-border-primary">
        <div className="flex items-center gap-4">
          <a
            href="/"
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm">Back</span>
          </a>
          <div className="h-6 w-px bg-border-primary"></div>
          <div className="flex items-center gap-2">
            <img
              src="/Untitled%20design%20(3)/1.png"
              alt="Asset Forge Logo"
              className="w-8 h-8 object-contain"
            />
            <h1 className="text-lg font-semibold text-text-primary">
              Free VRM Converter
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-4 overflow-y-auto">
            <aside className="border border-border-primary bg-bg-secondary p-6 flex flex-col gap-6 rounded-xl">
              {/* Info Section */}
              <div>
                <h2 className="text-xl font-semibold mb-2 text-text-primary">
                  Convert GLB to VRM
                </h2>
                <p className="text-sm text-text-tertiary mb-4">
                  Upload your GLB/GLTF character model and convert it to VRM
                  format for free. VRM is the standard format for virtual
                  avatars.
                </p>
                {loadingState && (
                  <div className="px-3 py-2 bg-primary/10 border border-primary/30 rounded-md">
                    <p className="text-xs text-primary animate-pulse">
                      {loadingState}
                    </p>
                  </div>
                )}
              </div>

              {/* Upload Section */}
              <section className="space-y-4 p-4 border border-border-primary rounded-md">
                <h3 className="text-sm font-semibold text-text-primary">
                  1. Upload Your Model
                </h3>

                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="file"
                      accept=".glb,.gltf"
                      id="file-upload"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border-primary rounded-lg cursor-pointer hover:border-primary transition-colors bg-bg-tertiary/50"
                    >
                      <Upload className="w-8 h-8 text-text-tertiary mb-2" />
                      <span className="text-sm text-text-secondary">
                        Click to upload GLB/GLTF
                      </span>
                      <span className="text-xs text-text-tertiary mt-1">
                        Max 100MB
                      </span>
                    </label>
                  </div>

                  {modelFile && (
                    <div className="p-3 bg-bg-tertiary rounded-md">
                      <p className="text-sm text-text-primary font-medium">
                        {modelFile.name}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {(modelFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-md">
                  <p className="text-xs font-semibold text-blue-400 mb-1">
                    Requirements:
                  </p>
                  <ul className="text-xs text-blue-300 space-y-0.5">
                    <li>• Rigged character model (with skeleton)</li>
                    <li>• GLB or GLTF format</li>
                    <li>• Must have a SkinnedMesh</li>
                  </ul>
                </div>
              </section>

              {/* Convert Section */}
              {modelFile && !vrmConverted && (
                <section className="space-y-4 p-4 border border-border-primary rounded-md">
                  <h3 className="text-sm font-semibold text-text-primary">
                    2. Convert to VRM
                  </h3>

                  <button
                    className="w-full px-4 py-3 rounded-md bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    disabled={!modelUrl}
                    onClick={handleConvertToVRM}
                  >
                    🎭 Convert to VRM Format
                  </button>

                  <p className="text-xs text-text-tertiary">
                    This will convert your model to VRM 1.0 format with
                    standardized bone names, coordinate system, and T-pose
                    normalization.
                  </p>
                </section>
              )}

              {/* Success Section */}
              {vrmConverted && (
                <section className="space-y-4 p-4 border border-green-500/30 bg-green-500/5 rounded-md">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <h3 className="text-sm font-semibold text-green-400">
                      Conversion Complete!
                    </h3>
                  </div>

                  <p className="text-sm text-text-primary">
                    Your VRM file has been downloaded automatically. You can now
                    use it in VR applications, games, and virtual worlds.
                  </p>

                  {conversionWarnings.length > 0 && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-md">
                      <p className="text-xs font-semibold text-amber-400 mb-1">
                        Warnings:
                      </p>
                      {conversionWarnings.map((warning, idx) => (
                        <p key={idx} className="text-xs text-amber-300">
                          • {warning}
                        </p>
                      ))}
                    </div>
                  )}

                  <button
                    className="w-full px-4 py-2 rounded-md bg-primary/20 text-primary hover:bg-primary/30 flex items-center justify-center gap-2"
                    onClick={() => {
                      if (vrmUrl) {
                        const a = document.createElement("a");
                        a.href = vrmUrl;
                        a.download =
                          modelFile?.name.replace(/\.(glb|gltf)$/i, ".vrm") ||
                          "avatar.vrm";
                        a.click();
                      }
                    }}
                  >
                    <Download size={16} />
                    Download Again
                  </button>

                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-md">
                    <p className="text-xs font-semibold text-blue-400 mb-1">
                      ✨ VRM Benefits:
                    </p>
                    <ul className="text-xs text-blue-300 space-y-0.5">
                      <li>✓ Y-up coordinate system</li>
                      <li>✓ Standard HumanoidBone names</li>
                      <li>✓ T-pose normalized</li>
                      <li>✓ Ready for VR/game engines</li>
                    </ul>
                  </div>

                  <button
                    className="w-full px-4 py-3 rounded-md bg-primary text-white hover:bg-primary/90 font-medium"
                    onClick={() => setShowVRMTestViewer(true)}
                  >
                    🎭 Test VRM with Animations
                  </button>
                  <p className="text-xs text-text-tertiary">
                    Opens the VRM Test Viewer with Idle, Walk, Run, and Jump
                    animations to verify your conversion.
                  </p>
                </section>
              )}

              {/* Reset Button */}
              {modelFile && (
                <button
                  className="w-full px-4 py-2 rounded-md bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/70 text-sm"
                  onClick={handleReset}
                >
                  Convert Another File
                </button>
              )}

              {/* Info Footer */}
              <div className="pt-4 border-t border-border-primary">
                <p className="text-xs text-text-tertiary">
                  This tool converts Meshy GLB exports and other character
                  models to the VRM 1.0 standard format. Your files are
                  processed locally in your browser - nothing is uploaded to our
                  servers.
                </p>
              </div>
            </aside>
          </div>

          {/* Viewer */}
          <div className="lg:col-span-8 space-y-4">
            <section className="relative rounded-xl overflow-hidden h-[600px] lg:h-[calc(100vh-120px)]">
              {/* Viewer Controls */}
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                {vrmConverted && vrmUrl && (
                  <button
                    onClick={() => setShowVRMTestViewer(!showVRMTestViewer)}
                    className="px-3 py-2 rounded-md bg-bg-primary border border-border-primary text-text-primary hover:bg-bg-tertiary transition-colors text-sm"
                  >
                    {showVRMTestViewer ? "🎨 GLB Viewer" : "🎭 VRM Tester"}
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowBones(!showBones);
                    viewerRef.current?.toggleSkeleton();
                  }}
                  className="px-3 py-2 rounded-md bg-bg-primary border border-border-primary text-text-primary hover:bg-bg-tertiary transition-colors text-sm"
                >
                  {showBones ? "🦴 Hide Bones" : "🦴 Show Bones"}
                </button>
              </div>

              {/* 3D Viewers */}
              {showVRMTestViewer && vrmConverted && vrmUrl ? (
                <VRMTestViewer vrmUrl={vrmUrl} />
              ) : (
                <>
                  <ThreeViewer
                    ref={viewerRef}
                    modelUrl={modelUrl || undefined}
                    isAnimationPlayer={false}
                  />

                  {/* Empty State */}
                  {!modelUrl && (
                    <div className="absolute inset-0 flex items-center justify-center bg-bg-secondary/50 backdrop-blur-sm">
                      <div className="text-center">
                        <Upload className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                        <p className="text-lg text-text-primary font-medium">
                          No model loaded
                        </p>
                        <p className="text-sm text-text-tertiary mt-2">
                          Upload a GLB/GLTF file to get started
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreeVRMConverterPage;
