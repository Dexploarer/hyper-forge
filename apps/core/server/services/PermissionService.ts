/**
 * Permission Service
 *
 * Centralized authorization checks for Asset-Forge. This service standardizes
 * permission logic across all routes and services, providing a single source
 * of truth for access control decisions.
 *
 * Phase 3.1 - Production Hardening
 *
 * Instead of scattered checks like `user.role === 'admin'` or `asset.ownerId === user.id`,
 * all authorization decisions go through this service.
 *
 * @example
 * ```typescript
 * // Check if user can view an asset
 * if (!permissionService.canViewAsset(user, asset)) {
 *   throw new ForbiddenError('Access denied');
 * }
 *
 * // Check if user can edit a project
 * if (permissionService.canEditProject(user, project)) {
 *   await projectService.update(project.id, updates);
 * }
 *
 * // Check admin access
 * if (permissionService.hasAdminAccess(user)) {
 *   // Admin-only operation
 * }
 * ```
 */

import type { Asset } from "../db/schema/assets.schema";
import type { Project } from "../db/schema/users.schema";
import { logger } from "../utils/logger";

/**
 * Simplified user interface for permission checks
 * Compatible with both AuthUser (from middleware) and User (from database)
 */
export interface PermissionUser {
  id: string;
  role: string;
}

/**
 * Generic content entity with optional creator tracking
 * Matches NPCs, Quests, Dialogues, Lores, Worlds, Locations, MusicTracks
 */
export interface ContentEntity {
  createdBy?: string | null;
  isPublic?: boolean;
}

export class PermissionService {
  /**
   * Check if user can view an asset
   *
   * Permission rules:
   * - Public assets can be viewed by anyone (including unauthenticated users)
   * - Private assets only by owner or admin
   * - Owner can always view their own assets
   * - Admin can view all assets
   *
   * @param user - Current user (null if unauthenticated)
   * @param asset - Asset to check
   * @returns True if user has view permission
   *
   * @example
   * ```typescript
   * if (!permissionService.canViewAsset(user, asset)) {
   *   throw new ForbiddenError('You cannot view this asset');
   * }
   * ```
   */
  canViewAsset(user: PermissionUser | null, asset: Asset): boolean {
    // Public assets are viewable by everyone
    if (asset.visibility === "public") {
      return true;
    }

    // No user = unauthenticated = cannot view private assets
    if (!user) {
      return false;
    }

    // Admin can view all assets
    if (user.role === "admin") {
      return true;
    }

    // Owner can view their own assets
    if (asset.ownerId === user.id) {
      return true;
    }

    return false;
  }

  /**
   * Check if user can edit an asset
   * - Only owner or admin
   */
  canEditAsset(user: PermissionUser | null, asset: Asset): boolean {
    if (!user) {
      return false;
    }

    if (user.role === "admin") {
      return true;
    }

    return asset.ownerId === user.id;
  }

  /**
   * Check if user can delete an asset
   * - Only owner or admin
   */
  canDeleteAsset(user: PermissionUser | null, asset: Asset): boolean {
    return this.canEditAsset(user, asset);
  }

  /**
   * Check if user can publish an asset to CDN
   * - Only owner or admin
   */
  canPublishAsset(user: PermissionUser | null, asset: Asset): boolean {
    return this.canEditAsset(user, asset);
  }

  /**
   * Check if user can view a project
   * - Owner can always view
   * - Admin can always view
   * - Public projects can be viewed by anyone
   * - Private projects only by owner or admin
   */
  canViewProject(user: PermissionUser | null, project: Project): boolean {
    // Public projects are viewable by everyone
    if (project.isPublic === true) {
      return true;
    }

    // No user = unauthenticated = cannot view private projects
    if (!user) {
      return false;
    }

    // Admin can view all projects
    if (user.role === "admin") {
      return true;
    }

    // Owner can view their own projects
    if (project.ownerId === user.id) {
      return true;
    }

    return false;
  }

  /**
   * Check if user can edit a project
   * - Only owner or admin
   */
  canEditProject(user: PermissionUser | null, project: Project): boolean {
    if (!user) {
      return false;
    }

    if (user.role === "admin") {
      return true;
    }

    return project.ownerId === user.id;
  }

  /**
   * Check if user can delete a project
   * - Only owner or admin
   */
  canDeleteProject(user: PermissionUser | null, project: Project): boolean {
    return this.canEditProject(user, project);
  }

  /**
   * Check if user can archive/restore a project
   * - Only owner or admin
   */
  canArchiveProject(user: PermissionUser | null, project: Project): boolean {
    return this.canEditProject(user, project);
  }

  /**
   * Check if user can view content (NPC, Quest, Lore, etc.)
   * - Public content is viewable by everyone
   * - Private content only by creator or admin
   * - Content without visibility defaults to public
   */
  canViewContent(user: PermissionUser | null, content: ContentEntity): boolean {
    // If content has no isPublic field or is public, anyone can view
    if (content.isPublic === undefined || content.isPublic === true) {
      return true;
    }

    // Private content requires authentication
    if (!user) {
      return false;
    }

    // Admin can view all content
    if (user.role === "admin") {
      return true;
    }

    // Creator can view their own content
    if (content.createdBy && content.createdBy === user.id) {
      return true;
    }

    return false;
  }

  /**
   * Check if user can edit content (NPC, Quest, Lore, etc.)
   * - Only creator or admin
   */
  canEditContent(user: PermissionUser | null, content: ContentEntity): boolean {
    if (!user) {
      return false;
    }

    // Admin can edit all content
    if (user.role === "admin") {
      return true;
    }

    // Creator can edit their own content
    return content.createdBy === user.id;
  }

  /**
   * Check if user can delete content (NPC, Quest, Lore, etc.)
   * - Only creator or admin
   */
  canDeleteContent(
    user: PermissionUser | null,
    content: ContentEntity,
  ): boolean {
    return this.canEditContent(user, content);
  }

  /**
   * Check if user has admin access
   *
   * Admin users have elevated permissions across the entire system.
   *
   * @param user - Current user (null if unauthenticated)
   * @returns True if user is an admin
   *
   * @example
   * ```typescript
   * if (!permissionService.hasAdminAccess(user)) {
   *   throw new ForbiddenError('Admin access required');
   * }
   * ```
   */
  hasAdminAccess(user: PermissionUser | null): boolean {
    return user?.role === "admin";
  }

  /**
   * Check if user can perform bulk operations on assets
   * - Only owners can bulk operate their own assets
   * - Admins can bulk operate any assets
   */
  canBulkOperate(user: PermissionUser | null, assets: Asset[]): boolean {
    if (!user) {
      return false;
    }

    // Admin can bulk operate any assets
    if (user.role === "admin") {
      return true;
    }

    // Owner can only bulk operate their own assets
    return assets.every((asset) => asset.ownerId === user.id);
  }

  /**
   * Check if user can bulk operate on content entities
   * - Only creators can bulk operate their own content
   * - Admins can bulk operate any content
   */
  canBulkOperateContent(
    user: PermissionUser | null,
    content: ContentEntity[],
  ): boolean {
    if (!user) {
      return false;
    }

    // Admin can bulk operate any content
    if (user.role === "admin") {
      return true;
    }

    // Creator can only bulk operate their own content
    return content.every((item) => item.createdBy === user.id);
  }

  /**
   * Check if user is the owner of a resource
   *
   * Generic ownership check that works with both `ownerId` (assets, projects)
   * and `createdBy` (content entities) fields.
   *
   * @param user - Current user (null if unauthenticated)
   * @param resource - Resource with ownerId or createdBy field
   * @returns True if user owns the resource
   *
   * @example
   * ```typescript
   * if (permissionService.isOwner(user, asset)) {
   *   // User owns this asset
   * }
   * ```
   */
  isOwner(
    user: PermissionUser | null,
    resource: { ownerId?: string; createdBy?: string | null },
  ): boolean {
    if (!user) {
      return false;
    }

    // Check ownerId first (for assets, projects)
    if (resource.ownerId) {
      return resource.ownerId === user.id;
    }

    // Check createdBy (for content)
    if (resource.createdBy) {
      return resource.createdBy === user.id;
    }

    return false;
  }

  /**
   * Check if user can modify any resource
   * Combines isOwner and hasAdminAccess checks
   */
  canModify(
    user: PermissionUser | null,
    resource: { ownerId?: string; createdBy?: string | null },
  ): boolean {
    if (!user) {
      return false;
    }

    // Admin can modify anything
    if (user.role === "admin") {
      return true;
    }

    // Owner/creator can modify their own resources
    return this.isOwner(user, resource);
  }
}

// Export singleton instance
export const permissionService = new PermissionService();
