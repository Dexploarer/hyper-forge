/**
 * useAchievements Hook
 * Hook for managing user achievements and notifications
 */

import { useState, useEffect, useCallback } from "react";
import { achievementsClient, type Achievement, type UserAchievementSummary } from "@/services/api/AchievementsAPIClient";
import { AchievementNotification } from "@/components/achievements";

export function useAchievements(userId?: string) {
  const [summary, setSummary] = useState<UserAchievementSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<Achievement | null>(null);

  const loadAchievements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = userId
        ? await achievementsClient.getUserAchievementsById(userId)
        : await achievementsClient.getUserAchievements();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load achievements");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  const awardAchievement = useCallback(
    async (
      achievementCode: string,
      targetUserId?: string,
      progress?: number,
      metadata?: Record<string, any>,
    ) => {
      try {
        const result = await achievementsClient.awardAchievement(
          achievementCode,
          targetUserId,
          progress,
          metadata,
        );

        if (result.earned && result.userAchievement) {
          // Show notification
          setNotification(result.userAchievement.achievement);
          // Reload achievements
          await loadAchievements();
          return true;
        }

        return false;
      } catch (err) {
        console.error("Failed to award achievement:", err);
        return false;
      }
    },
    [loadAchievements],
  );

  const updateProgress = useCallback(
    async (
      achievementCode: string,
      progress: number,
      metadata?: Record<string, any>,
    ) => {
      try {
        const result = await achievementsClient.updateProgress(
          achievementCode,
          progress,
          metadata,
        );

        if (result.earned && result.userAchievement) {
          // Show notification
          setNotification(result.userAchievement.achievement);
          // Reload achievements
          await loadAchievements();
          return true;
        }

        // Update local state if progress changed
        if (summary) {
          const updatedAchievements = summary.achievements.map((a) => {
            if (a.achievement.code === achievementCode) {
              return {
                ...a,
                progress: Math.min(progress, a.maxProgress || progress),
              };
            }
            return a;
          });
          setSummary({ ...summary, achievements: updatedAchievements });
        }

        return result.earned;
      } catch (err) {
        console.error("Failed to update progress:", err);
        return false;
      }
    },
    [loadAchievements, summary],
  );

  const closeNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return {
    summary,
    loading,
    error,
    notification,
    awardAchievement,
    updateProgress,
    reloadAchievements: loadAchievements,
    closeNotification,
    NotificationComponent: notification ? (
      <AchievementNotification
        achievement={notification}
        onClose={closeNotification}
      />
    ) : null,
  };
}

