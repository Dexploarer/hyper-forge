import React, { useEffect, useState } from "react";
import { Trophy, X } from "lucide-react";
import { cn } from "@/styles";
import type { Achievement } from "@/services/api/AchievementsAPIClient";

interface AchievementNotificationProps {
  achievement: Achievement;
  onClose: () => void;
  autoCloseDelay?: number;
}

export const AchievementNotification: React.FC<
  AchievementNotificationProps
> = ({ achievement, onClose, autoCloseDelay = 5000 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto-close
    if (autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoCloseDelay, onClose]);

  const rarityColors = {
    common: "bg-gray-500/20 border-gray-500/30",
    rare: "bg-blue-500/20 border-blue-500/30",
    epic: "bg-purple-500/20 border-purple-500/30",
    legendary: "bg-yellow-500/20 border-yellow-500/30",
  };

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 max-w-sm transition-all duration-300",
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
      )}
    >
      <div
        className={cn(
          "bg-bg-primary border-2 rounded-lg shadow-2xl p-4 flex items-start gap-3",
          rarityColors[achievement.rarity] || rarityColors.common,
        )}
      >
        <div className="flex-shrink-0 w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
          <Trophy className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="text-sm font-bold text-text-primary">
                Achievement Unlocked!
              </h3>
              <p className="text-sm font-semibold text-text-primary mt-1">
                {achievement.name}
              </p>
              <p className="text-xs text-text-secondary mt-1">
                {achievement.description}
              </p>
              {achievement.points > 0 && (
                <p className="text-xs text-primary mt-2 font-medium">
                  +{achievement.points} points
                </p>
              )}
            </div>
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
              className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4 text-text-tertiary" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

