import React, { useState, useEffect } from "react";
import {
  User,
  Trophy,
  Package,
  FolderOpen,
  Loader2,
  Calendar,
} from "lucide-react";
import { useNavigation } from "@/hooks/useNavigation";
import {
  publicProfileClient,
  type PublicProfile,
  type UserStats,
} from "@/services/api/PublicProfileAPIClient";
import { AchievementDisplay } from "@/components/achievements";
import { PageSkeleton } from "@/components/common";

type TabType = "assets" | "projects" | "achievements";

export const PublicProfilePage: React.FC = () => {
  const { selectedProfileUserId } = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>("assets");
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedProfileUserId) {
      setError("No user selected");
      setLoading(false);
      return;
    }

    loadProfileData();
  }, [selectedProfileUserId]);

  useEffect(() => {
    if (!selectedProfileUserId) return;

    // Load tab-specific data
    if (activeTab === "assets") {
      loadAssets();
    } else if (activeTab === "projects") {
      loadProjects();
    }
  }, [activeTab, selectedProfileUserId]);

  const loadProfileData = async () => {
    if (!selectedProfileUserId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await publicProfileClient.getPublicProfile(
        selectedProfileUserId,
      );
      setProfile(response.profile);
      setStats(response.stats);

      // Load initial tab data
      if (activeTab === "assets") {
        await loadAssets();
      } else if (activeTab === "projects") {
        await loadProjects();
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const loadAssets = async () => {
    if (!selectedProfileUserId) return;

    try {
      const response = await publicProfileClient.getPublicAssets(
        selectedProfileUserId,
      );
      setAssets(response.assets);
    } catch (err) {
      console.error("Failed to load assets:", err);
    }
  };

  const loadProjects = async () => {
    if (!selectedProfileUserId) return;

    try {
      const response = await publicProfileClient.getPublicProjects(
        selectedProfileUserId,
      );
      setProjects(response.projects);
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <User className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text-primary mb-2">
            Profile Not Found
          </h2>
          <p className="text-text-secondary">
            {error || "User profile could not be loaded"}
          </p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="h-full flex flex-col bg-bg-primary">
      {/* Profile Header */}
      <div className="bg-bg-secondary border-b border-border-primary p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName || "User"}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-primary" />
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-text-primary">
                  {profile.displayName || "Anonymous User"}
                </h1>
                {profile.isOwnProfile && (
                  <span className="px-3 py-1 bg-primary/20 text-primary text-sm font-medium rounded-full">
                    Your Profile
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-text-secondary mb-4">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  Joined {formatDate(profile.createdAt)}
                </span>
              </div>

              {/* Stats */}
              {stats && (
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-text-tertiary" />
                    <div>
                      <div className="text-2xl font-bold text-text-primary">
                        {profile.isOwnProfile
                          ? stats.totalAssets
                          : stats.publicAssets}
                      </div>
                      <div className="text-xs text-text-secondary">Assets</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-text-tertiary" />
                    <div>
                      <div className="text-2xl font-bold text-text-primary">
                        {profile.isOwnProfile
                          ? stats.totalProjects
                          : stats.publicProjects}
                      </div>
                      <div className="text-xs text-text-secondary">
                        Projects
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-text-tertiary" />
                    <div>
                      <div className="text-2xl font-bold text-text-primary">
                        {stats.totalAchievements}
                      </div>
                      <div className="text-xs text-text-secondary">
                        Achievements
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border-primary bg-bg-secondary">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("assets")}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                activeTab === "assets"
                  ? "border-primary text-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                <span>Assets</span>
                <span className="text-xs opacity-60">
                  (
                  {profile.isOwnProfile
                    ? stats?.totalAssets
                    : stats?.publicAssets}
                  )
                </span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("projects")}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                activeTab === "projects"
                  ? "border-primary text-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                <span>Projects</span>
                <span className="text-xs opacity-60">
                  (
                  {profile.isOwnProfile
                    ? stats?.totalProjects
                    : stats?.publicProjects}
                  )
                </span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("achievements")}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                activeTab === "achievements"
                  ? "border-primary text-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                <span>Achievements</span>
                <span className="text-xs opacity-60">
                  ({stats?.totalAchievements})
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6">
          {activeTab === "assets" && (
            <div>
              {assets.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    No Assets
                  </h3>
                  <p className="text-text-secondary">
                    {profile.isOwnProfile
                      ? "You haven't created any assets yet"
                      : "This user has no public assets"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="bg-bg-secondary border border-border-primary rounded-lg p-4 hover:border-primary/50 transition-colors"
                    >
                      <div className="aspect-square bg-bg-tertiary rounded-md mb-3 flex items-center justify-center">
                        {asset.thumbnailPath ? (
                          <img
                            src={`/api/assets/${asset.id}/${asset.thumbnailPath}`}
                            alt={asset.name}
                            className="w-full h-full object-cover rounded-md"
                          />
                        ) : (
                          <Package className="w-12 h-12 text-text-tertiary" />
                        )}
                      </div>
                      <h4 className="font-semibold text-text-primary mb-1 truncate">
                        {asset.name}
                      </h4>
                      <p className="text-sm text-text-secondary truncate">
                        {asset.type || "Unknown Type"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "projects" && (
            <div>
              {projects.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    No Projects
                  </h3>
                  <p className="text-text-secondary">
                    {profile.isOwnProfile
                      ? "You haven't created any projects yet"
                      : "This user has no public projects"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="bg-bg-secondary border border-border-primary rounded-lg p-4 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FolderOpen className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-text-primary mb-1 truncate">
                            {project.name}
                          </h4>
                          {project.description && (
                            <p className="text-sm text-text-secondary line-clamp-2">
                              {project.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-text-tertiary">
                        <span>Created {formatDate(project.createdAt)}</span>
                        <span className="px-2 py-1 bg-bg-tertiary rounded">
                          {project.status || "active"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "achievements" && (
            <div>
              <AchievementDisplay
                userId={selectedProfileUserId || undefined}
                showFilters={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicProfilePage;
