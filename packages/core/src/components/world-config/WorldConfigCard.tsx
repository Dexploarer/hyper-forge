import {
  Globe,
  Check,
  Copy,
  Edit,
  Download,
  Trash2,
  MoreVertical,
  Play,
  FileText,
} from "lucide-react";
import React, { useState } from "react";

import { Badge, Card, CardContent, QuickActionMenu } from "@/components/common";
import type { QuickAction } from "@/components/common";
import type { WorldConfigurationData } from "@/services/api/WorldConfigAPIClient";
import { cn } from "@/styles";

interface WorldConfigCardProps {
  config: WorldConfigurationData;
  onSelect?: (config: WorldConfigurationData) => void;
  onActivate?: (id: string) => void;
  onClone?: (id: string) => void;
  onEdit?: (id: string) => void;
  onExport?: (id: string) => void;
  onDelete?: (id: string) => void;
  onPreview?: (id: string) => void;
  selected?: boolean;
}

const GENRE_COLORS: Record<string, string> = {
  fantasy: "from-purple-500/20 to-pink-500/20 border-purple-500/30",
  "dark-fantasy": "from-gray-800/40 to-red-900/40 border-red-700/30",
  "sci-fi": "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
  modern: "from-green-500/20 to-teal-500/20 border-green-500/30",
  "post-apocalyptic": "from-orange-500/20 to-red-500/20 border-orange-500/30",
  steampunk: "from-amber-500/20 to-brown-500/20 border-amber-500/30",
  cyberpunk: "from-fuchsia-500/20 to-cyan-500/20 border-fuchsia-500/30",
  horror: "from-red-900/30 to-black/50 border-red-800/40",
  default: "from-primary/10 to-accent/10 border-primary/30",
};

const GENRE_ICONS: Record<string, string> = {
  fantasy: "✨",
  "dark-fantasy": "🌙",
  "sci-fi": "🚀",
  modern: "🏙️",
  "post-apocalyptic": "☢️",
  steampunk: "⚙️",
  cyberpunk: "🤖",
  horror: "👻",
};

export const WorldConfigCard: React.FC<WorldConfigCardProps> = ({
  config,
  onSelect,
  onActivate,
  onClone,
  onEdit,
  onExport,
  onDelete,
  onPreview,
  selected = false,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const genreColor =
    GENRE_COLORS[config.genre.toLowerCase()] || GENRE_COLORS.default;
  const genreIcon = GENRE_ICONS[config.genre.toLowerCase()] || "🌍";

  const actions: QuickAction[] = [
    ...(onPreview
      ? [
          {
            id: "preview",
            label: "Preview AI Context",
            icon: FileText,
            onClick: () => onPreview(config.id),
            variant: "default" as const,
          },
        ]
      : []),
    ...(!config.isActive && onActivate
      ? [
          {
            id: "activate",
            label: "Activate",
            icon: Play,
            onClick: () => onActivate(config.id),
            variant: "default" as const,
          },
        ]
      : []),
    ...(onClone
      ? [
          {
            id: "clone",
            label: "Clone",
            icon: Copy,
            onClick: () => onClone(config.id),
            variant: "default" as const,
          },
        ]
      : []),
    ...(onEdit
      ? [
          {
            id: "edit",
            label: "Edit",
            icon: Edit,
            onClick: () => onEdit(config.id),
            variant: "default" as const,
          },
        ]
      : []),
    ...(onExport
      ? [
          {
            id: "export",
            label: "Export",
            icon: Download,
            onClick: () => onExport(config.id),
            variant: "default" as const,
          },
        ]
      : []),
    ...(onDelete && !config.isActive
      ? [
          {
            id: "delete",
            label: "Delete",
            icon: Trash2,
            onClick: () => onDelete(config.id),
            variant: "danger" as const,
          },
        ]
      : []),
  ];

  const handleCardClick = () => {
    if (onSelect && !isMenuOpen) {
      onSelect(config);
    }
  };

  return (
    <Card
      className={cn(
        "group relative transition-all duration-200 cursor-pointer hover:shadow-lg",
        "bg-gradient-to-br",
        genreColor,
        selected && "ring-2 ring-primary shadow-xl scale-[1.02]",
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-5">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Genre Icon */}
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-bg-tertiary/50 flex items-center justify-center text-2xl">
              {genreIcon}
            </div>

            {/* Title & Genre */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-text-primary truncate">
                {config.name}
              </h3>
              <p className="text-xs text-text-tertiary capitalize">
                {config.genre.replace("-", " ")}
              </p>
            </div>
          </div>

          {/* Actions Menu */}
          {actions.length > 0 && (
            <div
              onClick={(e) => e.stopPropagation()}
              onMouseEnter={() => setIsMenuOpen(true)}
              onMouseLeave={() => setIsMenuOpen(false)}
            >
              <QuickActionMenu
                actions={actions}
                trigger={
                  <button
                    className={cn(
                      "p-1.5 rounded-md transition-all",
                      "text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary/50",
                      "opacity-0 group-hover:opacity-100",
                    )}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                }
              />
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-text-secondary line-clamp-2 mb-3">
          {config.description}
        </p>

        {/* Tags */}
        {config.tags && config.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {config.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-bg-tertiary/50 text-text-tertiary"
              >
                #{tag}
              </span>
            ))}
            {config.tags.length > 3 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-bg-tertiary/50 text-text-tertiary">
                +{config.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-xs text-text-tertiary">
          <div className="flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" />
            <span>
              {config.races.length} races, {config.factions.length} factions
            </span>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border-primary/50">
          {config.isActive && (
            <Badge variant="success" className="flex items-center gap-1">
              <Check className="w-3 h-3" />
              Active
            </Badge>
          )}
          {config.isTemplate && <Badge variant="primary">Template</Badge>}
          {!config.isActive && !config.isTemplate && (
            <Badge variant="secondary">Inactive</Badge>
          )}

          <span className="text-xs text-text-tertiary ml-auto">
            v{config.version}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
