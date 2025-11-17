/**
 * Project Routes
 * Manage projects for organizing assets
 */

import { Elysia, t } from "elysia";
import { requireAuthGuard, requireAdminGuard } from "../plugins/auth.plugin";
import { projectService } from "../services/ProjectService";
import { permissionService } from "../services/PermissionService";
import { NotFoundError, ForbiddenError } from "../errors";
import { createChildLogger } from "../utils/logger";
import type { AuthUser } from "../types/auth";

const logger = createChildLogger("ProjectRoutes");

export const projectsRoutes = new Elysia({
  prefix: "/api/projects",
  name: "projects",
})
  // ==================== AUTHENTICATED ROUTES ====================
  .group("", (app) =>
    app
      .use(requireAuthGuard)
      // Create new project
      .post(
        "/",
        async (context) => {
          const { user, body } = context as typeof context & { user: AuthUser };
          const project = await projectService.createProject({
            name: body.name,
            description: body.description,
            ownerId: user.id,
            settings: body.settings,
            metadata: body.metadata,
          });

          return { success: true, project };
        },
        {
          body: t.Object({
            name: t.String({ minLength: 1, maxLength: 255 }),
            description: t.Optional(t.String({ maxLength: 2000 })),
            // Optional project-specific settings (custom configuration)
            settings: t.Optional(t.Record(t.String(), t.Unknown())),
            // Optional metadata for additional project context
            metadata: t.Optional(t.Record(t.String(), t.Unknown())),
          }),
          detail: {
            tags: ["Projects"],
            summary: "Create new project",
            description:
              "Create a new project for organizing assets. Requires authentication.",
            security: [{ BearerAuth: [] }],
          },
        },
      )

      // Get current user's projects
      .get(
        "/",
        async (context) => {
          const { user, query } = context as typeof context & {
            user: AuthUser;
          };
          const includeArchived = query.includeArchived === "true";

          const projects = await projectService.getUserProjects(
            user.id,
            includeArchived,
          );

          return { success: true, projects };
        },
        {
          query: t.Object({
            includeArchived: t.Optional(t.String()),
          }),
          detail: {
            tags: ["Projects"],
            summary: "Get user's projects",
            description:
              "Get all projects for the authenticated user. Requires authentication.",
            security: [{ BearerAuth: [] }],
          },
        },
      )

      // Get project by ID
      .get(
        "/:id",
        async (context) => {
          const { user, params } = context as typeof context & {
            user: AuthUser;
          };
          const { id } = params;

          const project = await projectService.getProjectById(id);

          if (!project) {
            throw new NotFoundError("Project", id, { userId: user.id });
          }

          // Check permission using PermissionService
          if (!permissionService.canViewProject(user, project)) {
            throw new ForbiddenError(
              "You do not have permission to access this project",
              {
                projectId: id,
                userId: user.id,
                projectOwnerId: project.ownerId,
              },
            );
          }

          return { success: true, project };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          detail: {
            tags: ["Projects"],
            summary: "Get project by ID",
            description:
              "Get a specific project by ID. Requires authentication and ownership.",
            security: [{ BearerAuth: [] }],
          },
        },
      )

      // Update project
      .patch(
        "/:id",
        async (context) => {
          const { user, params, body } = context as typeof context & {
            user: AuthUser;
          };
          const { id } = params;

          // Get project to check permissions
          const project = await projectService.getProjectById(id);
          if (!project) {
            throw new NotFoundError("Project", id, { userId: user.id });
          }

          // Check permission using PermissionService
          if (!permissionService.canEditProject(user, project)) {
            throw new ForbiddenError(
              "You do not have permission to update this project",
              { projectId: id, userId: user.id },
            );
          }

          const updatedProject = await projectService.updateProject(id, body);
          return { success: true, project: updatedProject };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          body: t.Object({
            name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
            description: t.Optional(t.String({ maxLength: 2000 })),
            status: t.Optional(
              t.Union([t.Literal("active"), t.Literal("archived")]),
            ),
            // Optional project-specific settings (custom configuration)
            settings: t.Optional(t.Record(t.String(), t.Unknown())),
            // Optional metadata for additional project context
            metadata: t.Optional(t.Record(t.String(), t.Unknown())),
          }),
          detail: {
            tags: ["Projects"],
            summary: "Update project",
            description:
              "Update project details. Requires authentication and ownership.",
            security: [{ BearerAuth: [] }],
          },
        },
      )

      // Archive project
      .post(
        "/:id/archive",
        async (context) => {
          const { user, params } = context as typeof context & {
            user: AuthUser;
          };
          const { id } = params;

          // Get project to check permissions
          const project = await projectService.getProjectById(id);
          if (!project) {
            throw new NotFoundError("Project", id, { userId: user.id });
          }

          // Check permission using PermissionService
          if (!permissionService.canArchiveProject(user, project)) {
            throw new ForbiddenError(
              "You do not have permission to archive this project",
              { projectId: id, userId: user.id },
            );
          }

          const archivedProject = await projectService.archiveProject(id);
          return { success: true, project: archivedProject };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          detail: {
            tags: ["Projects"],
            summary: "Archive project",
            description:
              "Archive a project (soft delete). Requires authentication and ownership.",
            security: [{ BearerAuth: [] }],
          },
        },
      )

      // Restore archived project
      .post(
        "/:id/restore",
        async (context) => {
          const { user, params } = context as typeof context & {
            user: AuthUser;
          };
          const { id } = params;

          // Get project to check permissions
          const project = await projectService.getProjectById(id);
          if (!project) {
            throw new NotFoundError("Project", id, { userId: user.id });
          }

          // Check permission using PermissionService
          if (!permissionService.canArchiveProject(user, project)) {
            throw new ForbiddenError(
              "You do not have permission to restore this project",
              { projectId: id, userId: user.id },
            );
          }

          const restoredProject = await projectService.restoreProject(id);
          return { success: true, project: restoredProject };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          detail: {
            tags: ["Projects"],
            summary: "Restore project",
            description:
              "Restore an archived project. Requires authentication and ownership.",
            security: [{ BearerAuth: [] }],
          },
        },
      )

      // Get project assets
      .get(
        "/:id/assets",
        async (context) => {
          const { user, params, query } = context as typeof context & {
            user: AuthUser;
          };
          const { id } = params;

          // Get project to check permissions
          const project = await projectService.getProjectById(id);
          if (!project) {
            throw new NotFoundError("Project", id, { userId: user.id });
          }

          // Check permission using PermissionService
          if (!permissionService.canViewProject(user, project)) {
            throw new ForbiddenError(
              "You do not have permission to access this project",
              { projectId: id, userId: user.id },
            );
          }

          const assets = await projectService.getProjectAssets(id, {
            type: query.type,
            status: query.status,
          });

          return { success: true, assets };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          query: t.Object({
            type: t.Optional(t.String()),
            status: t.Optional(t.String()),
          }),
          detail: {
            tags: ["Projects"],
            summary: "Get project assets",
            description:
              "Get all assets belonging to a project with optional filtering by type and status. Requires authentication and ownership.",
            security: [{ BearerAuth: [] }],
          },
        },
      )

      // Get project statistics
      .get(
        "/:id/stats",
        async (context) => {
          const { user, params } = context as typeof context & {
            user: AuthUser;
          };
          const { id } = params;

          // Get project to check permissions
          const project = await projectService.getProjectById(id);
          if (!project) {
            throw new NotFoundError("Project", id, { userId: user.id });
          }

          // Check permission using PermissionService
          if (!permissionService.canViewProject(user, project)) {
            throw new ForbiddenError(
              "You do not have permission to access this project",
              { projectId: id, userId: user.id },
            );
          }

          const stats = await projectService.getProjectStats(id);
          return { success: true, stats };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          detail: {
            tags: ["Projects"],
            summary: "Get project statistics",
            description:
              "Get project statistics including asset count, breakdown by type, total size, and timestamps. Requires authentication and ownership.",
            security: [{ BearerAuth: [] }],
          },
        },
      ),
  )

  // ==================== ADMIN-ONLY ROUTES ====================
  .group("", (app) =>
    app
      .use(requireAdminGuard)
      // Get all projects (admin only)
      .get(
        "/admin/all",
        async ({ query }) => {
          const includeArchived = query.includeArchived === "true";
          const projects = await projectService.getAllProjects(includeArchived);

          return { success: true, projects };
        },
        {
          query: t.Object({
            includeArchived: t.Optional(t.String()),
          }),
          detail: {
            tags: ["Projects"],
            summary: "Get all projects (Admin only)",
            description: "Get all projects in the system. Requires admin role.",
            security: [{ BearerAuth: [] }],
          },
        },
      )

      // Delete project (admin only)
      .delete(
        "/admin/:id",
        async ({ params }) => {
          const { id } = params;

          await projectService.deleteProject(id);
          return { success: true, message: "Project deleted successfully" };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          detail: {
            tags: ["Projects"],
            summary: "Delete project (Admin only)",
            description: "Permanently delete a project. Requires admin role.",
            security: [{ BearerAuth: [] }],
          },
        },
      ),
  );
