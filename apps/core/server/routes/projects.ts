/**
 * Project Routes
 * Manage projects for organizing assets
 *
 * SINGLE-TEAM APP: No access control - everyone can access all projects.
 * Auth is optional and used only for tracking who performed actions.
 */

import { Elysia, t } from "elysia";
import { authPlugin } from "../plugins/auth.plugin";
import { projectService } from "../services/ProjectService";
import { NotFoundError } from "../errors";
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
      .use(authPlugin)
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
            user?: AuthUser;
          };
          const { id } = params;

          const project = await projectService.getProjectById(id);

          if (!project) {
            throw new NotFoundError("Project", id, { userId: user?.id });
          }

          // Single-team app: No permission checks - everyone can view all projects
          logger.info(
            { projectId: id, userId: user?.id || "anonymous" },
            "Fetching project",
          );

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
              "Get a specific project by ID. Auth optional - single-team app.",
            security: [{ BearerAuth: [] }],
          },
        },
      )

      // Update project
      .patch(
        "/:id",
        async (context) => {
          const { user, params, body } = context as typeof context & {
            user?: AuthUser;
          };
          const { id } = params;

          // Check if project exists
          const project = await projectService.getProjectById(id);
          if (!project) {
            throw new NotFoundError("Project", id, { userId: user?.id });
          }

          // Single-team app: No permission checks - anyone can update any project
          logger.info(
            { projectId: id, userId: user?.id || "anonymous" },
            "Updating project",
          );

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
              "Update project details. Auth optional - single-team app.",
            security: [{ BearerAuth: [] }],
          },
        },
      )

      // Archive project
      .post(
        "/:id/archive",
        async (context) => {
          const { user, params } = context as typeof context & {
            user?: AuthUser;
          };
          const { id } = params;

          // Check if project exists
          const project = await projectService.getProjectById(id);
          if (!project) {
            throw new NotFoundError("Project", id, { userId: user?.id });
          }

          // Single-team app: No permission checks - anyone can archive any project
          logger.info(
            { projectId: id, userId: user?.id || "anonymous" },
            "Archiving project",
          );

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
              "Archive a project (soft delete). Auth optional - single-team app.",
            security: [{ BearerAuth: [] }],
          },
        },
      )

      // Restore archived project
      .post(
        "/:id/restore",
        async (context) => {
          const { user, params } = context as typeof context & {
            user?: AuthUser;
          };
          const { id } = params;

          // Check if project exists
          const project = await projectService.getProjectById(id);
          if (!project) {
            throw new NotFoundError("Project", id, { userId: user?.id });
          }

          // Single-team app: No permission checks - anyone can restore any project
          logger.info(
            { projectId: id, userId: user?.id || "anonymous" },
            "Restoring project",
          );

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
              "Restore an archived project. Auth optional - single-team app.",
            security: [{ BearerAuth: [] }],
          },
        },
      )

      // Get project assets
      .get(
        "/:id/assets",
        async (context) => {
          const { user, params, query } = context as typeof context & {
            user?: AuthUser;
          };
          const { id } = params;

          // Check if project exists
          const project = await projectService.getProjectById(id);
          if (!project) {
            throw new NotFoundError("Project", id, { userId: user?.id });
          }

          // Single-team app: No permission checks - anyone can view project assets
          logger.info(
            { projectId: id, userId: user?.id || "anonymous" },
            "Fetching project assets",
          );

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
              "Get all assets belonging to a project with optional filtering by type and status. Auth optional - single-team app.",
            security: [{ BearerAuth: [] }],
          },
        },
      )

      // Get project statistics
      .get(
        "/:id/stats",
        async (context) => {
          const { user, params } = context as typeof context & {
            user?: AuthUser;
          };
          const { id } = params;

          // Check if project exists
          const project = await projectService.getProjectById(id);
          if (!project) {
            throw new NotFoundError("Project", id, { userId: user?.id });
          }

          // Single-team app: No permission checks - anyone can view project stats
          logger.info(
            { projectId: id, userId: user?.id || "anonymous" },
            "Fetching project statistics",
          );

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
              "Get project statistics including asset count, breakdown by type, total size, and timestamps. Auth optional - single-team app.",
            security: [{ BearerAuth: [] }],
          },
        },
      ),
  )

  // ==================== ADMIN/SYSTEM ROUTES (Open Access) ====================
  // Single-team app: No admin restriction - these are available to everyone
  .group("", (app) =>
    app
      .use(authPlugin)
      // Get all projects
      .get(
        "/admin/all",
        async ({ user, query }) => {
          const includeArchived = query.includeArchived === "true";
          const projects = await projectService.getAllProjects(includeArchived);

          logger.info(
            { userId: (user as AuthUser | undefined)?.id || "anonymous" },
            "Fetching all projects",
          );

          return { success: true, projects };
        },
        {
          query: t.Object({
            includeArchived: t.Optional(t.String()),
          }),
          detail: {
            tags: ["Projects"],
            summary: "Get all projects",
            description:
              "Get all projects in the system. Auth optional - single-team app.",
            security: [{ BearerAuth: [] }],
          },
        },
      )

      // Delete project permanently
      .delete(
        "/admin/:id",
        async ({ user, params }) => {
          const { id } = params;

          logger.info(
            {
              projectId: id,
              userId: (user as AuthUser | undefined)?.id || "anonymous",
            },
            "Permanently deleting project",
          );

          await projectService.deleteProject(id);
          return { success: true, message: "Project deleted successfully" };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          detail: {
            tags: ["Projects"],
            summary: "Delete project permanently",
            description:
              "Permanently delete a project. Auth optional - single-team app.",
            security: [{ BearerAuth: [] }],
          },
        },
      ),
  );
