/**
 * Asset Authorization Middleware
 * Handles visibility and ownership checks for assets
 */

import { assetDatabaseService } from "../services/AssetDatabaseService";
import type { Asset } from "../db/schema";
import type { AuthUser } from "./auth";

/**
 * Check if a user can view an asset
 * Public assets: anyone can view
 * Private assets: only owner and admins
 */
export function canViewAsset(asset: Asset, user?: AuthUser): boolean {
  // Public assets are viewable by everyone
  if (asset.visibility === "public") {
    return true;
  }

  // No user context = unauthenticated = cannot view private assets
  if (!user) {
    return false;
  }

  // Owner can always view their own assets
  if (asset.ownerId === user.id) {
    return true;
  }

  // Admins can view all assets
  if (user.role === "admin") {
    return true;
  }

  return false;
}

/**
 * Check if a user can modify an asset (edit, delete)
 * Only owner or admin
 */
export function canModifyAsset(asset: Asset, user?: AuthUser): boolean {
  // Must be authenticated
  if (!user) {
    return false;
  }

  // Owner can modify
  if (asset.ownerId === user.id) {
    return true;
  }

  // Admins can modify any asset
  if (user.role === "admin") {
    return true;
  }

  return false;
}

/**
 * Check if a user can publish an asset to CDN
 * Only owner or admin
 */
export function canPublishAsset(asset: Asset, user?: AuthUser): boolean {
  return canModifyAsset(asset, user);
}

/**
 * Get asset from database by asset ID (directory name)
 * Returns null if not found
 */
export async function getAssetFromPath(assetId: string): Promise<Asset | null> {
  try {
    return await assetDatabaseService.getAssetWithOwner(assetId);
  } catch (error) {
    console.error(`[AssetAuth] Failed to get asset ${assetId}:`, error);
    return null;
  }
}

/**
 * Extract asset ID from file path
 * Examples:
 *   "sword-base/model.glb" -> "sword-base"
 *   "bow-steel/concept-art.png" -> "bow-steel"
 */
export function extractAssetIdFromPath(filePath: string): string | null {
  const segments = filePath.split("/").filter((s) => s.length > 0);
  if (segments.length === 0) {
    return null;
  }
  return segments[0];
}
