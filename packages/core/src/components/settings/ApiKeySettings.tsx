/**
 * API Key Settings Component
 * Allows users to configure their own API keys for AI services
 */

import React, { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Key, Eye, EyeOff, Save, Trash2, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";

interface ApiKeyStatus {
  meshyApiKey: boolean;
  aiGatewayApiKey: boolean;
  elevenLabsApiKey: boolean;
}

export const ApiKeySettings: React.FC = () => {
  const { getAccessToken } = usePrivy();

  const [meshyApiKey, setMeshyApiKey] = useState("");
  const [aiGatewayApiKey, setAiGatewayApiKey] = useState("");
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState("");

  const [showMeshyKey, setShowMeshyKey] = useState(false);
  const [showAiGatewayKey, setShowAiGatewayKey] = useState(false);
  const [showElevenLabsKey, setShowElevenLabsKey] = useState(false);

  const [keyStatus, setKeyStatus] = useState<ApiKeyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch API key status on mount
  useEffect(() => {
    fetchKeyStatus();
  }, []);

  const fetchKeyStatus = async () => {
    try {
      setLoading(true);
      const accessToken = await getAccessToken();

      if (!accessToken) {
        setError("Please log in to manage API keys");
        return;
      }

      const response = await fetch("/api/users/api-keys/status", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch API key status");
      }

      const data = await response.json();
      setKeyStatus(data.keysConfigured);
    } catch (err) {
      console.error("Failed to fetch API key status:", err);
      setError(err instanceof Error ? err.message : "Failed to load API key status");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const accessToken = await getAccessToken();
      if (!accessToken) {
        setError("Please log in to save API keys");
        return;
      }

      // Only send keys that have values
      const keysToSave: any = {};
      if (meshyApiKey.trim()) keysToSave.meshyApiKey = meshyApiKey.trim();
      if (aiGatewayApiKey.trim()) keysToSave.aiGatewayApiKey = aiGatewayApiKey.trim();
      if (elevenLabsApiKey.trim()) keysToSave.elevenLabsApiKey = elevenLabsApiKey.trim();

      if (Object.keys(keysToSave).length === 0) {
        setError("Please enter at least one API key");
        return;
      }

      const response = await fetch("/api/users/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(keysToSave),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save API keys");
      }

      const data = await response.json();
      setSuccess("API keys saved successfully!");

      // Clear input fields
      setMeshyApiKey("");
      setAiGatewayApiKey("");
      setElevenLabsApiKey("");

      // Refresh status
      await fetchKeyStatus();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Failed to save API keys:", err);
      setError(err instanceof Error ? err.message : "Failed to save API keys");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete all your API keys? You will need to re-enter them to use AI generation features.")) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      setSuccess(null);

      const accessToken = await getAccessToken();
      if (!accessToken) {
        setError("Please log in to delete API keys");
        return;
      }

      const response = await fetch("/api/users/api-keys", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete API keys");
      }

      setSuccess("API keys deleted successfully");
      await fetchKeyStatus();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Failed to delete API keys:", err);
      setError(err instanceof Error ? err.message : "Failed to delete API keys");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
          <Key className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-text-primary">API Key Settings</h2>
          <p className="text-sm text-text-secondary mt-1">
            Configure your own API keys for AI generation services
          </p>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-start gap-2">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-400">{success}</p>
        </div>
      )}

      {/* Info Box */}
      <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-300">
          <p className="font-medium mb-1">Why provide your own API keys?</p>
          <p>
            By providing your own API keys, you maintain direct control over your AI service usage and billing.
            Your keys are encrypted and stored securely.
          </p>
        </div>
      </div>

      {/* API Key Inputs */}
      <div className="space-y-6">
        {/* Meshy API Key */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-text-primary">
              Meshy API Key
              {keyStatus?.meshyApiKey && (
                <span className="ml-2 text-xs text-green-400">(Configured)</span>
              )}
            </label>
            <a
              href="https://www.meshy.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:text-primary-hover"
            >
              Get API Key →
            </a>
          </div>
          <div className="relative">
            <input
              type={showMeshyKey ? "text" : "password"}
              value={meshyApiKey}
              onChange={(e) => setMeshyApiKey(e.target.value)}
              placeholder="Enter Meshy API key (required for 3D generation)"
              className="w-full px-4 py-2 pr-10 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => setShowMeshyKey(!showMeshyKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
            >
              {showMeshyKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="mt-1 text-xs text-text-tertiary">
            Used for 3D model generation and retexturing
          </p>
        </div>

        {/* AI Gateway / OpenAI Key */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-text-primary">
              Vercel AI Gateway API Key
              {keyStatus?.aiGatewayApiKey && (
                <span className="ml-2 text-xs text-green-400">(Configured)</span>
              )}
            </label>
            <a
              href="https://vercel.com/docs/workflow-collaboration/vercel-ai-gateway"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:text-primary-hover"
            >
              Learn More →
            </a>
          </div>
          <div className="relative">
            <input
              type={showAiGatewayKey ? "text" : "password"}
              value={aiGatewayApiKey}
              onChange={(e) => setAiGatewayApiKey(e.target.value)}
              placeholder="Enter Vercel AI Gateway key (recommended for AI content)"
              className="w-full px-4 py-2 pr-10 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => setShowAiGatewayKey(!showAiGatewayKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
            >
              {showAiGatewayKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="mt-1 text-xs text-text-tertiary">
            Used for AI content generation (NPCs, quests, dialogue, lore)
          </p>
        </div>

        {/* ElevenLabs API Key */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-text-primary">
              ElevenLabs API Key (Optional)
              {keyStatus?.elevenLabsApiKey && (
                <span className="ml-2 text-xs text-green-400">(Configured)</span>
              )}
            </label>
            <a
              href="https://elevenlabs.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:text-primary-hover"
            >
              Get API Key →
            </a>
          </div>
          <div className="relative">
            <input
              type={showElevenLabsKey ? "text" : "password"}
              value={elevenLabsApiKey}
              onChange={(e) => setElevenLabsApiKey(e.target.value)}
              placeholder="Enter ElevenLabs API key (optional for voice/music)"
              className="w-full px-4 py-2 pr-10 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => setShowElevenLabsKey(!showElevenLabsKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
            >
              {showElevenLabsKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="mt-1 text-xs text-text-tertiary">
            Used for voice generation, music, and sound effects
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6 pt-6 border-t border-border-primary">
        <button
          onClick={handleSave}
          disabled={saving || (!meshyApiKey && !aiGatewayApiKey && !elevenLabsApiKey)}
          className="flex-1 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save API Keys
            </>
          )}
        </button>

        {keyStatus && (keyStatus.meshyApiKey || keyStatus.aiGatewayApiKey || keyStatus.elevenLabsApiKey) && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete All Keys
              </>
            )}
          </button>
        )}
      </div>

      {/* Security Note */}
      <div className="mt-4 p-3 bg-bg-tertiary rounded-lg">
        <p className="text-xs text-text-tertiary">
          <strong>Security:</strong> Your API keys are encrypted using AES-256-GCM before storage and are never exposed in plain text.
        </p>
      </div>
    </div>
  );
};
