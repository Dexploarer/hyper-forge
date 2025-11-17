import React, { useState, useEffect } from "react";
import { Trophy, Medal, Award, Filter, X } from "lucide-react";
import { AchievementBadge } from "./AchievementBadge";
import { achievementsClient, type AchievementProgress } from "@/services/api/AchievementsAPIClient";
import { Button } from "@/components/common";
import { cn } from "@/styles";

interface AchievementDisplayProps {
  userId?: string;
  showFilters?: boolean;
  className?: string;
}

type FilterType = "all" | "achievement" | "medal" | "badge";
type CategoryFilter = string | "all";

export const AchievementDisplay: React.FC<AchievementDisplayProps> = ({
  userId,
  showFilters = true,
  className,
}) => {
  const [achievements, setAchievements] = useState<AchievementProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [summary, setSummary] = useState<{
    totalAchievements: number;
    totalMedals: number;
    totalPoints: number;
  } | null>(null);

  useEffect(() => {
    loadAchievements();
  }, [userId]);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = userId
        ? await achievementsClient.getUserAchievementsById(userId)
        : await achievementsClient.getUserAchievements();
      setAchievements(data.achievements);
      setSummary({
        totalAchievements: data.totalAchievements,
        totalMedals: data.totalMedals,
        totalPoints: data.totalPoints,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load achievements");
    } finally {
      setLoading(false);
    }
  };

  // Get unique categories
  const categories = Array.from(
    new Set(
      achievements
        .map((a) => a.achievement.category)
        .filter((c): c is string => c !== null),
    ),
  );

  // Filter achievements
  const filteredAchievements = achievements.filter((achievement) => {
    if (typeFilter !== "all" && achievement.achievement.type !== typeFilter) {
      return false;
    }
    if (
      categoryFilter !== "all" &&
      achievement.achievement.category !== categoryFilter
    ) {
      return false;
    }
    return true;
  });

  // Group by earned/unearned
  const earnedAchievements = filteredAchievements.filter((a) => a.isEarned);
  const unearnedAchievements = filteredAchievements.filter((a) => !a.isEarned);

  if (loading) {
    return (
      <div className={cn("p-6 text-center", className)}>
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="text-text-secondary mt-4">Loading achievements...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("p-6 text-center", className)}>
        <p className="text-red-400">{error}</p>
        <Button
          onClick={loadAchievements}
          className="mt-4"
          variant="primary"
          size="sm"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-3 gap-4 p-4 bg-bg-secondary rounded-lg border border-border-primary">
          <div className="text-center">
            <div className="text-2xl font-bold text-text-primary">
              {summary.totalAchievements}
            </div>
            <div className="text-xs text-text-secondary">Achievements</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-text-primary">
              {summary.totalMedals}
            </div>
            <div className="text-xs text-text-secondary">Medals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-text-primary">
              {summary.totalPoints}
            </div>
            <div className="text-xs text-text-secondary">Points</div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="space-y-3">
          {/* Type Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-text-secondary" />
            <span className="text-sm font-medium text-text-primary">Type:</span>
            {(["all", "achievement", "medal", "badge"] as FilterType[]).map(
              (type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={cn(
                    "px-3 py-1 rounded-md text-sm transition-colors",
                    typeFilter === type
                      ? "bg-primary text-white"
                      : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary",
                  )}
                >
                  {type === "all"
                    ? "All"
                    : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ),
            )}
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-text-primary">
                Category:
              </span>
              <button
                onClick={() => setCategoryFilter("all")}
                className={cn(
                  "px-3 py-1 rounded-md text-sm transition-colors",
                  categoryFilter === "all"
                    ? "bg-primary text-white"
                    : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary",
                )}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  className={cn(
                    "px-3 py-1 rounded-md text-sm transition-colors capitalize",
                    categoryFilter === category
                      ? "bg-primary text-white"
                      : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary",
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Earned Achievements */}
      {earnedAchievements.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Earned ({earnedAchievements.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {earnedAchievements.map((achievement) => (
              <AchievementBadge
                key={achievement.achievementId}
                achievement={achievement}
                size="md"
                showProgress={!!achievement.maxProgress}
              />
            ))}
          </div>
        </div>
      )}

      {/* Unearned Achievements */}
      {unearnedAchievements.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Award className="w-5 h-5 text-text-tertiary" />
            Available ({unearnedAchievements.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {unearnedAchievements
              .filter((a) => !a.achievement.isHidden)
              .map((achievement) => (
                <AchievementBadge
                  key={achievement.achievementId}
                  achievement={achievement}
                  size="md"
                  showProgress={!!achievement.maxProgress}
                />
              ))}
          </div>
        </div>
      )}

      {filteredAchievements.length === 0 && (
        <div className="text-center py-12 text-text-secondary">
          <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No achievements found</p>
        </div>
      )}
    </div>
  );
};

