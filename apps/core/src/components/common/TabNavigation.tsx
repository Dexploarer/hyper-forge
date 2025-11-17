import React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/styles";

export type TabView = string;

export interface Tab {
  id: TabView;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export interface TabNavigationProps<T extends string = string> {
  activeView: T;
  tabs: Tab[];
  onTabChange: (view: T) => void;
  variant?: "pills" | "underline" | "minimal";
  className?: string;
}

export const TabNavigation = <T extends string = string>({
  activeView,
  tabs,
  onTabChange,
  variant = "pills",
  className,
}: TabNavigationProps<T>) => {
  const variantStyles = {
    pills: {
      container:
        "flex gap-2 p-1 bg-bg-secondary/50 rounded-lg border border-border-primary",
      tab: "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-all duration-200 text-sm font-medium",
      active: "bg-primary text-white shadow-lg shadow-primary/20",
      inactive:
        "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary",
      badge: "px-2 py-0.5 rounded-full text-xs font-semibold",
    },
    underline: {
      container: "flex gap-2 border-b border-border-primary",
      tab: "flex items-center gap-2 px-4 py-3 border-b-2 transition-all font-medium text-sm",
      active: "border-primary text-primary bg-primary/5",
      inactive:
        "border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/30",
      badge: "ml-1 px-2 py-0.5 rounded-full text-xs font-semibold",
    },
    minimal: {
      container: "flex gap-1 border-b border-border-primary",
      tab: "relative flex items-center gap-2 px-6 py-3 font-medium text-sm transition-all",
      active: "text-primary border-b-2 border-primary bg-primary/5",
      inactive: "text-text-secondary hover:text-text-primary hover:bg-bg-hover",
      badge:
        "px-2 py-0.5 bg-primary/20 border border-primary/30 text-primary text-xs font-semibold rounded-full",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className={cn(styles.container, className)}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeView === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as T)}
            className={cn(
              styles.tab,
              isActive ? styles.active : styles.inactive,
            )}
          >
            <Icon
              className={cn(
                "w-4 h-4",
                isActive && tab.id === "progress" && "animate-spin",
              )}
            />
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className={cn(
                  styles.badge,
                  isActive
                    ? variant === "pills"
                      ? "bg-white text-primary"
                      : "bg-primary text-white"
                    : "bg-bg-tertiary text-text-tertiary",
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
