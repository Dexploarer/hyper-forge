import { Globe, Loader2, AlertCircle } from "lucide-react";
import React, { useState, useEffect } from "react";

import {
  worldConfigClient,
  type WorldConfigurationData,
} from "@/services/api/WorldConfigAPIClient";

interface WorldConfigSelectorProps {
  value?: string | null;
  onChange: (configId: string | null) => void;
  disabled?: boolean;
  className?: string;
}

export const WorldConfigSelector: React.FC<WorldConfigSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  className = "",
}) => {
  const [configurations, setConfigurations] = useState<
    WorldConfigurationData[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await worldConfigClient.listConfigurations({
        includeTemplates: false,
      });
      setConfigurations(result.configurations);

      // If no value is set, default to the active configuration
      if (!value) {
        const activeConfig = result.configurations.find((c) => c.isActive);
        if (activeConfig) {
          onChange(activeConfig.id);
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to load world configurations";
      setError(errorMessage);
      console.error("WorldConfigSelector error:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectedConfig = configurations.find((c) => c.id === value);
  const activeConfig = configurations.find((c) => c.isActive);

  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="text-sm font-medium text-text-primary flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          World Configuration
        </label>
        <div className="w-full px-4 py-2.5 bg-bg-tertiary border border-border-primary/50 rounded-lg flex items-center gap-2 text-text-secondary">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading configurations...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="text-sm font-medium text-text-primary flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          World Configuration
        </label>
        <div className="w-full px-4 py-2.5 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (configurations.length === 0) {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="text-sm font-medium text-text-primary flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          World Configuration
        </label>
        <div className="w-full px-4 py-2.5 bg-bg-tertiary border border-border-primary/50 rounded-lg text-text-tertiary text-sm">
          No world configurations available
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium text-text-primary flex items-center gap-2">
        <Globe className="w-4 h-4 text-primary" />
        World Configuration
        {selectedConfig?.isActive && (
          <span className="text-xs text-green-400 font-normal">(Active)</span>
        )}
      </label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={disabled}
        className="w-full px-4 py-2.5 bg-bg-tertiary border border-border-primary/50 rounded-lg text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed [&>option]:bg-bg-tertiary [&>option]:text-text-primary"
      >
        <option value="">Use Active Configuration</option>
        {configurations.map((config) => (
          <option key={config.id} value={config.id}>
            {config.name}
            {config.isActive ? " (Active)" : ""}
            {config.genre ? ` - ${config.genre}` : ""}
          </option>
        ))}
      </select>

      {/* Show description of selected config */}
      {selectedConfig && (
        <div className="text-xs text-text-tertiary bg-bg-tertiary/30 border border-border-primary/30 rounded-lg p-3 space-y-1">
          <p className="font-medium text-text-secondary">
            {selectedConfig.name}
          </p>
          {selectedConfig.description && (
            <p className="line-clamp-2">{selectedConfig.description}</p>
          )}
          {selectedConfig.genre && (
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-md font-medium">
                {selectedConfig.genre}
              </span>
              {selectedConfig.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-bg-tertiary text-text-tertiary text-xs rounded-md"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fallback to active config info if no selection */}
      {!selectedConfig && activeConfig && (
        <div className="text-xs text-text-tertiary bg-bg-tertiary/30 border border-border-primary/30 rounded-lg p-3 space-y-1">
          <p className="font-medium text-text-secondary flex items-center gap-2">
            {activeConfig.name}
            <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded font-normal">
              Active
            </span>
          </p>
          {activeConfig.description && (
            <p className="line-clamp-2">{activeConfig.description}</p>
          )}
        </div>
      )}
    </div>
  );
};
