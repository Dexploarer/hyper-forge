import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Package,
  Hand,
  Shield,
  Play,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Library,
  TestTube2,
  Users,
  Settings,
  LayoutDashboard,
  Box,
  Blocks,
  TreePine,
  Globe,
  User,
  Scroll,
  MessageSquare,
  Book,
  Mic,
  Music,
  Volume2,
  Wrench,
  Folder,
} from "lucide-react";
import { NavigationView } from "@/types";
import { NAVIGATION_VIEWS } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/styles";
import { RecentlyViewedWidget } from "./RecentlyViewedWidget";
import { useAssetsStore } from "@/store";

interface SidebarProps {
  currentView: NavigationView;
  onViewChange: (view: NavigationView) => void;
}

interface NavItem {
  view: NavigationView;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  description: string;
  requiresAdmin?: boolean;
}

interface NavParent {
  id: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  description: string;
  children: NavItem[];
}

interface NavSection {
  type: "section" | "item" | "parent";
  label?: string; // For section headers
  item?: NavItem; // For simple items
  parent?: NavParent; // For expandable parents
}

// Storage key for expanded state
const EXPANDED_STATE_KEY = "sidebar-expanded-sections";

// Define navigation structure with sections
const NAVIGATION_STRUCTURE: NavSection[] = [
  // Core pages
  {
    type: "item",
    item: {
      view: NAVIGATION_VIEWS.DASHBOARD,
      icon: LayoutDashboard,
      label: "Dashboard",
      description: "Overview & quick actions",
    },
  },
  {
    type: "item",
    item: {
      view: NAVIGATION_VIEWS.ASSETS,
      icon: Package,
      label: "Assets",
      description: "Browse & manage assets",
    },
  },
  {
    type: "item",
    item: {
      view: NAVIGATION_VIEWS.PROJECTS,
      icon: Folder,
      label: "Projects",
      description: "Organize asset projects",
    },
  },
  {
    type: "item",
    item: {
      view: NAVIGATION_VIEWS.CONTENT_LIBRARY,
      icon: Library,
      label: "Library",
      description: "Saved content browser",
    },
  },

  // Generation section header
  {
    type: "section",
    label: "GENERATION",
  },

  // 3D Generation (expandable)
  {
    type: "parent",
    parent: {
      id: "3d-generation",
      icon: Box,
      label: "3D Generation",
      description: "Create 3D assets & models",
      children: [
        {
          view: NAVIGATION_VIEWS.GENERATION_CHARACTER,
          icon: User,
          label: "Characters",
          description: "Generate character models",
        },
        {
          view: NAVIGATION_VIEWS.GENERATION_PROP,
          icon: Blocks,
          label: "Props & Items",
          description: "Generate props, weapons, items",
        },
        {
          view: NAVIGATION_VIEWS.GENERATION_ENVIRONMENT,
          icon: TreePine,
          label: "Environments",
          description: "Generate buildings & scenery",
        },
        {
          view: NAVIGATION_VIEWS.GENERATION_WORLD,
          icon: Globe,
          label: "World Builder",
          description: "Generate complete worlds",
        },
      ],
    },
  },

  // Content Generation (expandable)
  {
    type: "parent",
    parent: {
      id: "content-generation",
      icon: Scroll,
      label: "Content Generation",
      description: "Create game content",
      children: [
        {
          view: NAVIGATION_VIEWS.CONTENT_NPC,
          icon: User,
          label: "NPCs",
          description: "Generate NPC characters",
        },
        {
          view: NAVIGATION_VIEWS.CONTENT_QUEST,
          icon: Scroll,
          label: "Quests",
          description: "Generate quest content",
        },
        {
          view: NAVIGATION_VIEWS.CONTENT_DIALOGUE,
          icon: MessageSquare,
          label: "Dialogue Trees",
          description: "Generate conversations",
        },
        {
          view: NAVIGATION_VIEWS.CONTENT_LORE,
          icon: Book,
          label: "Lore & Stories",
          description: "Generate world lore",
        },
      ],
    },
  },

  // Audio Generation (expandable)
  {
    type: "parent",
    parent: {
      id: "audio-generation",
      icon: Music,
      label: "Audio Generation",
      description: "Create audio content",
      children: [
        {
          view: NAVIGATION_VIEWS.AUDIO_VOICE,
          icon: Mic,
          label: "Voice & Speech",
          description: "Generate voice & TTS",
        },
        {
          view: NAVIGATION_VIEWS.AUDIO_SFX,
          icon: Volume2,
          label: "Sound Effects",
          description: "Generate SFX",
        },
        {
          view: NAVIGATION_VIEWS.AUDIO_MUSIC,
          icon: Music,
          label: "Music & Soundtracks",
          description: "Generate music",
        },
      ],
    },
  },

  // Tools section header
  {
    type: "section",
    label: "TOOLS",
  },

  // Tools (expandable)
  {
    type: "parent",
    parent: {
      id: "tools",
      icon: Wrench,
      label: "Tools",
      description: "Asset processing & testing",
      children: [
        {
          view: NAVIGATION_VIEWS.EQUIPMENT,
          icon: Shield,
          label: "Equipment Fitting",
          description: "Weapons, armor & helmets",
        },
        {
          view: NAVIGATION_VIEWS.HAND_RIGGING,
          icon: Hand,
          label: "Hand Rigging",
          description: "Setup weapon grips",
        },
        {
          view: NAVIGATION_VIEWS.RETARGET_ANIMATE,
          icon: Play,
          label: "Animation Tools",
          description: "Retarget animations",
        },
        {
          view: NAVIGATION_VIEWS.PLAYTESTER,
          icon: TestTube2,
          label: "Playtester",
          description: "Test with AI feedback",
        },
      ],
    },
  },
];

// Admin-only navigation items
const ADMIN_NAVIGATION: NavSection[] = [
  {
    type: "item",
    item: {
      view: NAVIGATION_VIEWS.ADMIN_DASHBOARD,
      icon: Users,
      label: "Admin Dashboard",
      description: "Manage users & admins",
      requiresAdmin: true,
    },
  },
];

// System navigation items
const SYSTEM_NAVIGATION: NavSection[] = [
  {
    type: "item",
    item: {
      view: NAVIGATION_VIEWS.SETTINGS,
      icon: Settings,
      label: "Settings",
      description: "View prompts & config",
    },
  },
];

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { logout, user } = useAuth();
  const { recentlyViewed } = useAssetsStore();

  // Load expanded state from localStorage
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(EXPANDED_STATE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Save expanded state to localStorage
  useEffect(() => {
    localStorage.setItem(
      EXPANDED_STATE_KEY,
      JSON.stringify(Array.from(expandedSections)),
    );
  }, [expandedSections]);

  // Determine if user is admin
  const isAdmin = user?.role === "admin";

  // Build final navigation structure
  const navigationSections = [
    ...NAVIGATION_STRUCTURE,
    ...(isAdmin ? ADMIN_NAVIGATION : []),
    ...SYSTEM_NAVIGATION,
  ];

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      logout();
    }
  };

  const handleRecentAssetClick = (assetId: string) => {
    onViewChange(NAVIGATION_VIEWS.ASSETS);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  // Check if a view is active or if it's a parent of the active view
  const isViewActive = (view: NavigationView) => currentView === view;

  const isParentActive = (parent: NavParent) => {
    return parent.children.some((child) => child.view === currentView);
  };

  return (
    <aside
      className={cn(
        "h-full solid-nav flex flex-col transition-all duration-300",
        isCollapsed ? "w-20" : "w-64",
      )}
    >
      {/* Logo/Header */}
      <div className="p-4 border-b border-border-primary flex items-center justify-between">
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <img
                src="/Untitled%20design%20(3)/1.png"
                alt="Asset Forge Logo"
                className="w-5 h-5 object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary">
                Asset Forge
              </h1>
              <p className="text-xs text-text-tertiary">Alpha</p>
            </div>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center">
            <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <img
                src="/Untitled%20design%20(3)/1.png"
                alt="Asset Forge Logo"
                className="w-5 h-5 object-contain"
              />
            </div>
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-bg-hover rounded-lg transition-colors text-text-tertiary hover:text-text-primary"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Recently Viewed Widget - only show when not collapsed and has items */}
      {!isCollapsed && recentlyViewed.length > 0 && (
        <div className="px-2 pt-2 pb-2">
          <RecentlyViewedWidget onAssetClick={handleRecentAssetClick} />
        </div>
      )}

      {/* Navigation */}
      <nav
        id="navigation"
        aria-label="Main navigation"
        className="flex-1 p-2 space-y-0.5 overflow-y-auto"
      >
        {navigationSections.map((section, index) => {
          // Render section header
          if (section.type === "section") {
            if (isCollapsed) {
              return (
                <div
                  key={`section-${index}`}
                  className="h-px bg-border-primary my-2"
                />
              );
            }
            return (
              <div
                key={`section-${index}`}
                className="px-3 py-2 mt-2 mb-1 text-xs font-semibold text-text-tertiary uppercase tracking-wider"
              >
                {section.label}
              </div>
            );
          }

          // Render simple nav item
          if (section.type === "item" && section.item) {
            const item = section.item;
            const Icon = item.icon;
            const isActive = isViewActive(item.view);

            return (
              <button
                key={item.view}
                onClick={() => onViewChange(item.view)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                  isActive
                    ? "bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 text-primary shadow-lg shadow-primary/10"
                    : "hover:bg-bg-hover text-text-secondary hover:text-text-primary border border-transparent",
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110",
                    isActive && "text-primary",
                  )}
                />

                {!isCollapsed && (
                  <div className="flex-1 text-left min-w-0">
                    <div
                      className={cn(
                        "font-medium text-sm truncate",
                        isActive ? "text-primary" : "text-text-primary",
                      )}
                    >
                      {item.label}
                    </div>
                    <div className="text-xs text-text-tertiary truncate">
                      {item.description}
                    </div>
                  </div>
                )}

                {!isCollapsed && isActive && (
                  <div className="w-1.5 h-8 bg-primary rounded-full" />
                )}
              </button>
            );
          }

          // Render expandable parent item
          if (section.type === "parent" && section.parent) {
            const parent = section.parent;
            const Icon = parent.icon;
            const isExpanded = expandedSections.has(parent.id);
            const hasActiveChild = isParentActive(parent);

            return (
              <div key={parent.id}>
                {/* Parent button */}
                <button
                  onClick={() => toggleSection(parent.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                    hasActiveChild
                      ? "bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 text-primary"
                      : "hover:bg-bg-hover text-text-secondary hover:text-text-primary border border-transparent",
                  )}
                  title={isCollapsed ? parent.label : undefined}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110",
                      hasActiveChild && "text-primary",
                    )}
                  />

                  {!isCollapsed && (
                    <>
                      <div className="flex-1 text-left min-w-0">
                        <div
                          className={cn(
                            "font-medium text-sm truncate",
                            hasActiveChild
                              ? "text-primary"
                              : "text-text-primary",
                          )}
                        >
                          {parent.label}
                        </div>
                        <div className="text-xs text-text-tertiary truncate">
                          {parent.description}
                        </div>
                      </div>

                      <ChevronDown
                        className={cn(
                          "w-4 h-4 flex-shrink-0 transition-transform duration-200",
                          isExpanded && "rotate-180",
                          hasActiveChild
                            ? "text-primary"
                            : "text-text-tertiary",
                        )}
                      />
                    </>
                  )}
                </button>

                {/* Children (only show when expanded and not collapsed) */}
                {!isCollapsed && isExpanded && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-border-primary pl-2">
                    {parent.children.map((child) => {
                      const ChildIcon = child.icon;
                      const isActive = isViewActive(child.view);

                      return (
                        <button
                          key={child.view}
                          onClick={() => onViewChange(child.view)}
                          className={cn(
                            "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all duration-200 group",
                            isActive
                              ? "bg-primary/20 border border-primary/30 text-primary"
                              : "hover:bg-bg-hover text-text-secondary hover:text-text-primary border border-transparent",
                          )}
                        >
                          <ChildIcon
                            className={cn(
                              "w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110",
                              isActive && "text-primary",
                            )}
                          />
                          <div className="flex-1 text-left min-w-0">
                            <div
                              className={cn(
                                "font-medium text-sm truncate",
                                isActive ? "text-primary" : "text-text-primary",
                              )}
                            >
                              {child.label}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return null;
        })}
      </nav>

      {/* Footer - Logout */}
      <div className="p-2 border-t border-border-primary">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 text-text-secondary hover:text-red-400 transition-colors group border border-transparent hover:border-red-500/30"
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
