import React from "react";
import {
  Trophy,
  Medal,
  Award,
  Sparkles,
  Package,
  UserCheck,
  Star,
  Zap,
} from "lucide-react";
import { cn } from "@/styles";
import type { AchievementProgress } from "@/services/api/AchievementsAPIClient";

interface AchievementBadgeProps {
  achievement: AchievementProgress;
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
  className?: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  sparkles: Sparkles,
  trophy: Trophy,
  medal: Medal,
  award: Award,
  package: Package,
  "user-check": UserCheck,
  star: Star,
  zap: Zap,
};

const RARITY_COLORS = {
  common: "bg-gray-500/20 border-gray-500/30 text-gray-300",
  rare: "bg-blue-500/20 border-blue-500/30 text-blue-300",
  epic: "bg-purple-500/20 border-purple-500/30 text-purple-300",
  legendary: "bg-yellow-500/20 border-yellow-500/30 text-yellow-300",
};

const SIZE_CLASSES = {
  sm: "w-8 h-8 text-xs",
  md: "w-12 h-12 text-base",
  lg: "w-16 h-16 text-xl",
};

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  size = "md",
  showProgress = false,
  className,
}) => {
  const IconComponent =
    ICON_MAP[achievement.achievement.icon || "award"] || Award;
  const rarityColor = RARITY_COLORS[achievement.achievement.rarity] || RARITY_COLORS.common;
  const sizeClass = SIZE_CLASSES[size];
  const isEarned = achievement.isEarned;
  const progress = achievement.maxProgress
    ? Math.min(achievement.progress, achievement.maxProgress)
    : achievement.progress;
  const progressPercent = achievement.maxProgress
    ? (progress / achievement.maxProgress) * 100
    : achievement.isEarned
      ? 100
      : 0;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-1 group",
        className,
      )}
      title={achievement.achievement.name}
    >
      <div
        className={cn(
          "relative rounded-full border-2 flex items-center justify-center transition-all",
          sizeClass,
          isEarned
            ? `${rarityColor} shadow-lg shadow-primary/20`
            : "bg-bg-secondary border-border-primary text-text-tertiary opacity-50",
          "hover:scale-110 cursor-pointer",
        )}
      >
        <IconComponent className="w-1/2 h-1/2" />
        {isEarned && (
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
        )}
      </div>
      {showProgress && achievement.maxProgress && (
        <div className="w-full max-w-[60px]">
          <div className="h-1 bg-bg-secondary rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all",
                isEarned ? "bg-primary" : "bg-text-tertiary",
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-text-tertiary text-center mt-0.5">
            {progress}/{achievement.maxProgress}
          </p>
        </div>
      )}
      {size !== "sm" && (
        <p
          className={cn(
            "text-xs text-center max-w-[80px] truncate",
            isEarned ? "text-text-primary" : "text-text-tertiary",
          )}
        >
          {achievement.achievement.name}
        </p>
      )}
    </div>
  );
};

