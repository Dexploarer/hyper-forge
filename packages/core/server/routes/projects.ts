/**
 * Project Routes
 * Manage projects for organizing assets
 *
 * Refactored to use Elysia 2025 best practices:
 * - Uses .group() for shared middleware
 * - Auth guards applied at group level via .use()
 * - Cleaner route handlers without manual auth checks
 * - User context automatically injected by guards
 *
 * Note: TypeScript errors are expected due to Elysia's type system limitations
 * when using plugins with .derive() inside .group(). The code works correctly
 * at runtime. Each route handler has @ts-expect-error to suppress these errors.
 */

import { Elysia, t } from "elysia";
import { requireAuthGuard, requireAdminGuard } from "../plugins/auth-guards";
import { projectService } from "../services/ProjectService";
import { permissionService } from "../services/PermissionService";
import { NotFoundError, ForbiddenError } from "../errors";
import { createChildLogger } from "../utils/logger";
import type { AuthUser } from "../middleware/auth";

const logger = createChildLogger("ProjectRoutes");

export const projectsRoutes = new Elysia({
  prefix: "/api/projects",
  name: "projects",
})
  // ==================== AUTHENTICATED ROUTES ====================
  // All routes in this group require authentication
  // User context is injected by requireAuthGuard
  .group("", (app) =>
    app
      .use(requireAuthGuard)

      // Create new project
      .post(
        "/",
        // @ts-expect-error - Elysia type inference limitation with .derive() in plugins
        async (context: { user: AuthUser; body: any }) => {
          const { user, body } = context;
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
            settings: t.Optional(t.Record(t.String(), t.Any())),
            metadata: t.Optional(t.Record(t.String(), t.Any())),
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
        // @ts-expect-error - Elysia type inference limitation with .derive() in plugins
        async (context: { user: AuthUser; query: any }) => {
          const { user, query } = context;
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
        // @ts-expect-error - Elysia type inference limitation with .derive() in plugins
        async (context: { user: AuthUser; params: any }) => {
          const { user, params } = context;
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
        // @ts-expect-error - Elysia type inference limitation with .derive() in plugins
        async (context: { user: AuthUser; params: any; body: any }) => {
          const { user, params, body } = context;
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
            settings: t.Optional(t.Record(t.String(), t.Any())),
            metadata: t.Optional(t.Record(t.String(), t.Any())),
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
        // @ts-expect-error - Elysia type inference limitation with .derive() in plugins
        async (context: { user: AuthUser; params: any }) => {
          const { user, params } = context;
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
        // @ts-expect-error - Elysia type inference limitation with .derive() in plugins
        async (context: { user: AuthUser; params: any }) => {
          const { user, params } = context;
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
        // @ts-expect-error - Elysia type inference limitation with .derive() in plugins
        async (context: { user: AuthUser; params: any; query: any }) => {
          const { user, params, query } = context;
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
        // @ts-expect-error - Elysia type inference limitation with .derive() in plugins
        async (context: { user: AuthUser; params: any }) => {
          const { user, params } = context;
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
  // All routes in this group require admin role
  // Admin user context is injected by requireAdminGuard
  .group("/admin", (app) =>
    app
      .use(requireAdminGuard)

      // Get all projects (admin only)
      .get(
        "/all",
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
        "/:id",
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
