/**
 * Audio Library Card Component
 * Beautiful, immersive cards for audio files with playback functionality
 */

import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Download,
  Edit,
  Trash2,
  Volume2,
  Music,
  Mic,
  Zap,
  Calendar,
  Clock,
} from "lucide-react";
import { cn } from "@/styles";
import { ContentItem } from "@/hooks/useContent";
import { formatDate } from "@/utils";

interface AudioLibraryCardProps {
  item: ContentItem;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
}

// Audio type color schemes
const AUDIO_TYPE_COLORS = {
  music: {
    from: "from-purple-500/20",
    to: "to-violet-500/20",
    accent: "text-purple-400",
    border: "border-purple-500/30",
    icon: Music,
  },
  voice: {
    from: "from-blue-500/20",
    to: "to-cyan-500/20",
    accent: "text-blue-400",
    border: "border-blue-500/30",
    icon: Mic,
  },
  sound_effect: {
    from: "from-green-500/20",
    to: "to-emerald-500/20",
    accent: "text-green-400",
    border: "border-green-500/30",
    icon: Zap,
  },
  default: {
    from: "from-primary/20",
    to: "to-accent/20",
    accent: "text-primary",
    border: "border-primary/30",
    icon: Volume2,
  },
};

const getAudioTypeColors = (type: string) => {
  return (
    AUDIO_TYPE_COLORS[type as keyof typeof AUDIO_TYPE_COLORS] ||
    AUDIO_TYPE_COLORS.default
  );
};

export const AudioLibraryCard: React.FC<AudioLibraryCardProps> = ({
  item,
  onClick,
  onEdit,
  onDelete,
  className,
}) => {
  const audioFile = item.data;
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showActions, setShowActions] = useState(false);
  const [hasError, setHasError] = useState(false);

  const colors = getAudioTypeColors(audioFile.type);
  const Icon = colors.icon;

  // Use CDN URL if available, otherwise fall back to file URL
  const audioUrl = audioFile.cdnUrl || audioFile.fileUrl || null;

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    const updateTime = () => setCurrentTime(audioEl.currentTime);
    const updateDuration = () => setDuration(audioEl.duration);
    const handleEnded = () => setIsPlaying(false);
    const handleError = () => {
      setHasError(true);
      setIsPlaying(false);
    };

    audioEl.addEventListener("timeupdate", updateTime);
    audioEl.addEventListener("loadedmetadata", updateDuration);
    audioEl.addEventListener("ended", handleEnded);
    audioEl.addEventListener("error", handleError);

    return () => {
      audioEl.removeEventListener("timeupdate", updateTime);
      audioEl.removeEventListener("loadedmetadata", updateDuration);
      audioEl.removeEventListener("ended", handleEnded);
      audioEl.removeEventListener("error", handleError);
    };
  }, [audioUrl]);

  const togglePlayPause = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Audio playback error:", error);
      setHasError(true);
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = audioFile.cdnUrl || audioFile.fileUrl;
    if (!url) return;

    const link = document.createElement("a");
    link.href = url;
    link.download = audioFile.fileName || `audio_${audioFile.id}.mp3`;
    link.click();
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer",
        "hover:shadow-2xl hover:-translate-y-1",
        colors.border,
        "bg-gradient-to-br from-bg-secondary to-bg-tertiary",
        className,
      )}
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Header with Gradient */}
      <div
        className={cn(
          "h-16 bg-gradient-to-r relative overflow-hidden",
          colors.from,
          colors.to,
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/5 to-black/10" />
        {/* Decorative waveform pattern */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <div className="flex items-end gap-1 h-10">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-1 bg-white rounded-t transition-all",
                  colors.accent,
                )}
                style={{
                  height: `${Math.sin(i * 0.5) * 30 + 40}%`,
                  opacity:
                    isPlaying && i / 20 < currentTime / duration ? 1 : 0.3,
                }}
              />
            ))}
          </div>
        </div>
        {/* Type Badge */}
        <div className="absolute top-2 right-2 z-10">
          <span className="px-3 py-1 bg-black/40 backdrop-blur-sm rounded-full text-xs font-semibold text-white capitalize flex items-center gap-1">
            <Icon className="w-3 h-3" />
            {audioFile.type.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3 relative z-10">
        {/* Title */}
        <div className="flex items-start gap-2">
          <Volume2
            className={cn("w-5 h-5 flex-shrink-0 mt-0.5", colors.accent)}
          />
          <h3 className="text-lg font-bold text-text-primary group-hover:text-text-primary line-clamp-2 flex-1">
            {item.name}
          </h3>
        </div>

        {/* Audio Controls */}
        <div
          className="space-y-2 bg-bg-tertiary/50 rounded-lg p-3 border border-border-primary/50"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Play/Pause & Time */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlayPause}
              disabled={!audioUrl}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                "bg-primary/20 hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed",
                colors.accent,
              )}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>

            {/* Progress Bar */}
            <div className="flex-1 space-y-1">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                disabled={!audioUrl}
                className="w-full h-1.5 rounded-full bg-bg-primary appearance-none cursor-pointer disabled:cursor-not-allowed [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
              />
              <div className="flex justify-between text-xs text-text-tertiary">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={!audioUrl}
              className="p-2 rounded-lg hover:bg-bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download"
            >
              <Download className="w-4 h-4 text-text-tertiary" />
            </button>
          </div>
        </div>

        {/* Metadata */}
        {audioFile.metadata && Object.keys(audioFile.metadata).length > 0 && (
          <div className="pt-2 border-t border-border-primary/50">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {audioFile.metadata.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-text-tertiary" />
                  <span className="text-text-secondary">
                    {formatTime(audioFile.metadata.duration)}
                  </span>
                </div>
              )}
              {audioFile.metadata.voiceName && (
                <div className="text-text-secondary">
                  <span className="text-text-tertiary">Voice: </span>
                  {audioFile.metadata.voiceName}
                </div>
              )}
              {audioFile.metadata.prompt && (
                <div className="col-span-2 text-text-secondary italic line-clamp-2">
                  "{audioFile.metadata.prompt.substring(0, 100)}..."
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-text-tertiary group-hover:text-text-tertiary pt-2">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(item.createdAt)}
          </div>
          {!audioUrl && (
            <span className="text-amber-400 text-xs">
              File not migrated to CDN
            </span>
          )}
          {hasError && audioUrl && (
            <span className="text-red-400 text-xs">Failed to load audio</span>
          )}
        </div>
      </div>

      {/* Quick Actions Overlay */}
      {showActions && (
        <div
          className="absolute top-2 left-2 flex gap-1 animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-2 bg-black/60 backdrop-blur-sm hover:bg-primary/80 rounded-lg transition-colors group/btn"
            title="Edit"
          >
            <Edit className="w-3.5 h-3.5 text-white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 bg-black/60 backdrop-blur-sm hover:bg-red-500/80 rounded-lg transition-colors group/btn"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      )}

      {/* Hover Glow Effect */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
          "bg-gradient-to-t",
          colors.from.replace("/20", "/5"),
          "to-transparent",
        )}
      />

      {/* Hidden Audio Element */}
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="metadata" />}
    </div>
  );
};
