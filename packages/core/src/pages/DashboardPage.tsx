import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  Box,
  Scroll,
  Music,
  ArrowRight,
  Sparkles,
  Package,
} from "lucide-react";
import { Card } from "@/components/common";
import { useAuth } from "@/contexts/AuthContext";
import { useAssetsStore } from "@/store";
import { useNavigation } from "@/hooks/useNavigation";
import { NAVIGATION_VIEWS } from "@/constants";
import { cn } from "@/styles";
import { AssetService } from "@/services/api/AssetService";

export function DashboardPage() {
  const { user } = useAuth();
  const { recentlyViewed } = useAssetsStore();
  const { navigateTo } = useNavigation();

  // Stats state
  const [stats, setStats] = useState({
    totalAssets: 0,
    activeGenerations: 0,
    completedToday: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Load real stats from API
  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoadingStats(true);
        // Get all assets from API
        const assets = await AssetService.listAssets();
        const totalAssets = assets.length;

        // Calculate completed today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const completedToday = assets.filter((asset) => {
          const assetDate = new Date(asset.generatedAt);
          return assetDate >= today;
        }).length;

        setStats({
          totalAssets,
          activeGenerations: 0, // TODO: Track from generation store or API
          completedToday,
        });
      } catch (error) {
        console.error("Failed to load stats:", error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadStats();
  }, []);

  // Convert recently viewed to activity items
  const recentActivity = recentlyViewed.slice(0, 5).map((item) => ({
    id: item.id,
    type: "3d",
    title: `Viewed ${item.name}`,
    time: formatTimestamp(item.timestamp),
    icon: Box,
  }));

  // Format timestamp to relative time
  function formatTimestamp(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  // Quick actions
  const quickActions = [
    {
      id: "3d",
      title: "Generate 3D Asset",
      description: "Create characters, props, or environments",
      icon: Box,
      gradient: "from-blue-500 to-cyan-500",
      view: NAVIGATION_VIEWS.GENERATION_CHARACTER,
    },
    {
      id: "content",
      title: "Create Content",
      description: "Generate NPCs, quests, or dialogue",
      icon: Scroll,
      gradient: "from-purple-500 to-pink-500",
      view: NAVIGATION_VIEWS.CONTENT_NPC,
    },
    {
      id: "audio",
      title: "Produce Audio",
      description: "Generate music, SFX, or voice",
      icon: Music,
      gradient: "from-indigo-500 to-violet-500",
      view: NAVIGATION_VIEWS.AUDIO_MUSIC,
    },
  ];

  return (
    <div className="h-full overflow-y-auto bg-bg-primary relative">
      {/* Hex-style grid background - more visible */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.08]"
        style={{
          backgroundImage: `linear-gradient(to right, var(--color-primary) 1px, transparent 1px),
                           linear-gradient(to bottom, var(--color-primary) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header - Hex style */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <Sparkles className="w-10 h-10 text-primary" />
            <h1 className="font-display text-5xl md:text-6xl font-extrabold tracking-tight leading-tight gradient-text-primary">
              Welcome Back{user?.displayName ? `, ${user.displayName}` : ""}!
            </h1>
          </div>
          <p className="text-xl text-text-secondary font-normal">
            Let's create something amazing today
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300 group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                <TrendingUp className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-text-primary">
                  {isLoadingStats ? "..." : stats.totalAssets}
                </div>
                <div className="text-sm text-text-secondary">Total Assets</div>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300 group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-text-primary">
                  {isLoadingStats ? "..." : stats.activeGenerations}
                </div>
                <div className="text-sm text-text-secondary">Active Jobs</div>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300 group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-text-primary">
                  {isLoadingStats ? "..." : stats.completedToday}
                </div>
                <div className="text-sm text-text-secondary">
                  Completed Today
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions - Takes up 2 columns */}
          <div className="lg:col-span-2">
            <h2 className="font-display text-3xl font-bold tracking-tight text-text-primary mb-4 flex items-center gap-2">
              <span className="gradient-text-primary">Quick Actions</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => navigateTo(action.view)}
                    className="group relative p-6 rounded-xl border-2 border-border-primary hover:border-primary/50 bg-bg-secondary/50 hover:bg-bg-secondary transition-all duration-300 hover:scale-105 hover:shadow-xl text-left"
                  >
                    {/* Gradient background on hover */}
                    <div
                      className={cn(
                        "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300",
                        `bg-gradient-to-br ${action.gradient}`,
                      )}
                    />

                    <div className="relative">
                      <div
                        className={cn(
                          "w-12 h-12 mb-4 rounded-lg flex items-center justify-center bg-gradient-to-br shadow-md group-hover:shadow-lg transition-shadow",
                          action.gradient,
                        )}
                      >
                        <Icon className="w-6 h-6 icon-on-gradient" />
                      </div>

                      <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-primary transition-colors">
                        {action.title}
                      </h3>

                      <p className="text-sm text-text-secondary leading-relaxed mb-3">
                        {action.description}
                      </p>

                      <div className="flex items-center gap-2 text-sm text-primary font-medium">
                        <span>Get Started</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent Activity - Takes up 1 column */}
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-text-primary mb-4 flex items-center gap-2">
              <span className="gradient-text-primary">Recent Activity</span>
            </h2>

            <Card className="p-4">
              <div className="space-y-3">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => {
                    const Icon = activity.icon;
                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-bg-hover transition-colors"
                      >
                        <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-text-primary truncate">
                            {activity.title}
                          </div>
                          <div className="text-xs text-text-tertiary">
                            {activity.time}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-text-secondary">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent activity yet</p>
                    <p className="text-xs">
                      Start creating to see your activity here
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Recent Assets */}
        {recentlyViewed.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-3xl font-bold tracking-tight text-text-primary flex items-center gap-2">
                <span className="gradient-text-primary">Recent Assets</span>
              </h2>
              <button
                onClick={() => navigateTo(NAVIGATION_VIEWS.ASSETS)}
                className="text-sm text-primary hover:text-accent transition-colors flex items-center gap-1"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recentlyViewed.slice(0, 6).map((item) => {
                if (!item) return null;

                return (
                  <button
                    key={item.id}
                    onClick={() => navigateTo(NAVIGATION_VIEWS.ASSETS)}
                    className="group relative aspect-square rounded-lg overflow-hidden border-2 border-border-primary hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-lg bg-bg-secondary"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="w-8 h-8 text-text-tertiary" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 transform translate-y-full group-hover:translate-y-0 transition-transform">
                      <p className="text-xs font-medium text-text-primary truncate">
                        {item.name}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
