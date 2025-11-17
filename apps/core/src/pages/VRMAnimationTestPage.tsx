import React, { useState } from "react";
import { SimpleVRMViewer } from "../components/SimpleVRMViewer";

/**
 * VRM Animation Test Page
 *
 * Test VRM files with animations
 */
export const VRMAnimationTestPage: React.FC = () => {
  const [vrmUrl, setVrmUrl] = useState<string>("");

  const handleFileUpload = (file: File) => {
    console.log(
      "[VRMAnimationTestPage] handleFileUpload called with:",
      file.name,
    );
    if (vrmUrl) {
      URL.revokeObjectURL(vrmUrl);
    }
    const url = URL.createObjectURL(file);
    console.log("[VRMAnimationTestPage] Setting vrmUrl to:", url);
    setVrmUrl(url);
    console.log("[VRMAnimationTestPage] setVrmUrl called");
  };

  console.log("[VRMAnimationTestPage] RENDER - vrmUrl:", vrmUrl);
  console.log("[VRMAnimationTestPage] RENDER - Will show viewer?", !!vrmUrl);

  return (
    <div className="absolute inset-0" style={{ background: "#1a1a1a" }}>
      {vrmUrl ? (
        <div
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            inset: 0,
          }}
        >
          <SimpleVRMViewer vrmUrl={vrmUrl} onFileUpload={handleFileUpload} />
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-secondary">
          <div className="text-center">
            <input
              type="file"
              accept=".vrm"
              id="vrm-file-upload-dashboard"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
            <label
              htmlFor="vrm-file-upload-dashboard"
              className="flex flex-col items-center justify-center cursor-pointer"
            >
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 hover:bg-primary/20 transition-colors">
                <svg
                  className="w-12 h-12 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <p className="text-2xl font-semibold text-text-primary mb-2">
                Upload VRM File
              </p>
              <p className="text-sm text-text-tertiary">
                Click to select a VRM file to test with animations
              </p>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default VRMAnimationTestPage;
