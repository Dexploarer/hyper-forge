/**
 * Project Routes
 * Manage projects for organizing assets
 */

import { Elysia, t } from "elysia";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/requireAdmin";
import { projectService } from "../services/ProjectService";

export const projectsRoutes = new Elysia({ prefix: "/projects" })
  // Create new project
  .post(
    "/",
    async ({ request, body }) => {
      const authResult = await requireAuth({ request });

      if (authResult instanceof Response) {
        return authResult;
      }

      const { user } = authResult;

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
        description: t.Optional(t.String()),
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
    async ({ request, query }) => {
      const authResult = await requireAuth({ request });

      if (authResult instanceof Response) {
        return authResult;
      }

      const { user } = authResult;
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
    async ({ request, params }) => {
      const authResult = await requireAuth({ request });

      if (authResult instanceof Response) {
        return authResult;
      }

      const { user } = authResult;
      const { id } = params;

      const project = await projectService.getProjectById(id);

      if (!project) {
        return new Response(
          JSON.stringify({
            error: "Project not found",
            message: "The specified project does not exist",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Check ownership (admins can view any project)
      if (project.ownerId !== user.id && user.role !== "admin") {
        return new Response(
          JSON.stringify({
            error: "Forbidden",
            message: "You do not have permission to access this project",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
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
    async ({ request, params, body }) => {
      const authResult = await requireAuth({ request });

      if (authResult instanceof Response) {
        return authResult;
      }

      const { user } = authResult;
      const { id } = params;

      // Check ownership
      const isOwner = await projectService.isOwner(id, user.id);
      const isAdmin = user.role === "admin";

      if (!isOwner && !isAdmin) {
        return new Response(
          JSON.stringify({
            error: "Forbidden",
            message: "You do not have permission to update this project",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      try {
        const updatedProject = await projectService.updateProject(id, body);
        return { success: true, project: updatedProject };
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: "Project not found",
            message: "The specified project does not exist",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
        description: t.Optional(t.String()),
        status: t.Optional(t.String()),
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
    async ({ request, params }) => {
      const authResult = await requireAuth({ request });

      if (authResult instanceof Response) {
        return authResult;
      }

      const { user } = authResult;
      const { id } = params;

      // Check ownership
      const isOwner = await projectService.isOwner(id, user.id);
      const isAdmin = user.role === "admin";

      if (!isOwner && !isAdmin) {
        return new Response(
          JSON.stringify({
            error: "Forbidden",
            message: "You do not have permission to archive this project",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      try {
        const archivedProject = await projectService.archiveProject(id);
        return { success: true, project: archivedProject };
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: "Project not found",
            message: "The specified project does not exist",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
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
    async ({ request, params }) => {
      const authResult = await requireAuth({ request });

      if (authResult instanceof Response) {
        return authResult;
      }

      const { user } = authResult;
      const { id } = params;

      // Check ownership
      const isOwner = await projectService.isOwner(id, user.id);
      const isAdmin = user.role === "admin";

      if (!isOwner && !isAdmin) {
        return new Response(
          JSON.stringify({
            error: "Forbidden",
            message: "You do not have permission to restore this project",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      try {
        const restoredProject = await projectService.restoreProject(id);
        return { success: true, project: restoredProject };
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: "Project not found",
            message: "The specified project does not exist",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
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

  // Delete project (admin only)
  .delete(
    "/:id",
    async ({ request, params }) => {
      const adminResult = await requireAdmin({ request });

      if (adminResult instanceof Response) {
        return adminResult;
      }

      const { id } = params;

      try {
        await projectService.deleteProject(id);
        return { success: true, message: "Project deleted successfully" };
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: "Project not found",
            message: "The specified project does not exist",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
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
  )

  // Get all projects (admin only)
  .get(
    "/admin/all",
    async ({ request, query }) => {
      const adminResult = await requireAdmin({ request });

      if (adminResult instanceof Response) {
        return adminResult;
      }

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
  );
