/**
 * Projects Page
 * Full-featured project management interface
 */

import React, { useState } from "react";
import {
  Folder,
  Plus,
  Archive,
  ArchiveRestore,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useProjectActions } from "@/hooks/useProjectActions";
import { Project } from "@/services/api/ProjectService";
import { ProjectList } from "@/components/projects/ProjectList";
import { CreateProjectModal } from "@/components/projects/CreateProjectModal";
import { EditProjectModal } from "@/components/projects/EditProjectModal";
import { EmptyState, Badge } from "@/components/common";

export const ProjectsPage: React.FC = () => {
  const [showArchived, setShowArchived] = useState(false);
  const { projects, loading, reloadProjects } = useProjects(showArchived);
  const {
    createProject,
    updateProject,
    archiveProject,
    restoreProject,
    deleteProject,
    isCreating,
    isUpdating,
  } = useProjectActions();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Filter projects by status
  const activeProjects = projects.filter((p) => p.status === "active");
  const archivedProjects = projects.filter((p) => p.status === "archived");

  const displayedProjects = showArchived ? archivedProjects : activeProjects;

  // Handle create project
  const handleCreate = async (data: { name: string; description?: string }) => {
    const result = await createProject(data);
    if (result) {
      setShowCreateModal(false);
      reloadProjects();
    }
  };

  // Handle update project
  const handleUpdate = async (
    id: string,
    updates: { name?: string; description?: string },
  ) => {
    const result = await updateProject(id, updates);
    if (result) {
      setEditingProject(null);
      reloadProjects();
    }
  };

  // Handle archive project
  const handleArchive = async (project: Project) => {
    if (
      confirm(
        `Are you sure you want to archive "${project.name}"? It will be hidden from the active project list.`,
      )
    ) {
      const result = await archiveProject(project.id);
      if (result) {
        reloadProjects();
      }
    }
  };

  // Handle restore project
  const handleRestore = async (project: Project) => {
    const result = await restoreProject(project.id);
    if (result) {
      reloadProjects();
    }
  };

  // Handle delete project
  const handleDelete = async (project: Project) => {
    if (
      confirm(
        `Are you sure you want to permanently delete "${project.name}"? This action cannot be undone.`,
      )
    ) {
      const result = await deleteProject(project.id);
      if (result) {
        reloadProjects();
      }
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                <Folder className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-text-primary">
                  Projects
                </h1>
                <p className="text-text-secondary">
                  Organize your assets into projects
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent-hover text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Create Project
            </button>
          </div>

          {/* Stats & Filters */}
          <div className="flex items-center justify-between gap-4">
            {/* Stats */}
            <div className="flex items-center gap-4">
              <Badge variant="primary" className="px-3 py-1.5">
                <Folder className="w-3 h-3 mr-1" />
                {activeProjects.length} Active
              </Badge>
              {archivedProjects.length > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-gray-500/20 text-gray-400 border-gray-500/30 px-3 py-1.5"
                >
                  <Archive className="w-3 h-3 mr-1" />
                  {archivedProjects.length} Archived
                </Badge>
              )}
            </div>

            {/* Archive Toggle */}
            {archivedProjects.length > 0 && (
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
                  showArchived
                    ? "bg-gray-500/20 text-gray-400 border-gray-500/30 hover:bg-gray-500/30"
                    : "bg-bg-tertiary text-text-secondary border-border-primary hover:border-primary/50"
                }`}
              >
                {showArchived ? (
                  <>
                    <ArchiveRestore className="w-4 h-4" />
                    <span className="text-sm font-medium">Show Active</span>
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4" />
                    <span className="text-sm font-medium">Show Archived</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
              <p className="text-sm text-text-secondary">Loading projects...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && displayedProjects.length === 0 && (
          <div className="flex items-center justify-center h-64">
            {showArchived ? (
              <EmptyState
                icon={Archive}
                title="No archived projects"
                description="Archived projects will appear here"
              />
            ) : (
              <div>
                <EmptyState
                  icon={Folder}
                  title="No projects yet"
                  description="Create your first project to organize your assets"
                />
                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
                  >
                    Create Project
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Project List */}
        {!loading && displayedProjects.length > 0 && (
          <ProjectList
            projects={displayedProjects}
            onEdit={setEditingProject}
            onArchive={handleArchive}
            onRestore={handleRestore}
            onDelete={handleDelete}
          />
        )}

        {/* Info Card */}
        {!loading && activeProjects.length > 0 && !showArchived && (
          <div className="mt-6 card p-4 bg-blue-500/10 border-blue-500/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-400 mb-1">
                  About Projects
                </h3>
                <p className="text-sm text-text-secondary">
                  Projects help you organize assets for different games or
                  features. You can assign assets to projects when generating or
                  uploading them. Archived projects are hidden but can be
                  restored anytime.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateProjectModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreate}
        loading={isCreating}
      />

      <EditProjectModal
        open={!!editingProject}
        project={editingProject}
        onClose={() => setEditingProject(null)}
        onUpdate={handleUpdate}
        loading={isUpdating}
      />
    </div>
  );
};

export default ProjectsPage;
