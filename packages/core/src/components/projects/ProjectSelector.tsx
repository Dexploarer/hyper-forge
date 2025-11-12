/**
 * Project Selector Component
 * Dropdown selector for choosing project in asset workflows
 */

import React, { useEffect, useState } from "react";
import { Folder, ChevronDown, Plus } from "lucide-react";
import { Project } from "@/services/api/ProjectService";
import { useProjects } from "@/hooks/useProjects";

export interface ProjectSelectorProps {
  selectedProjectId: string | null;
  onSelectProject: (projectId: string | null) => void;
  onCreateProject?: () => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  selectedProjectId,
  onSelectProject,
  onCreateProject,
  label = "Project",
  required = false,
  disabled = false,
  className = "",
}) => {
  const { projects, loading } = useProjects();
  const [isOpen, setIsOpen] = useState(false);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".project-selector")) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className={`project-selector ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-text-primary mb-2">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}

      {/* Selector Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled || loading}
          className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg hover:border-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Folder className="w-4 h-4 text-text-tertiary flex-shrink-0" />
            <span className="text-sm text-text-primary truncate">
              {loading
                ? "Loading projects..."
                : selectedProject
                  ? selectedProject.name
                  : "Select a project..."}
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-text-tertiary transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && !disabled && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-bg-secondary border border-border-primary rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
            {/* No Project Option */}
            {!required && (
              <button
                type="button"
                onClick={() => {
                  onSelectProject(null);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-bg-hover transition-colors ${
                  !selectedProjectId ? "bg-primary/10 text-primary" : ""
                }`}
              >
                <Folder className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">No Project</span>
              </button>
            )}

            {/* Project List */}
            {projects.length > 0 ? (
              projects
                .filter((p) => p.status === "active")
                .map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => {
                      onSelectProject(project.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-bg-hover transition-colors ${
                      selectedProjectId === project.id
                        ? "bg-primary/10 text-primary"
                        : ""
                    }`}
                  >
                    <Folder className="w-4 h-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {project.name}
                      </div>
                      {project.description && (
                        <div className="text-xs text-text-tertiary truncate">
                          {project.description}
                        </div>
                      )}
                    </div>
                  </button>
                ))
            ) : (
              <div className="px-4 py-3 text-sm text-text-tertiary text-center">
                No projects available
              </div>
            )}

            {/* Create New Project */}
            {onCreateProject && (
              <>
                <div className="h-px bg-border-primary my-1" />
                <button
                  type="button"
                  onClick={() => {
                    onCreateProject();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-bg-hover transition-colors text-primary"
                >
                  <Plus className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium">
                    Create New Project
                  </span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
