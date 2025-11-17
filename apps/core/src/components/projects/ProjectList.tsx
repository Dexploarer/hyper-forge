/**
 * Project List Component
 * Grid display of project cards
 */

import React from "react";
import { Project } from "@/services/api/ProjectService";
import { ProjectCard } from "./ProjectCard";

export interface ProjectListProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onArchive: (project: Project) => void;
  onRestore: (project: Project) => void;
  onDelete: (project: Project) => void;
  assetCounts?: Record<string, number>;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  assetCounts = {},
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onEdit={onEdit}
          onArchive={onArchive}
          onRestore={onRestore}
          onDelete={onDelete}
          assetCount={assetCounts[project.id] || 0}
        />
      ))}
    </div>
  );
};
