/**
 * CDN Upload Zone
 * Drag & drop file upload component for CDN
 */

import React, { useState, useCallback } from "react";
import { Upload, CheckCircle, XCircle } from "lucide-react";
import { useCDNFileOperations } from "@/hooks/useCDNFileOperations";
import { Progress, LoadingSpinner } from "@/components/common";
import type { CDNDirectoryType } from "@/types/cdn";

interface CDNUploadZoneProps {
  onUploadSuccess?: () => void;
}

export const CDNUploadZone: React.FC<CDNUploadZoneProps> = ({
  onUploadSuccess,
}) => {
  const operations = useCDNFileOperations();
  const [directory, setDirectory] = useState<CDNDirectoryType>("models");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      handleUpload(files);
    },
    [directory],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
        handleUpload(Array.from(files));
      }
      // Reset input value to allow uploading the same file again
      e.target.value = "";
    },
    [directory],
  );

  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return;

    try {
      setUploadStatus("idle");
      const result = await operations.upload.mutateAsync({ files, directory });
      setUploadStatus("success");
      setStatusMessage(
        `Successfully uploaded ${result.files.length} file(s) to ${directory}`,
      );
      onUploadSuccess?.();

      // Clear success message after 5 seconds
      setTimeout(() => {
        setUploadStatus("idle");
        setStatusMessage("");
      }, 5000);
    } catch (error) {
      setUploadStatus("error");
      setStatusMessage(
        error instanceof Error ? error.message : "Upload failed",
      );

      // Clear error message after 5 seconds
      setTimeout(() => {
        setUploadStatus("idle");
        setStatusMessage("");
      }, 5000);
    }
  };

  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold mb-4 text-text-primary">Upload Files</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-text-secondary">
          Select Directory
        </label>
        <select
          value={directory}
          onChange={(e) => setDirectory(e.target.value as CDNDirectoryType)}
          className="w-full max-w-xs px-4 py-2 rounded-lg bg-bg-tertiary border border-border-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="models">models</option>
          <option value="manifests">manifests</option>
          <option value="emotes">emotes</option>
          <option value="music">music</option>
          <option value="world">world</option>
          <option value="web">web</option>
        </select>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
          isDragging
            ? "border-primary bg-primary/10"
            : "border-border-primary hover:border-primary hover:bg-bg-tertiary"
        }`}
        onClick={() => document.getElementById("fileInput")?.click()}
      >
        <Upload className="mx-auto h-12 w-12 mb-4 text-text-tertiary" />
        <p className="text-lg mb-2 text-text-primary">
          Drag and drop files here
        </p>
        <p className="text-sm text-text-tertiary">or click to browse</p>
        <input
          type="file"
          id="fileInput"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Upload Status */}
      {operations.upload.isPending && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <LoadingSpinner size="sm" />
            <span className="text-sm text-text-secondary">Uploading...</span>
          </div>
          <Progress value={100} animated />
        </div>
      )}

      {uploadStatus === "success" && statusMessage && (
        <div className="mt-4 p-4 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-sm text-green-400">{statusMessage}</span>
        </div>
      )}

      {uploadStatus === "error" && statusMessage && (
        <div className="mt-4 p-4 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-400" />
          <span className="text-sm text-red-400">{statusMessage}</span>
        </div>
      )}
    </div>
  );
};
