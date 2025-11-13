/**
 * CDN Metadata Extractor
 * Extracts and infers asset metadata from CDN webhook payloads
 * Generates default metadata when information is missing
 */

import type { NewAsset } from "../db/schema";

export interface WebhookFile {
  name: string;
  size: number;
  relativePath: string;
  cdnUrl: string;
}

export interface WebhookPayload {
  assetId: string;
  directory: string; // "models" | "emotes" | "music"
  files: WebhookFile[];
  uploadedAt: string;
  uploadedBy: string | null;
}

export interface ExtractedMetadata {
  assetId: string;
  name: string;
  description: string;
  type: string;
  subtype: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  thumbnailPath: string | null;
  conceptArtPath: string | null;
  cdnUrl: string | null;
  cdnThumbnailUrl: string | null;
  cdnConceptArtUrl: string | null;
  cdnFiles: string[];
  visibility: "public" | "private";
  status: "completed" | "draft";
  workflow: string;
}

/**
 * Infer asset type from CDN directory
 * Maps CDN directory structure to asset types
 */
export function inferAssetType(directory: string): {
  type: string;
  subtype: string;
} {
  switch (directory) {
    case "models":
      return { type: "item", subtype: "unknown" };
    case "emotes":
      return { type: "animation", subtype: "emote" };
    case "music":
      return { type: "audio", subtype: "music" };
    default:
      return { type: "unknown", subtype: "unknown" };
  }
}

/**
 * Extract asset metadata from CDN webhook payload
 * Infers metadata from file structure and names
 */
export function extractAssetMetadata(
  payload: WebhookPayload,
): ExtractedMetadata {
  const { assetId, directory, files } = payload;

  // Infer type from directory
  const { type, subtype } = inferAssetType(directory);

  // Find specific file types
  const glbFile = files.find((f) => f.name.endsWith(".glb"));
  const thumbnailFile = files.find(
    (f) =>
      f.name.includes("thumbnail") ||
      f.name.endsWith(".png") ||
      f.name.endsWith(".jpg") ||
      f.name.endsWith(".jpeg"),
  );
  const conceptArtFile = files.find(
    (f) =>
      f.name.includes("concept") &&
      (f.name.endsWith(".png") || f.name.endsWith(".jpg")),
  );
  const metadataFile = files.find((f) => f.name === "metadata.json");

  // Primary file path (GLB for models, first file otherwise)
  const primaryFile = glbFile || files[0];

  // Generate human-readable name from asset ID
  // Convert "steel-sword-123" → "Steel Sword"
  const humanName = assetId
    .split("-")
    .filter((part) => !/^\d+$/.test(part)) // Remove trailing numbers
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    assetId,
    name: humanName || assetId,
    description: `Uploaded via CDN on ${new Date(payload.uploadedAt).toLocaleDateString()}`,
    type,
    subtype,
    filePath: primaryFile.relativePath,
    fileSize: primaryFile.size,
    fileType: primaryFile.name.split(".").pop() || "unknown",
    thumbnailPath: thumbnailFile?.relativePath || null,
    conceptArtPath: conceptArtFile?.relativePath || null,
    cdnUrl: primaryFile.cdnUrl,
    cdnThumbnailUrl: thumbnailFile?.cdnUrl || null,
    cdnConceptArtUrl: conceptArtFile?.cdnUrl || null,
    cdnFiles: files.map((f) => f.cdnUrl),
    visibility: "public", // Default to public for CDN uploads
    status: "completed",
    workflow: "manual-cdn-upload",
  };
}

/**
 * Convert extracted metadata to NewAsset format for database insertion
 * @param metadata - Extracted metadata from webhook
 * @param ownerId - User ID to assign ownership to (system user)
 * @returns NewAsset object ready for database insertion
 */
export function toNewAsset(
  metadata: ExtractedMetadata,
  ownerId: string,
): NewAsset {
  return {
    name: metadata.name,
    description: metadata.description,
    type: metadata.type,
    subtype: metadata.subtype,
    category: metadata.subtype,
    ownerId,
    projectId: null,
    gameId: null,
    filePath: metadata.filePath,
    fileSize: metadata.fileSize,
    fileType: metadata.fileType,
    thumbnailPath: metadata.thumbnailPath,
    conceptArtPath: metadata.conceptArtPath,
    hasConceptArt: !!metadata.conceptArtPath,
    riggedModelPath: null,
    prompt: null,
    detailedPrompt: null,
    negativePrompt: null,
    modelUsed: null,
    generationParams: {
      workflow: metadata.workflow,
      source: "cdn-upload",
      uploadedAt: new Date().toISOString(),
    },
    workflow: metadata.workflow,
    meshyTaskId: null,
    generatedAt: new Date(),
    tags: [],
    metadata: {},
    version: 1,
    parentAssetId: null,
    isBaseModel: false,
    isVariant: false,
    parentBaseModel: null,
    variants: [],
    variantCount: 0,
    lastVariantGenerated: null,
    status: metadata.status,
    visibility: metadata.visibility,
    exportedToRepo: null,
    manifestPath: null,
    cdnUrl: metadata.cdnUrl,
    cdnThumbnailUrl: metadata.cdnThumbnailUrl,
    cdnConceptArtUrl: metadata.cdnConceptArtUrl,
    cdnFiles: metadata.cdnFiles,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date(),
  };
}
