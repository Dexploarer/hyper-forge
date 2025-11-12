import {
  Settings as SettingsIcon,
  User,
  Palette,
  Sparkles,
  FileText,
  Save,
  RefreshCw,
  Copy,
  CheckCircle,
  Loader2,
  Bell,
  Monitor,
  Moon,
  Sun,
  Zap,
  Package,
  Target,
} from "lucide-react";
import React, { useState, useEffect } from "react";

import {
  promptsClient,
  type PromptData,
} from "@/services/api/PromptsAPIClient";
import { usersClient, type User } from "@/services/api/UsersAPIClient";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/common/ThemeSwitcher";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CollapsibleSection,
  Drawer,
} from "@/components/common";
import { cn } from "@/styles";
import { notify } from "@/utils/notify";

type SettingsTab = "profile" | "preferences" | "generation" | "prompts";

type PromptCategory =
  | "gameStyles"
  | "assetTypes"
  | "materials"
  | "generation"
  | "gpt4Enhancement"
  | "weaponDetection";

interface CategoryInfo {
  id: PromptCategory;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const CATEGORIES: CategoryInfo[] = [
  {
    id: "gameStyles",
    name: "Game Styles",
    icon: <Palette className="w-5 h-5" />,
    description: "Art style and aesthetic prompts for different game genres",
  },
  {
    id: "assetTypes",
    name: "Asset Types",
    icon: <Package className="w-5 h-5" />,
    description: "Prompts for generating different types of 3D assets",
  },
  {
    id: "materials",
    name: "Materials",
    icon: <FileText className="w-5 h-5" />,
    description: "Material and texture prompt templates",
  },
  {
    id: "generation",
    name: "Generation",
    icon: <Sparkles className="w-5 h-5" />,
    description: "Core generation pipeline prompts",
  },
  {
    id: "gpt4Enhancement",
    name: "GPT-4 Enhancement",
    icon: <Zap className="w-5 h-5" />,
    description: "Prompt enhancement and refinement templates",
  },
  {
    id: "weaponDetection",
    name: "Weapon Detection",
    icon: <Target className="w-5 h-5" />,
    description: "AI vision prompts for weapon handle detection",
  },
];

interface UserSettings {
  theme?: "light" | "dark" | "system";
  notifications?: {
    emailOnCompletion?: boolean;
    emailOnError?: boolean;
  };
  generation?: {
    defaultQuality?: "quality" | "speed" | "balanced";
    autoDownload?: boolean;
    defaultGameStyle?: string;
  };
  ui?: {
    showTooltips?: boolean;
    compactMode?: boolean;
  };
}

export const SettingsPage: React.FC = () => {
  const { user, completeProfile } = useAuth();
  const { theme, setTheme } = useTheme();

  // Tab state
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [showCategoryDrawer, setShowCategoryDrawer] = useState(false);

  // Profile state
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [discordUsername, setDiscordUsername] = useState("");

  // Settings state
  const [settings, setSettings] = useState<UserSettings>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Prompts state
  const [activeCategory, setActiveCategory] =
    useState<PromptCategory>("gameStyles");
  const [prompts, setPrompts] = useState<
    Record<PromptCategory, PromptData | null>
  >({
    gameStyles: null,
    assetTypes: null,
    materials: null,
    generation: null,
    gpt4Enhancement: null,
    weaponDetection: null,
  });
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true);
  const [promptsError, setPromptsError] = useState<string | null>(null);
  const [copiedCategory, setCopiedCategory] = useState<PromptCategory | null>(
    null,
  );

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setEmail(user.email || "");
      setDiscordUsername(user.discordUsername || "");

      // Load settings from user.settings
      if (user.settings) {
        const userSettings = user.settings as UserSettings;
        setSettings(userSettings);

        // Sync theme from settings if available
        if (userSettings.theme) {
          setTheme(userSettings.theme);
          localStorage.setItem("asset-forge-theme", userSettings.theme);
        }
      }
    }
  }, [user, setTheme]);

  // Load prompts on mount
  useEffect(() => {
    loadAllPrompts();
  }, []);

  const loadAllPrompts = async () => {
    try {
      setIsLoadingPrompts(true);
      setPromptsError(null);
      const allPrompts = await promptsClient.getAllPrompts();
      setPrompts(allPrompts);
    } catch (err) {
      setPromptsError(
        err instanceof Error ? err.message : "Failed to load prompts",
      );
    } finally {
      setIsLoadingPrompts(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      if (!displayName.trim() || !email.trim()) {
        setSaveError("Display name and email are required");
        setIsSaving(false);
        return;
      }

      await completeProfile({
        displayName: displayName.trim(),
        email: email.trim(),
        discordUsername: discordUsername.trim() || undefined,
      });

      notify.success("Profile updated successfully");
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save profile",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await usersClient.updateSettings(settings);
      notify.success("Settings saved successfully");

      // Update local state with new user data
      if (response.user) {
        // Settings are already updated in state, just sync theme if changed
        if (settings.theme) {
          localStorage.setItem("asset-forge-theme", settings.theme);
        }
      }
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save settings",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyJSON = async (category: PromptCategory) => {
    const data = prompts[category];
    if (!data) return;

    try {
      const formatted = promptsClient.formatJSON(data);
      await navigator.clipboard.writeText(formatted);
      setCopiedCategory(category);
      setTimeout(() => setCopiedCategory(null), 2000);
      notify.success("JSON copied to clipboard");
    } catch (err) {
      console.error("Failed to copy:", err);
      notify.error("Failed to copy JSON");
    }
  };

  const updateSetting = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateNestedSetting = <K extends keyof UserSettings>(
    key: K,
    nestedKey: string,
    value: any,
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: {
        ...((prev[key] as any) || {}),
        [nestedKey]: value,
      },
    }));
  };

  const tabs = [
    { id: "profile" as SettingsTab, label: "Profile", icon: User },
    { id: "preferences" as SettingsTab, label: "Preferences", icon: Palette },
    { id: "generation" as SettingsTab, label: "Generation", icon: Sparkles },
    { id: "prompts" as SettingsTab, label: "System Prompts", icon: FileText },
  ];

  const activeCategoryData = prompts[activeCategory];
  const promptCount = activeCategoryData
    ? promptsClient.countPrompts(activeCategoryData)
    : 0;

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-text-secondary">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-full overflow-y-auto p-4">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Header */}
          <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-primary/10 to-accent/10 border border-border-primary rounded-xl">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <SettingsIcon className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
              <p className="text-sm text-text-secondary">
                Manage your profile, preferences, and system configuration
              </p>
            </div>
          </div>

          {/* Error Message */}
          {saveError && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{saveError}</p>
            </div>
          )}

          {/* Tabs - Desktop */}
          <div className="hidden lg:flex gap-2 border-b border-border-primary">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 border-b-2 transition-colors",
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-text-secondary hover:text-text-primary",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile Tab Selector */}
          <div className="lg:hidden">
            <button
              onClick={() => setShowMobileDrawer(true)}
              className="w-full p-4 bg-bg-secondary border border-border-primary rounded-lg flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                {React.createElement(
                  tabs.find((t) => t.id === activeTab)?.icon || SettingsIcon,
                  {
                    className: "w-5 h-5 text-primary",
                  },
                )}
                <span className="font-medium text-text-primary">
                  {tabs.find((t) => t.id === activeTab)?.label}
                </span>
              </div>
              <span className="text-text-tertiary">▼</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information and profile details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-primary">
                      Display Name <span className="text-red-400">*</span>
                    </label>
                    <Input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your display name"
                    />
                    <p className="text-xs text-text-tertiary">
                      This name appears on your assets and projects
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-primary">
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                    />
                    <p className="text-xs text-text-tertiary">
                      Used for notifications about your asset generation
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-primary">
                      Discord Username (Optional)
                    </label>
                    <Input
                      type="text"
                      value={discordUsername}
                      onChange={(e) => setDiscordUsername(e.target.value)}
                      placeholder="username#1234"
                    />
                    <p className="text-xs text-text-tertiary">
                      Your Discord username for community features
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={
                        isSaving || !displayName.trim() || !email.trim()
                      }
                      className="flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Profile
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Preferences Tab */}
            {activeTab === "preferences" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>
                      Customize the look and feel of the application
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-text-primary">
                          Theme
                        </label>
                        <p className="text-xs text-text-tertiary mt-1">
                          Choose your preferred color theme
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const newTheme = "light";
                            setTheme(newTheme);
                            updateSetting("theme", newTheme);
                            localStorage.setItem("asset-forge-theme", newTheme);
                          }}
                          className={cn(
                            "p-2 rounded-lg border transition-colors",
                            theme === "light"
                              ? "bg-primary/20 border-primary text-primary"
                              : "bg-bg-secondary border-border-primary text-text-secondary hover:text-text-primary",
                          )}
                          title="Light theme"
                        >
                          <Sun className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            const newTheme = "dark";
                            setTheme(newTheme);
                            updateSetting("theme", newTheme);
                            localStorage.setItem("asset-forge-theme", newTheme);
                          }}
                          className={cn(
                            "p-2 rounded-lg border transition-colors",
                            theme === "dark"
                              ? "bg-primary/20 border-primary text-primary"
                              : "bg-bg-secondary border-border-primary text-text-secondary hover:text-text-primary",
                          )}
                          title="Dark theme"
                        >
                          <Moon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            const newTheme = "system";
                            setTheme(newTheme);
                            updateSetting("theme", newTheme);
                            localStorage.setItem("asset-forge-theme", newTheme);
                          }}
                          className={cn(
                            "p-2 rounded-lg border transition-colors",
                            theme === "system"
                              ? "bg-primary/20 border-primary text-primary"
                              : "bg-bg-secondary border-border-primary text-text-secondary hover:text-text-primary",
                          )}
                          title="System theme"
                        >
                          <Monitor className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>
                      Configure how you receive notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-text-primary">
                          Email on Completion
                        </label>
                        <p className="text-xs text-text-tertiary mt-1">
                          Receive email when asset generation completes
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            settings.notifications?.emailOnCompletion ?? false
                          }
                          onChange={(e) =>
                            updateNestedSetting(
                              "notifications",
                              "emailOnCompletion",
                              e.target.checked,
                            )
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-bg-tertiary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border-primary after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-text-primary">
                          Email on Error
                        </label>
                        <p className="text-xs text-text-tertiary mt-1">
                          Receive email when generation fails
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            settings.notifications?.emailOnError ?? false
                          }
                          onChange={(e) =>
                            updateNestedSetting(
                              "notifications",
                              "emailOnError",
                              e.target.checked,
                            )
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-bg-tertiary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border-primary after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>User Interface</CardTitle>
                    <CardDescription>
                      Customize UI behavior and display options
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-text-primary">
                          Show Tooltips
                        </label>
                        <p className="text-xs text-text-tertiary mt-1">
                          Display helpful tooltips throughout the interface
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.ui?.showTooltips ?? true}
                          onChange={(e) =>
                            updateNestedSetting(
                              "ui",
                              "showTooltips",
                              e.target.checked,
                            )
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-bg-tertiary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border-primary after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-text-primary">
                          Compact Mode
                        </label>
                        <p className="text-xs text-text-tertiary mt-1">
                          Use a more compact layout with less spacing
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.ui?.compactMode ?? false}
                          onChange={(e) =>
                            updateNestedSetting(
                              "ui",
                              "compactMode",
                              e.target.checked,
                            )
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-bg-tertiary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border-primary after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Privacy & Public Profile</CardTitle>
                    <CardDescription>
                      Control what others can see on your public profile
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg mb-4">
                      <p className="text-sm text-text-primary">
                        Your public profile is accessible at{" "}
                        <span className="font-mono text-primary">
                          /profile/{user?.id}
                        </span>
                      </p>
                      <p className="text-xs text-text-secondary mt-1">
                        Control what content is visible on your public profile
                        below. By default, all assets and projects are private.
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-text-primary">
                          Default Asset Visibility
                        </label>
                        <p className="text-xs text-text-tertiary mt-1">
                          Make new assets public by default (can be changed per
                          asset)
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            settings.privacy?.defaultAssetPublic ?? false
                          }
                          onChange={(e) =>
                            updateNestedSetting(
                              "privacy",
                              "defaultAssetPublic",
                              e.target.checked,
                            )
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-bg-tertiary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border-primary after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-text-primary">
                          Default Project Visibility
                        </label>
                        <p className="text-xs text-text-tertiary mt-1">
                          Make new projects public by default (can be changed
                          per project)
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            settings.privacy?.defaultProjectPublic ?? false
                          }
                          onChange={(e) =>
                            updateNestedSetting(
                              "privacy",
                              "defaultProjectPublic",
                              e.target.checked,
                            )
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-bg-tertiary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border-primary after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    <div className="border-t border-border-primary pt-4 mt-4">
                      <p className="text-xs text-text-tertiary">
                        💡 <strong>Tip:</strong> Individual asset and project
                        visibility can be managed from their respective pages.
                        These settings only control the default for new content.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Preferences
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Generation Tab */}
            {activeTab === "generation" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Generation Preferences</CardTitle>
                    <CardDescription>
                      Set default options for asset generation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-primary">
                        Default Quality
                      </label>
                      <select
                        value={
                          settings.generation?.defaultQuality || "balanced"
                        }
                        onChange={(e) =>
                          updateNestedSetting(
                            "generation",
                            "defaultQuality",
                            e.target.value as "quality" | "speed" | "balanced",
                          )
                        }
                        className="w-full px-4 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="quality">
                          Quality (slower, higher quality)
                        </option>
                        <option value="balanced">Balanced (recommended)</option>
                        <option value="speed">
                          Speed (faster, lower quality)
                        </option>
                      </select>
                      <p className="text-xs text-text-tertiary">
                        Default quality setting for new generations
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-text-primary">
                          Auto-Download
                        </label>
                        <p className="text-xs text-text-tertiary mt-1">
                          Automatically download completed assets
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.generation?.autoDownload ?? false}
                          onChange={(e) =>
                            updateNestedSetting(
                              "generation",
                              "autoDownload",
                              e.target.checked,
                            )
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-bg-tertiary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border-primary after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-primary">
                        Default Game Style
                      </label>
                      <Input
                        type="text"
                        value={settings.generation?.defaultGameStyle || ""}
                        onChange={(e) =>
                          updateNestedSetting(
                            "generation",
                            "defaultGameStyle",
                            e.target.value,
                          )
                        }
                        placeholder="e.g., Fantasy, Sci-Fi, Realistic"
                      />
                      <p className="text-xs text-text-tertiary">
                        Default game style to use for new generations
                      </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handleSaveSettings}
                        disabled={isSaving}
                        className="flex items-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save Generation Settings
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* System Prompts Tab */}
            {activeTab === "prompts" && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Mobile Category Button */}
                <div className="lg:hidden">
                  <button
                    onClick={() => setShowCategoryDrawer(true)}
                    className="w-full p-4 bg-bg-secondary border border-border-primary rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {CATEGORIES.find((c) => c.id === activeCategory)?.icon}
                      <span className="font-medium text-text-primary">
                        {CATEGORIES.find((c) => c.id === activeCategory)?.name}
                      </span>
                    </div>
                    <span className="text-text-tertiary">▼</span>
                  </button>
                </div>

                {/* Category Sidebar */}
                <div className="hidden lg:block lg:col-span-1 space-y-1.5">
                  <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide px-3 mb-3">
                    Prompt Categories
                  </h2>
                  {CATEGORIES.map((category) => {
                    const data = prompts[category.id];
                    const count = data ? promptsClient.countPrompts(data) : 0;

                    return (
                      <button
                        key={category.id}
                        onClick={() => setActiveCategory(category.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                          activeCategory === category.id
                            ? "bg-primary/20 border-2 border-primary/50 text-primary"
                            : "bg-bg-secondary border border-border-primary text-text-secondary hover:bg-bg-tertiary hover:text-text-primary",
                        )}
                      >
                        <div
                          className={cn(
                            "flex-shrink-0",
                            activeCategory === category.id
                              ? "text-primary"
                              : "text-text-tertiary",
                          )}
                        >
                          {category.icon}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="text-sm font-semibold">
                            {category.name}
                          </div>
                          <div className="text-xs opacity-70">
                            {count} prompts
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Prompt Viewer */}
                <div className="lg:col-span-3">
                  <Card>
                    {/* Category Header */}
                    {CATEGORIES.map(
                      (category) =>
                        activeCategory === category.id && (
                          <CardHeader key={category.id}>
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                  {category.icon}
                                </div>
                                <div>
                                  <CardTitle>{category.name}</CardTitle>
                                  <CardDescription>
                                    {category.description}
                                  </CardDescription>
                                  {activeCategoryData && (
                                    <div className="flex items-center gap-4 mt-2">
                                      <div className="text-xs text-text-tertiary">
                                        {promptCount} prompts
                                      </div>
                                      <div className="text-xs text-text-tertiary">
                                        {Object.keys(activeCategoryData).length}{" "}
                                        keys
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => loadAllPrompts()}
                                  disabled={isLoadingPrompts}
                                  className="p-2 bg-primary/20 hover:bg-primary/30 rounded-lg transition-colors disabled:opacity-50"
                                  title="Refresh prompts"
                                >
                                  <RefreshCw
                                    className={cn(
                                      "w-4 h-4 text-primary",
                                      isLoadingPrompts && "animate-spin",
                                    )}
                                  />
                                </button>
                                <button
                                  onClick={() => handleCopyJSON(activeCategory)}
                                  disabled={!activeCategoryData}
                                  className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Copy JSON to clipboard"
                                >
                                  {copiedCategory === activeCategory ? (
                                    <>
                                      <CheckCircle className="w-4 h-4 text-green-400" />
                                      <span className="text-sm text-green-400">
                                        Copied!
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-4 h-4 text-primary" />
                                      <span className="text-sm text-primary">
                                        Copy JSON
                                      </span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </CardHeader>
                        ),
                    )}

                    <CardContent>
                      {promptsError && (
                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
                          <p className="text-sm text-red-400">{promptsError}</p>
                        </div>
                      )}

                      {isLoadingPrompts ? (
                        <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
                          <Loader2 className="w-8 h-8 animate-spin mb-3" />
                          <p className="text-sm">Loading prompts...</p>
                        </div>
                      ) : activeCategoryData ? (
                        <div className="space-y-4">
                          <CollapsibleSection
                            title="JSON Data"
                            defaultOpen={true}
                            icon={FileText}
                            badge={Object.keys(activeCategoryData).length}
                          >
                            <pre className="bg-bg-tertiary border border-border-primary rounded-lg p-4 overflow-x-auto text-xs text-text-primary font-mono max-h-[600px] overflow-y-auto">
                              {promptsClient.formatJSON(activeCategoryData)}
                            </pre>
                          </CollapsibleSection>

                          <CollapsibleSection
                            title="Extracted Prompts"
                            defaultOpen={false}
                            icon={Sparkles}
                            badge={promptCount}
                          >
                            <div className="space-y-2">
                              {promptsClient
                                .extractPromptText(activeCategoryData)
                                .map((prompt, idx) => (
                                  <div
                                    key={idx}
                                    className="p-3 bg-bg-tertiary border border-border-primary rounded-lg"
                                  >
                                    <p className="text-xs text-text-secondary leading-relaxed">
                                      {prompt}
                                    </p>
                                  </div>
                                ))}
                            </div>
                          </CollapsibleSection>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-text-tertiary">
                          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">No prompt data available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer for Tabs */}
      <Drawer
        open={showMobileDrawer}
        onClose={() => setShowMobileDrawer(false)}
        side="bottom"
        size="md"
        title="Settings Sections"
      >
        <div className="p-6 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setShowMobileDrawer(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                  activeTab === tab.id
                    ? "bg-primary/20 border-2 border-primary/50 text-primary"
                    : "bg-bg-secondary border border-border-primary text-text-secondary hover:bg-bg-tertiary hover:text-text-primary",
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </Drawer>

      {/* Mobile Drawer for Prompt Categories */}
      <Drawer
        open={showCategoryDrawer}
        onClose={() => setShowCategoryDrawer(false)}
        side="left"
        size="md"
        title="Prompt Categories"
      >
        <div className="p-6 space-y-1.5">
          {CATEGORIES.map((category) => {
            const data = prompts[category.id];
            const count = data ? promptsClient.countPrompts(data) : 0;

            return (
              <button
                key={category.id}
                onClick={() => {
                  setActiveCategory(category.id);
                  setShowCategoryDrawer(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                  activeCategory === category.id
                    ? "bg-primary/20 border-2 border-primary/50 text-primary"
                    : "bg-bg-secondary border border-border-primary text-text-secondary hover:bg-bg-tertiary hover:text-text-primary",
                )}
              >
                <div
                  className={cn(
                    "flex-shrink-0",
                    activeCategory === category.id
                      ? "text-primary"
                      : "text-text-tertiary",
                  )}
                >
                  {category.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-semibold">{category.name}</div>
                  <div className="text-xs opacity-70">{count} prompts</div>
                </div>
              </button>
            );
          })}
        </div>
      </Drawer>
    </>
  );
};

export default SettingsPage;
