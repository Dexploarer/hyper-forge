import { List, Plus, Layout, Upload } from "lucide-react";
import React from "react";

import { cn } from "@/styles";

export type WorldConfigTab = "list" | "create" | "templates" | "import";

interface Tab {
  id: WorldConfigTab;
  label: string;
  icon: React.ElementType;
  description: string;
}

const TABS: Tab[] = [
  {
    id: "list",
    label: "Configurations",
    icon: List,
    description: "View and manage your world configurations",
  },
  {
    id: "create",
    label: "Create",
    icon: Plus,
    description: "Create a new world configuration",
  },
  {
    id: "templates",
    label: "Templates",
    icon: Layout,
    description: "Browse and use pre-made templates",
  },
  {
    id: "import",
    label: "Import",
    icon: Upload,
    description: "Import configuration from file",
  },
];

interface TabNavigationProps {
  activeTab: WorldConfigTab;
  onTabChange: (tab: WorldConfigTab) => void;
  counts?: Partial<Record<WorldConfigTab, number>>;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  counts,
}) => {
  return (
    <div className="border-b border-border-primary bg-bg-secondary/50">
      <div className="flex items-center overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = counts?.[tab.id];

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all relative whitespace-nowrap",
                "hover:bg-bg-tertiary/50",
                isActive
                  ? "text-primary bg-bg-tertiary/30"
                  : "text-text-secondary hover:text-text-primary",
              )}
              title={tab.description}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {count !== undefined && count > 0 && (
                <span
                  className={cn(
                    "ml-1 px-2 py-0.5 rounded-full text-xs font-semibold",
                    isActive
                      ? "bg-primary/20 text-primary"
                      : "bg-bg-tertiary text-text-tertiary",
                  )}
                >
                  {count}
                </span>
              )}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
