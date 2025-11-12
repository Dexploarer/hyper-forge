import {
  Activity,
  CheckCircle,
  XCircle,
  Zap,
  Users,
  Mic,
  Clock,
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import React, { useState, useEffect } from "react";

import type { VoiceServiceStatus as VoiceServiceStatusData } from "@/services/api/VoiceStatusAPIClient";
import { voiceStatusClient } from "@/services/api/VoiceStatusAPIClient";
import { cn } from "@/styles";

interface VoiceServiceStatusProps {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  className?: string;
}

export const VoiceServiceStatus: React.FC<VoiceServiceStatusProps> = ({
  autoRefresh = false,
  refreshInterval = 30000, // 30 seconds default
  className,
}) => {
  const [status, setStatus] = useState<VoiceServiceStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await voiceStatusClient.getServiceStatus();
      setStatus(data);
      setLastUpdate(new Date());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch voice service status",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    if (autoRefresh) {
      const interval = setInterval(fetchStatus, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  if (isLoading && !status) {
    return (
      <div
        className={cn(
          "bg-bg-secondary border border-border-primary rounded-xl p-6",
          className,
        )}
      >
        <div className="flex items-center justify-center gap-3 text-text-secondary">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading voice service status...</span>
        </div>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div
        className={cn(
          "bg-bg-secondary border border-border-primary rounded-xl p-6",
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-base font-semibold text-red-400">
              Failed to Load Status
            </h3>
            <p className="text-sm text-text-secondary mt-1">
              {error || "Unknown error occurred"}
            </p>
            <button
              onClick={fetchStatus}
              className="mt-3 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors text-sm font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { isAvailable, subscription, rateLimit, voiceCount, modelCount } =
    status;

  // Calculate usage percentage and status
  const usagePercentage = subscription
    ? voiceStatusClient.getCharacterUsagePercentage(subscription)
    : 0;
  const daysUntilReset = subscription
    ? voiceStatusClient.getDaysUntilReset(subscription)
    : 0;

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return "text-red-400";
    if (percentage >= 75) return "text-yellow-400";
    return "text-green-400";
  };

  const getUsageBgColor = (percentage: number): string => {
    if (percentage >= 90) return "bg-red-500/20";
    if (percentage >= 75) return "bg-yellow-500/20";
    return "bg-green-500/20";
  };

  return (
    <div
      className={cn(
        "bg-bg-secondary border border-border-primary rounded-xl overflow-hidden",
        className,
      )}
    >
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border-primary">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                isAvailable ? "bg-green-500/20" : "bg-red-500/20",
              )}
            >
              {isAvailable ? (
                <Activity className="w-5 h-5 text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">
                Voice Generation Service
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    isAvailable ? "bg-green-400 animate-pulse" : "bg-red-400",
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-medium",
                    isAvailable ? "text-green-400" : "text-red-400",
                  )}
                >
                  {isAvailable ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={fetchStatus}
            disabled={isLoading}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh status"
          >
            <RefreshCw
              className={cn(
                "w-4 h-4 text-text-secondary",
                isLoading && "animate-spin",
              )}
            />
          </button>
        </div>
      </div>

      {!isAvailable ? (
        <div className="p-6">
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">
              {status.error ||
                "Voice generation service is currently unavailable"}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Subscription Info */}
          {subscription && (
            <div className="p-6 border-b border-border-primary">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
                  Subscription
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-text-tertiary mb-1">Plan Tier</p>
                  <p className="text-base font-semibold text-text-primary">
                    {subscription.tier}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <p className="text-base font-semibold text-green-400">
                      {subscription.status}
                    </p>
                  </div>
                </div>
              </div>

              {/* Character Usage */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-text-tertiary">Character Usage</p>
                  <p
                    className={cn(
                      "text-sm font-bold",
                      getUsageColor(usagePercentage),
                    )}
                  >
                    {usagePercentage}%
                  </p>
                </div>
                <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      getUsageBgColor(usagePercentage),
                    )}
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-text-secondary">
                    {voiceStatusClient.formatCharacterCount(
                      subscription?.character_count,
                    )}{" "}
                    /{" "}
                    {voiceStatusClient.formatCharacterCount(
                      subscription?.character_limit,
                    )}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-text-tertiary">
                    <Clock className="w-3 h-3" />
                    <span>Resets in {daysUntilReset}d</span>
                  </div>
                </div>
              </div>

              {/* Voice Limits */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="p-3 bg-bg-tertiary rounded-lg">
                  <p className="text-xs text-text-tertiary mb-1">Voice Limit</p>
                  <p className="text-lg font-bold text-text-primary">
                    {subscription.voice_limit}
                  </p>
                </div>
                <div className="p-3 bg-bg-tertiary rounded-lg">
                  <p className="text-xs text-text-tertiary mb-1">Pro Voices</p>
                  <p className="text-lg font-bold text-text-primary">
                    {subscription.professional_voice_limit}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Rate Limit & Library Stats */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Rate Limit */}
            {rateLimit && (
              <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide">
                    Rate Limit
                  </p>
                </div>
                <p className="text-2xl font-bold text-text-primary">
                  {rateLimit.requestsRemaining}
                </p>
                <p className="text-xs text-text-tertiary mt-1">
                  of {rateLimit.requestsLimit} requests
                </p>
                {rateLimit.isLimited && (
                  <div className="mt-2 text-xs text-yellow-400">
                    Rate limited
                  </div>
                )}
              </div>
            )}

            {/* Voice Count */}
            <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Mic className="w-4 h-4 text-purple-400" />
                <p className="text-xs font-semibold text-purple-400 uppercase tracking-wide">
                  Available Voices
                </p>
              </div>
              <p className="text-2xl font-bold text-text-primary">
                {voiceCount}
              </p>
              <p className="text-xs text-text-tertiary mt-1">in your library</p>
            </div>

            {/* Model Count */}
            <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-green-400" />
                <p className="text-xs font-semibold text-green-400 uppercase tracking-wide">
                  TTS Models
                </p>
              </div>
              <p className="text-2xl font-bold text-text-primary">
                {modelCount}
              </p>
              <p className="text-xs text-text-tertiary mt-1">
                available models
              </p>
            </div>
          </div>

          {/* Last Updated */}
          {lastUpdate && (
            <div className="px-6 pb-4">
              <p className="text-xs text-text-tertiary text-center">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
