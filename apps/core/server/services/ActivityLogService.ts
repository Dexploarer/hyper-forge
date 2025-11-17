/**
 * Activity Log Service
 * Centralized service for logging user activities across the application
 */

import { db, activityLog } from "../db";
import type { NewActivityLog } from "../db/schema/users.schema";
import { logger } from "../utils/logger";

export class ActivityLogService {
  /**
   * Log a user activity
   */
  static async log(params: {
    userId: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    details?: Record<string, any>;
    ipAddress?: string | null;
    userAgent?: string | null;
    request?: Request;
  }): Promise<void> {
    try {
      // Extract IP and user agent from request if provided
      let ipAddress = params.ipAddress;
      let userAgent = params.userAgent;

      if (params.request && !ipAddress) {
        ipAddress =
          params.request.headers.get("x-forwarded-for")?.split(",")[0] ||
          params.request.headers.get("x-real-ip") ||
          null;
      }

      if (params.request && !userAgent) {
        userAgent = params.request.headers.get("user-agent") || null;
      }

      const logEntry: NewActivityLog = {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        details: params.details || {},
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      };

      await db.insert(activityLog).values(logEntry);
    } catch (error) {
      // Don't throw - logging should never break the app
      logger.error(
        { err: error, params },
        "[ActivityLogService] Failed to log activity:",
      );
    }
  }

  /**
   * Log user login
   */
  static async logLogin(params: {
    userId: string;
    method: string;
    request?: Request;
  }): Promise<void> {
    await this.log({
      userId: params.userId,
      action: "user_login",
      entityType: "user",
      entityId: params.userId,
      details: {
        authMethod: params.method,
      },
      request: params.request,
    });
  }

  /**
   * Log asset creation
   */
  static async logAssetCreated(params: {
    userId: string | null;
    assetId: string;
    assetName: string;
    assetType: string;
    request?: Request;
  }): Promise<void> {
    await this.log({
      userId: params.userId,
      action: "asset_created",
      entityType: "asset",
      entityId: params.assetId,
      details: {
        assetName: params.assetName,
        assetType: params.assetType,
      },
      request: params.request,
    });
  }

  /**
   * Log asset deletion
   */
  static async logAssetDeleted(params: {
    userId: string | null;
    assetId: string;
    assetName: string;
    assetType: string;
    request?: Request;
  }): Promise<void> {
    await this.log({
      userId: params.userId,
      action: "asset_deleted",
      entityType: "asset",
      entityId: params.assetId,
      details: {
        assetName: params.assetName,
        assetType: params.assetType,
      },
      request: params.request,
    });
  }

  /**
   * Log generation pipeline start
   */
  static async logGenerationStarted(params: {
    userId: string | null;
    pipelineId: string;
    generationType: string;
    assetName: string;
    request?: Request;
  }): Promise<void> {
    await this.log({
      userId: params.userId,
      action: "generation_started",
      entityType: "pipeline",
      entityId: params.pipelineId,
      details: {
        generationType: params.generationType,
        assetName: params.assetName,
      },
      request: params.request,
    });
  }

  /**
   * Log generation pipeline completion
   */
  static async logGenerationCompleted(params: {
    userId: string | null;
    pipelineId: string;
    success: boolean;
    request?: Request;
  }): Promise<void> {
    await this.log({
      userId: params.userId,
      action: params.success ? "generation_completed" : "generation_failed",
      entityType: "pipeline",
      entityId: params.pipelineId,
      details: {
        success: params.success,
      },
      request: params.request,
    });
  }

  /**
   * Log profile update
   */
  static async logProfileUpdated(params: {
    userId: string;
    changes: string[];
    request?: Request;
  }): Promise<void> {
    await this.log({
      userId: params.userId,
      action: "profile_updated",
      entityType: "user",
      entityId: params.userId,
      details: {
        updatedFields: params.changes,
      },
      request: params.request,
    });
  }

  /**
   * Log content creation (quest, lore, etc.)
   */
  static async logContentCreated(params: {
    userId: string | null;
    contentType: string;
    contentId: string;
    title: string;
    request?: Request;
  }): Promise<void> {
    await this.log({
      userId: params.userId,
      action: "content_created",
      entityType: params.contentType,
      entityId: params.contentId,
      details: {
        contentType: params.contentType,
        title: params.title,
      },
      request: params.request,
    });
  }

  /**
   * Log content deletion
   */
  static async logContentDeleted(params: {
    userId: string | null;
    contentType: string;
    contentId: string;
    title: string;
    request?: Request;
  }): Promise<void> {
    await this.log({
      userId: params.userId,
      action: "content_deleted",
      entityType: params.contentType,
      entityId: params.contentId,
      details: {
        contentType: params.contentType,
        title: params.title,
      },
      request: params.request,
    });
  }

  /**
   * Log API key update
   */
  static async logApiKeyUpdated(params: {
    userId: string;
    keyType: string;
    action: "added" | "updated" | "removed";
    request?: Request;
  }): Promise<void> {
    await this.log({
      userId: params.userId,
      action: "api_key_updated",
      entityType: "user",
      entityId: params.userId,
      details: {
        keyType: params.keyType,
        updateAction: params.action,
      },
      request: params.request,
    });
  }
}
