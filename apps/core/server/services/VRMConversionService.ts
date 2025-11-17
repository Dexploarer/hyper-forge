/**
 * VRM Conversion Service - Server-Side
 * Converts GLB files to VRM 1.0 format using Three.js on Node.js
 *
 * This is a server-side adaptation of the client-side VRMConverter.ts
 * Main differences:
 * - Uses Node.js Buffer instead of browser Blob/FileReader
 * - Uses GLTFLoader for parsing GLB from Buffer
 * - Reuses core conversion logic from client (bone mapping, scale normalization)
 */

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { logger as rootLogger } from "../utils/logger";

const logger = rootLogger.child({ service: "VRMConversion" });

// ==================== Interfaces ====================

export interface VRMConversionOptions {
  avatarName?: string;
  author?: string;
  version?: string;
  licenseUrl?: string;
  commercialUsage?: "personalNonProfit" | "personalProfit" | "corporation";
}

export interface VRMConversionResult {
  vrmBuffer: Buffer;
  boneMappings: Map<string, string>;
  warnings: string[];
  coordinateSystemFixed: boolean;
  metadata: {
    originalSize: number;
    convertedSize: number;
    bonesCount: number;
    processingTimeMs: number;
  };
}

// ==================== Bone Mappings ====================

/**
 * Meshy bone name → VRM HumanoidBone mapping
 * Reused from client-side VRMConverter.ts
 */
const MESHY_TO_VRM_BONE_MAP: Record<string, string> = {
  // Torso
  Hips: "hips",
  Spine: "spine",
  Spine01: "chest",
  Spine02: "upperChest",
  neck: "neck",
  Head: "head",
  // Left Arm
  LeftShoulder: "leftShoulder",
  LeftArm: "leftUpperArm",
  LeftForeArm: "leftLowerArm",
  LeftHand: "leftHand",
  // Right Arm
  RightShoulder: "rightShoulder",
  RightArm: "rightUpperArm",
  RightForeArm: "rightLowerArm",
  RightHand: "rightHand",
  // Left Leg
  LeftUpLeg: "leftUpperLeg",
  LeftLeg: "leftLowerLeg",
  LeftFoot: "leftFoot",
  LeftToe: "leftToes",
  // Right Leg
  RightUpLeg: "rightUpperLeg",
  RightLeg: "rightLowerLeg",
  RightFoot: "rightFoot",
  RightToe: "rightToes",
};

// ==================== VRM Conversion Service ====================

export class VRMConversionService {
  private scene!: THREE.Scene;
  private bones: THREE.Bone[] = [];
  private skinnedMesh!: THREE.SkinnedMesh;
  private boneMappings = new Map<string, string>();
  private warnings: string[] = [];
  private coordinateSystemFixed = false;

  /**
   * Convert GLB buffer to VRM format
   * @param glbBuffer - Input GLB file as Buffer
   * @param options - VRM metadata and conversion options
   * @returns VRM file as Buffer with conversion metadata
   */
  async convertGLBToVRM(
    glbBuffer: Buffer,
    options: VRMConversionOptions = {},
  ): Promise<VRMConversionResult> {
    const startTime = Date.now();
    const originalSize = glbBuffer.length;

    logger.info(
      { originalSizeMB: (originalSize / 1024 / 1024).toFixed(2) },
      "Starting VRM conversion",
    );

    // Reset state
    this.boneMappings.clear();
    this.warnings = [];
    this.coordinateSystemFixed = false;

    // Load GLB using GLTFLoader
    const gltf = await this.loadGLBFromBuffer(glbBuffer);

    // Extract scene
    this.scene = gltf.scene;

    // Find skinned mesh and bones
    this.extractSkeleton();

    // Normalize scale to standard VRM size (1.6-1.8m)
    this.normalizeScale();

    // Map bones to VRM HumanoidBone standard
    this.mapBonesToVRM();

    // Export as VRM GLB
    const vrmBuffer = await this.exportVRM(options);

    const processingTimeMs = Date.now() - startTime;

    logger.info(
      {
        originalSizeMB: (originalSize / 1024 / 1024).toFixed(2),
        convertedSizeMB: (vrmBuffer.length / 1024 / 1024).toFixed(2),
        bonesMapped: this.boneMappings.size,
        warnings: this.warnings.length,
        processingTimeMs,
      },
      "VRM conversion completed",
    );

    return {
      vrmBuffer,
      boneMappings: this.boneMappings,
      warnings: this.warnings,
      coordinateSystemFixed: this.coordinateSystemFixed,
      metadata: {
        originalSize,
        convertedSize: vrmBuffer.length,
        bonesCount: this.bones.length,
        processingTimeMs,
      },
    };
  }

  /**
   * Convert GLB from URL to VRM format
   * @param glbUrl - URL to GLB file
   * @param options - VRM metadata and conversion options
   */
  async convertGLBFromURL(
    glbUrl: string,
    options: VRMConversionOptions = {},
  ): Promise<VRMConversionResult> {
    logger.info({ glbUrl }, "Downloading GLB from URL");

    // Download GLB file
    const response = await fetch(glbUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to download GLB from ${glbUrl}: ${response.statusText}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const glbBuffer = Buffer.from(arrayBuffer);

    logger.info(
      { downloadedSizeMB: (glbBuffer.length / 1024 / 1024).toFixed(2) },
      "GLB downloaded successfully",
    );

    // Convert the downloaded GLB
    return this.convertGLBToVRM(glbBuffer, options);
  }

  /**
   * Load GLB from Buffer using GLTFLoader
   */
  private async loadGLBFromBuffer(glbBuffer: Buffer): Promise<any> {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();

      // GLTFLoader.parse expects ArrayBuffer (not SharedArrayBuffer)
      // Create a new ArrayBuffer from the Buffer
      const arrayBuffer = glbBuffer.buffer.slice(
        glbBuffer.byteOffset,
        glbBuffer.byteOffset + glbBuffer.byteLength,
      ) as ArrayBuffer;

      loader.parse(
        arrayBuffer,
        "", // No path needed for buffer parsing
        (gltf) => resolve(gltf),
        (error) => reject(error),
      );
    });
  }

  /**
   * Extract skeleton from scene
   */
  private extractSkeleton(): void {
    logger.info("Extracting skeleton...");

    // Find first SkinnedMesh
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.SkinnedMesh && !this.skinnedMesh) {
        this.skinnedMesh = obj;
        if (obj.skeleton) {
          this.bones = obj.skeleton.bones;
          logger.info(
            { bonesCount: this.bones.length },
            "Found skeleton with bones",
          );
        }
      }
    });

    if (!this.skinnedMesh) {
      throw new Error("No SkinnedMesh found in GLB file");
    }

    if (this.bones.length === 0) {
      throw new Error("No bones found in skeleton");
    }
  }

  /**
   * Normalize scale to standard VRM size (1.6-1.8 meters)
   * Adapted from client-side VRMConverter
   */
  private normalizeScale(): void {
    logger.info("Normalizing scale...");

    // Find hips and head bones
    const hipsBone = this.findBoneByName("Hips");
    const headBone = this.findBoneByName("Head");

    if (!hipsBone || !headBone) {
      logger.warn("Could not find hips/head bones for scale normalization");
      this.warnings.push("Could not normalize scale - bones not found");
      return;
    }

    // Bake Armature scale if present (Meshy models have 0.01 scale on Armature)
    let armature: THREE.Object3D | null = null;
    this.scene.traverse((obj) => {
      if (obj.name === "Armature" && obj !== this.skinnedMesh) {
        armature = obj;
      }
    });

    // Type guard: ensure armature is THREE.Object3D (not null) and has parent
    if (armature !== null) {
      const armatureObj = armature as THREE.Object3D;
      if (armatureObj.parent) {
        const armatureScale = armatureObj.scale.x;
        if (Math.abs(armatureScale - 1.0) > 0.001) {
          logger.info({ armatureScale }, "Baking Armature scale into skeleton");
          this.bones.forEach((bone) => {
            bone.position.multiplyScalar(armatureScale);
          });
          armatureObj.scale.set(1, 1, 1);
          this.scene.updateMatrixWorld(true);
          if (this.skinnedMesh.skeleton) {
            this.skinnedMesh.skeleton.calculateInverses();
          }
        }
      }
    }

    // Update world matrices
    this.scene.updateMatrixWorld(true);

    // Get world positions
    const hipsPos = new THREE.Vector3();
    const headPos = new THREE.Vector3();
    hipsBone.getWorldPosition(hipsPos);
    headBone.getWorldPosition(headPos);

    // Calculate current height
    const currentHeight = hipsPos.distanceTo(headPos);
    logger.info({ currentHeightM: currentHeight.toFixed(3) }, "Current height");

    // Target height for VRM (1.6 meters)
    const targetHeight = 1.6;
    const scaleFactor = targetHeight / currentHeight;

    // Only scale if significantly off
    if (Math.abs(scaleFactor - 1.0) > 0.1) {
      logger.info({ scaleFactor }, "Applying height normalization");

      // Scale geometry vertices
      if (this.skinnedMesh && this.skinnedMesh.geometry) {
        this.skinnedMesh.geometry.scale(scaleFactor, scaleFactor, scaleFactor);
      }

      // Scale bone positions
      this.bones.forEach((bone) => {
        bone.position.multiplyScalar(scaleFactor);
      });

      // Update world matrices
      this.scene.updateMatrixWorld(true);

      // Recalculate inverse bind matrices
      if (this.skinnedMesh.skeleton) {
        this.skinnedMesh.skeleton.calculateInverses();
      }

      logger.info("Height normalization complete");
    } else {
      logger.info("Scale is already appropriate");
    }
  }

  /**
   * Map bones to VRM HumanoidBone standard
   */
  private mapBonesToVRM(): void {
    logger.info("Mapping bones to VRM HumanoidBone standard...");

    let mappedCount = 0;

    for (const bone of this.bones) {
      const vrmBoneName = MESHY_TO_VRM_BONE_MAP[bone.name];
      if (vrmBoneName) {
        this.boneMappings.set(bone.name, vrmBoneName);
        mappedCount++;
      }
    }

    logger.info(
      { mapped: mappedCount, total: this.bones.length },
      "Bone mapping complete",
    );

    // Verify required bones
    const requiredBones = [
      "hips",
      "spine",
      "head",
      "leftUpperArm",
      "rightUpperArm",
      "leftUpperLeg",
      "rightUpperLeg",
    ];
    const missingRequired: string[] = [];

    for (const requiredBone of requiredBones) {
      const found = Array.from(this.boneMappings.values()).includes(
        requiredBone,
      );
      if (!found) {
        missingRequired.push(requiredBone);
      }
    }

    if (missingRequired.length > 0) {
      this.warnings.push(
        `Missing required bones: ${missingRequired.join(", ")}`,
      );
    }

    // Ensure Hips has local translation (required for Hyperscape)
    this.ensureHipsTranslation();
  }

  /**
   * Ensure Hips bone has local translation
   */
  private ensureHipsTranslation(): void {
    const hipsBone = this.findBoneByName("Hips");
    if (!hipsBone) {
      return;
    }

    const worldPos = new THREE.Vector3();
    hipsBone.getWorldPosition(worldPos);

    const parent = hipsBone.parent;
    if (parent && parent.type !== "Bone") {
      logger.info("Baking Hips world position into local position");
      hipsBone.position.copy(worldPos);
      parent.position.set(0, 0, 0);
      parent.rotation.set(0, 0, 0);
      parent.scale.set(1, 1, 1);
      parent.updateMatrix();
      parent.updateMatrixWorld(true);
      this.scene.updateMatrixWorld(true);

      if (this.skinnedMesh.skeleton) {
        this.skinnedMesh.skeleton.calculateInverses();
      }
    }
  }

  /**
   * Export scene as VRM GLB
   */
  private async exportVRM(options: VRMConversionOptions): Promise<Buffer> {
    logger.info("Exporting VRM GLB...");

    // Ensure bones use TRS (not matrix)
    this.bones.forEach((bone) => {
      bone.matrixAutoUpdate = true;
    });

    const exporter = new GLTFExporter();

    // First export as JSON to get node structure
    const gltfJson: any = await new Promise((resolve, reject) => {
      exporter.parse(
        this.scene,
        (result) => resolve(result),
        (error) => reject(error),
        { binary: false, includeCustomExtensions: true },
      );
    });

    // Convert matrix to TRS in nodes
    if (gltfJson.nodes) {
      gltfJson.nodes.forEach((node: any) => {
        if (node.matrix) {
          const mat = new THREE.Matrix4();
          mat.fromArray(node.matrix);
          const position = new THREE.Vector3();
          const quaternion = new THREE.Quaternion();
          const scale = new THREE.Vector3();
          mat.decompose(position, quaternion, scale);
          node.translation = [position.x, position.y, position.z];
          node.rotation = [
            quaternion.x,
            quaternion.y,
            quaternion.z,
            quaternion.w,
          ];
          node.scale = [scale.x, scale.y, scale.z];
          delete node.matrix;
        }
      });
    }

    // Build node name to index map
    const nodeNameToIndex = new Map<string, number>();
    if (gltfJson.nodes) {
      gltfJson.nodes.forEach((node: any, index: number) => {
        if (node.name) {
          nodeNameToIndex.set(node.name, index);
        }
      });
    }

    // Build humanoid bone mappings with correct node indices
    const humanBones: Record<string, { node: number }> = {};
    for (const [meshyBoneName, vrmBoneName] of this.boneMappings.entries()) {
      const nodeIndex = nodeNameToIndex.get(meshyBoneName);
      if (nodeIndex !== undefined) {
        humanBones[vrmBoneName] = { node: nodeIndex };
      }
    }

    // Create VRM extensions
    const vrmExtension = {
      specVersion: "1.0",
      humanoid: { humanBones },
      meta: {
        name: options.avatarName || "Converted Avatar",
        version: options.version || "1.0",
        metaVersion: "1.0",
        authors: [options.author || "Asset Forge"],
        copyrightInformation: "Converted from GLB",
        contactInformation: "",
        references: [],
        thirdPartyLicenses: "",
        thumbnailImage: -1,
        licenseUrl: options.licenseUrl || "https://vrm.dev/licenses/1.0/",
        avatarPermission: options.commercialUsage || "personalNonProfit",
        allowExcessivelyViolentUsage: false,
        allowExcessivelySexualUsage: false,
        commercialUsage: options.commercialUsage || "personalNonProfit",
        allowPoliticalOrReligiousUsage: false,
        allowAntisocialOrHateUsage: false,
        creditNotation: "required",
        allowRedistribution: false,
        modification: "prohibited",
        otherLicenseUrl: "",
      },
    };

    // Add VRM extensions
    gltfJson.extensionsUsed = ["VRMC_vrm"];
    gltfJson.extensions = { VRMC_vrm: vrmExtension };

    logger.info(
      { humanBonesCount: Object.keys(humanBones).length },
      "Added VRM 1.0 extension",
    );

    // Export as binary to get BIN chunk
    const glbBinary: ArrayBuffer = await new Promise((resolve, reject) => {
      exporter.parse(
        this.scene,
        (result) => {
          if (result instanceof ArrayBuffer) {
            resolve(result);
          } else {
            reject(new Error("Binary export failed"));
          }
        },
        (error) => reject(error),
        { binary: true, includeCustomExtensions: true },
      );
    });

    // Extract BIN chunk from binary GLB
    const glbView = new DataView(glbBinary);
    const jsonChunkLength = glbView.getUint32(12, true);
    const binChunkOffset = 12 + 8 + jsonChunkLength;

    let binChunkData: Uint8Array | null = null;
    if (binChunkOffset < glbBinary.byteLength) {
      const binChunkLength = glbView.getUint32(binChunkOffset, true);
      binChunkData = new Uint8Array(
        glbBinary,
        binChunkOffset + 8,
        binChunkLength,
      );
    }

    // Rebuild GLB with modified JSON and original BIN
    const jsonString = JSON.stringify(gltfJson);
    const jsonBuffer = Buffer.from(jsonString, "utf-8");
    const jsonChunkLength_new = Math.ceil(jsonBuffer.length / 4) * 4;
    const jsonPadding = jsonChunkLength_new - jsonBuffer.length;

    const binChunkLength_new = binChunkData
      ? Math.ceil(binChunkData.length / 4) * 4
      : 0;
    const binPadding = binChunkData
      ? binChunkLength_new - binChunkData.length
      : 0;
    const totalLength =
      12 +
      8 +
      jsonChunkLength_new +
      (binChunkData ? 8 + binChunkLength_new : 0);

    const glb = Buffer.alloc(totalLength);
    const view = new DataView(glb.buffer, glb.byteOffset, glb.byteLength);

    // GLB header
    view.setUint32(0, 0x46546c67, true); // "glTF"
    view.setUint32(4, 2, true); // version 2
    view.setUint32(8, totalLength, true);

    // JSON chunk header
    view.setUint32(12, jsonChunkLength_new, true);
    view.setUint32(16, 0x4e4f534a, true); // "JSON"

    // JSON chunk data
    jsonBuffer.copy(glb, 20);
    for (let i = 0; i < jsonPadding; i++) {
      glb[20 + jsonBuffer.length + i] = 0x20; // space padding
    }

    // BIN chunk
    if (binChunkData) {
      const binOffset = 20 + jsonChunkLength_new;
      view.setUint32(binOffset, binChunkLength_new, true);
      view.setUint32(binOffset + 4, 0x004e4942, true); // "BIN\0"
      Buffer.from(binChunkData).copy(glb, binOffset + 8);
      for (let i = 0; i < binPadding; i++) {
        glb[binOffset + 8 + binChunkData.length + i] = 0x00;
      }
    }

    logger.info(
      { sizeKB: (glb.length / 1024).toFixed(2) },
      "GLB export complete",
    );

    return glb;
  }

  /**
   * Find bone by name
   */
  private findBoneByName(name: string): THREE.Bone | undefined {
    return this.bones.find(
      (b) => b.name === name || b.name.toLowerCase() === name.toLowerCase(),
    );
  }
}
