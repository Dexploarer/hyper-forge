import React, { useState, useRef } from "react";
import { Upload, FileJson, AlertCircle, CheckCircle, X } from "lucide-react";

import { Button, Card, CardHeader, CardContent } from "@/components/common";
import { worldConfigClient } from "@/services/api/WorldConfigAPIClient";
import { notify } from "@/utils/notify";

interface WorldConfigImportTabProps {
  onConfigImported: () => void;
}

export const WorldConfigImportTab: React.FC<WorldConfigImportTabProps> = ({
  onConfigImported,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith(".json")) {
      notify.error("Please select a JSON file");
      return;
    }

    setSelectedFile(file);

    // Load preview
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      setPreview(data);
    } catch (err) {
      notify.error("Invalid JSON file");
      setSelectedFile(null);
      setPreview(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !preview) return;

    try {
      setImporting(true);

      await worldConfigClient.uploadConfiguration(selectedFile);

      notify.success("Configuration imported successfully!");

      // Reset
      setSelectedFile(null);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      onConfigImported();
    } catch (err) {
      console.error("Failed to import configuration:", err);
      notify.error("Failed to import configuration");
    } finally {
      setImporting(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Upload Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                Import Configuration
              </h2>
              <p className="text-sm text-text-secondary">
                Upload a previously exported configuration JSON file
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* File Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
              dragActive
                ? "border-primary bg-primary/10"
                : "border-border-primary bg-bg-secondary/50 hover:border-primary/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            {!selectedFile ? (
              <div className="space-y-4">
                <FileJson className="w-16 h-16 text-text-tertiary mx-auto opacity-50" />
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    Drop your configuration file here
                  </h3>
                  <p className="text-sm text-text-secondary mb-4">
                    or click the button below to browse
                  </p>
                </div>
                <Button
                  variant="primary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Select JSON File
                </Button>
                <p className="text-xs text-text-tertiary">
                  Supports .json files exported from Asset Forge
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-1">
                    File Selected
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-text-tertiary mt-1">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <Button variant="secondary" onClick={handleClear} size="sm">
                  <X className="w-4 h-4 mr-2" />
                  Clear Selection
                </Button>
              </div>
            )}
          </div>

          {/* Preview */}
          {preview && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-text-primary">
                Configuration Preview
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
                  <div className="text-xs text-text-tertiary mb-1">Name</div>
                  <div className="text-sm font-medium text-text-primary">
                    {preview.name || "Unnamed"}
                  </div>
                </div>
                <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
                  <div className="text-xs text-text-tertiary mb-1">Genre</div>
                  <div className="text-sm font-medium text-text-primary">
                    {preview.genre || "Not specified"}
                  </div>
                </div>
                <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
                  <div className="text-xs text-text-tertiary mb-1">Races</div>
                  <div className="text-sm font-medium text-text-primary">
                    {preview.races?.length || 0}
                  </div>
                </div>
                <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
                  <div className="text-xs text-text-tertiary mb-1">
                    Factions
                  </div>
                  <div className="text-sm font-medium text-text-primary">
                    {preview.factions?.length || 0}
                  </div>
                </div>
              </div>
              {preview.description && (
                <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
                  <div className="text-xs text-text-tertiary mb-2">
                    Description
                  </div>
                  <p className="text-sm text-text-secondary line-clamp-3">
                    {preview.description}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Import Button */}
          {selectedFile && preview && (
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-primary">
              <Button variant="secondary" onClick={handleClear}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleImport}
                disabled={importing}
              >
                {importing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import Configuration
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm text-text-secondary">
              <p className="font-medium text-primary mb-1">Important Notes</p>
              <ul className="space-y-1 text-xs">
                <li>
                  • Only import configuration files that were exported from
                  Asset Forge
                </li>
                <li>
                  • The configuration will be imported as a new configuration,
                  not replacing any existing ones
                </li>
                <li>
                  • Review the preview before importing to ensure the data is
                  correct
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
