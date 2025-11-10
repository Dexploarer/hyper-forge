import { ChevronDown, ChevronUp } from "lucide-react";
import React, { useState } from "react";

interface ConfigSectionCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export const ConfigSectionCard: React.FC<ConfigSectionCardProps> = ({
  title,
  description,
  icon,
  children,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border border-border-primary rounded-xl overflow-hidden bg-bg-secondary/30">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-bg-tertiary/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              {icon}
            </div>
          )}
          <div className="text-left">
            <h3 className="text-base font-semibold text-text-primary">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-text-secondary mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>
        <div className="text-text-secondary">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-border-primary/50">
          {children}
        </div>
      )}
    </div>
  );
};
