import React from "react";
import { cn } from "@/styles";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  title: string;
  description?: string;
  action?:
    | React.ReactNode
    | {
        label: string;
        onClick: () => void;
      };
  className?: string;
  iconSize?: number;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className,
  iconSize = 48,
}) => {
  return (
    <div className={cn("text-center py-12 text-text-tertiary", className)}>
      <Icon className="mx-auto mb-3 opacity-50" size={iconSize} />
      <p className="text-sm text-text-primary">{title}</p>
      {description && (
        <p className="text-xs text-text-tertiary mt-1">{description}</p>
      )}
      {action && (
        <>
          {typeof action === "object" &&
          "label" in action &&
          "onClick" in action ? (
            <Button onClick={action.onClick} className="mt-4">
              {action.label}
            </Button>
          ) : (
            action
          )}
        </>
      )}
    </div>
  );
};
