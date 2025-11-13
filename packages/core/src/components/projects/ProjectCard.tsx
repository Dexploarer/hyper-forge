/**
 * Project Card Component
 * Display individual project with actions
 */

import React from "react";
import {
  Folder,
  Calendar,
  Archive,
  ArchiveRestore,
  Edit,
  Trash2,
  Package,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Project } from "@/services/api/ProjectService";
import { Badge } from "@/components/common";
import { projectsQueries } from "@/queries/projects.queries";

export interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onArchive: (project: Project) => void;
  onRestore: (project: Project) => void;
  onDelete: (project: Project) => void;
  assetCount?: number;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  assetCount = 0,
}) => {
  const queryClient = useQueryClient();
  const isArchived = project.status === "archived";

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Prefetch project details on hover for instant loading
  const prefetchProjectDetails = () => {
    queryClient.prefetchQuery(projectsQueries.detail(project.id));
  };

  return (
    <div
      className="card p-4 hover:border-primary/30 transition-all duration-200 group"
      onMouseEnter={prefetchProjectDetails}
    >
      <div className="flex items-start gap-4">
        {/* Project Icon */}
        <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <Folder className="w-6 h-6 text-primary" />
        </div>

        {/* Project Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-text-primary truncate">
                {project.name}
              </h3>
              {project.description && (
                <p className="text-sm text-text-secondary line-clamp-2 mt-1">
                  {project.description}
                </p>
              )}
            </div>

            {/* Status Badge */}
            {isArchived && (
              <Badge
                variant="secondary"
                className="bg-gray-500/20 text-gray-400 border-gray-500/30"
              >
                <Archive className="w-3 h-3 mr-1" />
                Archived
              </Badge>
            )}
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-text-tertiary mb-3">
            <div className="flex items-center gap-1">
              <Package className="w-3 h-3" />
              <span>{assetCount} assets</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Created {formatDate(project.createdAt)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {!isArchived ? (
              <>
                <button
                  onClick={() => onEdit(project)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 transition-colors flex items-center gap-1"
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={() => onArchive(project)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 border border-gray-500/30 transition-colors flex items-center gap-1"
                >
                  <Archive className="w-3 h-3" />
                  Archive
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onRestore(project)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 transition-colors flex items-center gap-1"
                >
                  <ArchiveRestore className="w-3 h-3" />
                  Restore
                </button>
                <button
                  onClick={() => onDelete(project)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
