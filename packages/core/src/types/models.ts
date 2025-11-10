/**
 * Data model classes for the AI Creation System
 * Converted from interfaces to classes for better encapsulation, validation, and methods
 */

import type {
  AssetType,
  WeaponType,
  ArmorSlot,
  BuildingType,
  ToolType,
  ResourceType,
  ConsumableType,
  CreatureType,
} from "./index";
import { Vector3, Quaternion } from "./math";
import type { AssetMetadata } from "./AssetMetadata";

export class MaterialPreset {
  constructor(
    public id: string,
    public name: string,
    public displayName: string,
    public category: string,
    public tier: number,
    public color: string,
    public stylePrompt?: string,
    public description?: string,
  ) {}

  static create(data: {
    id: string;
    name: string;
    displayName: string;
    category: string;
    tier: number;
    color: string;
    stylePrompt?: string;
    description?: string;
  }): MaterialPreset {
    return new MaterialPreset(
      data.id,
      data.name,
      data.displayName,
      data.category,
      data.tier,
      data.color,
      data.stylePrompt,
      data.description,
    );
  }

  get isHighTier(): boolean {
    return this.tier >= 3;
  }

  get hexColor(): string {
    // Ensure color is a valid hex color
    return this.color.startsWith("#") ? this.color : `#${this.color}`;
  }

  clone(): MaterialPreset {
    return new MaterialPreset(
      this.id,
      this.name,
      this.displayName,
      this.category,
      this.tier,
      this.color,
      this.stylePrompt,
      this.description,
    );
  }

  toJSON(): {
    id: string;
    name: string;
    displayName: string;
    category: string;
    tier: number;
    color: string;
    stylePrompt?: string;
    description?: string;
  } {
    return {
      id: this.id,
      name: this.name,
      displayName: this.displayName,
      category: this.category,
      tier: this.tier,
      color: this.color,
      stylePrompt: this.stylePrompt,
      description: this.description,
    };
  }

  static fromJSON(json: {
    id: string;
    name: string;
    displayName: string;
    category: string;
    tier: number;
    color: string;
    stylePrompt?: string;
    description?: string;
  }): MaterialPreset {
    return new MaterialPreset(
      json.id,
      json.name,
      json.displayName,
      json.category,
      json.tier,
      json.color,
      json.stylePrompt,
      json.description,
    );
  }
}

export class GenerationRequest {
  constructor(
    public id: string,
    public name: string,
    public description: string,
    public type: AssetType,
    public subtype?:
      | WeaponType
      | ArmorSlot
      | BuildingType
      | ToolType
      | ResourceType
      | ConsumableType,
    public style:
      | "realistic"
      | "cartoon"
      | "low-poly"
      | "stylized" = "low-poly",
    public metadata: {
      creatureType?: string;
      armorSlot?: string;
      weaponType?: string;
      buildingType?: string;
      materialType?: string;
      [key: string]: string | number | boolean | undefined;
    } = {},
  ) {}

  static create(data: {
    id?: string;
    name: string;
    description: string;
    type: AssetType;
    subtype?:
      | WeaponType
      | ArmorSlot
      | BuildingType
      | ToolType
      | ResourceType
      | ConsumableType;
    style?: "realistic" | "cartoon" | "low-poly" | "stylized";
    metadata?: {
      creatureType?: string;
      armorSlot?: string;
      weaponType?: string;
      buildingType?: string;
      materialType?: string;
      [key: string]: string | number | boolean | undefined;
    };
  }): GenerationRequest {
    return new GenerationRequest(
      data.id || crypto.randomUUID(),
      data.name,
      data.description,
      data.type,
      data.subtype,
      data.style || "low-poly",
      data.metadata || {},
    );
  }

  /**
   * Validate the generation request
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push("Name is required");
    }

    if (!this.description || this.description.trim().length === 0) {
      errors.push("Description is required");
    }

    if (!this.type) {
      errors.push("Type is required");
    }

    // Type-specific validation
    if (this.type === "weapon" && !this.subtype) {
      errors.push("Weapon type must have a subtype");
    }

    if (this.type === "armor" && !this.subtype) {
      errors.push("Armor must have a slot specified");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get a descriptive prompt for AI generation
   */
  get prompt(): string {
    let prompt = `${this.style} ${this.type}`;

    if (this.subtype) {
      prompt += ` (${this.subtype})`;
    }

    prompt += `: ${this.name}`;

    if (this.description) {
      prompt += `. ${this.description}`;
    }

    return prompt;
  }

  /**
   * Check if this request is for a specific asset type
   */
  isType(type: AssetType): boolean {
    return this.type === type;
  }

  /**
   * Get metadata value with type safety
   */
  getMetadata<T = string | number | boolean>(
    key: string,
    defaultValue?: T,
  ): T | undefined {
    return (this.metadata[key] as T) ?? defaultValue;
  }

  /**
   * Set metadata value
   */
  setMetadata(key: string, value: string | number | boolean): void {
    this.metadata[key] = value;
  }

  clone(): GenerationRequest {
    return new GenerationRequest(
      this.id,
      this.name,
      this.description,
      this.type,
      this.subtype,
      this.style,
      { ...this.metadata },
    );
  }

  toJSON(): {
    id: string;
    name: string;
    description: string;
    type: AssetType;
    subtype?:
      | WeaponType
      | ArmorSlot
      | BuildingType
      | ToolType
      | ResourceType
      | ConsumableType;
    style: "realistic" | "cartoon" | "low-poly" | "stylized";
    metadata: {
      creatureType?: string;
      armorSlot?: string;
      weaponType?: string;
      buildingType?: string;
      materialType?: string;
      [key: string]: string | number | boolean | undefined;
    };
  } {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      subtype: this.subtype,
      style: this.style,
      metadata: this.metadata,
    };
  }

  static fromJSON(json: {
    id: string;
    name: string;
    description: string;
    type: AssetType;
    subtype?:
      | WeaponType
      | ArmorSlot
      | BuildingType
      | ToolType
      | ResourceType
      | ConsumableType;
    style?: "realistic" | "cartoon" | "low-poly" | "stylized";
    metadata?: {
      creatureType?: string;
      armorSlot?: string;
      weaponType?: string;
      buildingType?: string;
      materialType?: string;
      [key: string]: string | number | boolean | undefined;
    };
  }): GenerationRequest {
    return new GenerationRequest(
      json.id,
      json.name,
      json.description,
      json.type,
      json.subtype,
      json.style || "low-poly",
      json.metadata || {},
    );
  }
}

/**
 * Result types for generation pipeline
 */

export class ImageGenerationResult {
  constructor(
    public imageUrl: string,
    public prompt: string,
    public metadata: {
      model: string;
      resolution: string;
      quality?: string;
      timestamp: string;
    },
  ) {}

  static create(data: {
    imageUrl: string;
    prompt: string;
    metadata: {
      model: string;
      resolution: string;
      quality?: string;
      timestamp: string;
    };
  }): ImageGenerationResult {
    return new ImageGenerationResult(data.imageUrl, data.prompt, data.metadata);
  }

  get isValid(): boolean {
    return (
      !!this.imageUrl &&
      this.imageUrl.startsWith("http") &&
      !!this.prompt &&
      !!this.metadata.model
    );
  }

  toJSON() {
    return {
      imageUrl: this.imageUrl,
      prompt: this.prompt,
      metadata: this.metadata,
    };
  }

  static fromJSON(json: {
    imageUrl: string;
    prompt: string;
    metadata: {
      model: string;
      resolution: string;
      quality?: string;
      timestamp: string;
    };
  }): ImageGenerationResult {
    return new ImageGenerationResult(json.imageUrl, json.prompt, json.metadata);
  }
}

export class ModelGenerationResult {
  constructor(
    public modelUrl: string,
    public format: "glb" | "fbx" | "obj",
    public polycount: number,
    public textureUrls?: {
      diffuse?: string;
      normal?: string;
      metallic?: string;
      roughness?: string;
    },
    public metadata?: {
      meshyTaskId: string;
      processingTime: number;
    },
  ) {}

  static create(data: {
    modelUrl: string;
    format: "glb" | "fbx" | "obj";
    polycount: number;
    textureUrls?: {
      diffuse?: string;
      normal?: string;
      metallic?: string;
      roughness?: string;
    };
    metadata?: {
      meshyTaskId: string;
      processingTime: number;
    };
  }): ModelGenerationResult {
    return new ModelGenerationResult(
      data.modelUrl,
      data.format,
      data.polycount,
      data.textureUrls,
      data.metadata,
    );
  }

  get hasTextures(): boolean {
    return !!this.textureUrls && Object.keys(this.textureUrls).length > 0;
  }

  get isHighPoly(): boolean {
    return this.polycount > 50000;
  }

  get isLowPoly(): boolean {
    return this.polycount < 10000;
  }

  toJSON() {
    return {
      modelUrl: this.modelUrl,
      format: this.format,
      polycount: this.polycount,
      textureUrls: this.textureUrls,
      metadata: this.metadata,
    };
  }

  static fromJSON(json: {
    modelUrl: string;
    format: "glb" | "fbx" | "obj";
    polycount: number;
    textureUrls?: {
      diffuse?: string;
      normal?: string;
      metallic?: string;
      roughness?: string;
    };
    metadata?: {
      meshyTaskId: string;
      processingTime: number;
    };
  }): ModelGenerationResult {
    return new ModelGenerationResult(
      json.modelUrl,
      json.format,
      json.polycount,
      json.textureUrls,
      json.metadata,
    );
  }
}

export class RemeshResult {
  constructor(
    public modelUrl: string,
    public originalPolycount: number,
    public remeshedPolycount: number,
    public targetPolycount: number,
  ) {}

  static create(data: {
    modelUrl: string;
    originalPolycount: number;
    remeshedPolycount: number;
    targetPolycount: number;
  }): RemeshResult {
    return new RemeshResult(
      data.modelUrl,
      data.originalPolycount,
      data.remeshedPolycount,
      data.targetPolycount,
    );
  }

  get reductionRatio(): number {
    return this.originalPolycount > 0
      ? this.remeshedPolycount / this.originalPolycount
      : 0;
  }

  get reductionPercentage(): number {
    return (1 - this.reductionRatio) * 100;
  }

  get hitTarget(): boolean {
    const tolerance = 0.1; // 10% tolerance
    return (
      Math.abs(this.remeshedPolycount - this.targetPolycount) <=
      this.targetPolycount * tolerance
    );
  }

  toJSON() {
    return {
      modelUrl: this.modelUrl,
      originalPolycount: this.originalPolycount,
      remeshedPolycount: this.remeshedPolycount,
      targetPolycount: this.targetPolycount,
    };
  }

  static fromJSON(json: {
    modelUrl: string;
    originalPolycount: number;
    remeshedPolycount: number;
    targetPolycount: number;
  }): RemeshResult {
    return new RemeshResult(
      json.modelUrl,
      json.originalPolycount,
      json.remeshedPolycount,
      json.targetPolycount,
    );
  }
}

export class HardpointResult {
  constructor(
    public weaponType: WeaponType,
    public primaryGrip: {
      position: Vector3;
      rotation: Quaternion;
      confidence: number;
    },
    public secondaryGrip?: {
      position: Vector3;
      rotation: Quaternion;
      confidence: number;
    },
    public attachmentPoints: Array<{
      name: string;
      position: Vector3;
      rotation: Quaternion;
    }> = [],
  ) {}

  static create(data: {
    weaponType: WeaponType;
    primaryGrip: {
      position: Vector3;
      rotation: Quaternion;
      confidence: number;
    };
    secondaryGrip?: {
      position: Vector3;
      rotation: Quaternion;
      confidence: number;
    };
    attachmentPoints?: Array<{
      name: string;
      position: Vector3;
      rotation: Quaternion;
    }>;
  }): HardpointResult {
    return new HardpointResult(
      data.weaponType,
      data.primaryGrip,
      data.secondaryGrip,
      data.attachmentPoints || [],
    );
  }

  get isTwoHanded(): boolean {
    return !!this.secondaryGrip;
  }

  get hasHighConfidence(): boolean {
    const primaryConfident = this.primaryGrip.confidence >= 0.8;
    const secondaryConfident =
      !this.secondaryGrip || this.secondaryGrip.confidence >= 0.8;
    return primaryConfident && secondaryConfident;
  }

  get gripDistance(): number | null {
    if (!this.secondaryGrip) return null;
    return this.primaryGrip.position.distance(this.secondaryGrip.position);
  }

  toJSON() {
    return {
      weaponType: this.weaponType,
      primaryGrip: {
        position: this.primaryGrip.position.toJSON(),
        rotation: this.primaryGrip.rotation.toJSON(),
        confidence: this.primaryGrip.confidence,
      },
      secondaryGrip: this.secondaryGrip
        ? {
            position: this.secondaryGrip.position.toJSON(),
            rotation: this.secondaryGrip.rotation.toJSON(),
            confidence: this.secondaryGrip.confidence,
          }
        : undefined,
      attachmentPoints: this.attachmentPoints.map((p) => ({
        name: p.name,
        position: p.position.toJSON(),
        rotation: p.rotation.toJSON(),
      })),
    };
  }

  static fromJSON(json: {
    weaponType: WeaponType;
    primaryGrip: {
      position: { x: number; y: number; z: number };
      rotation: { x: number; y: number; z: number; w: number };
      confidence: number;
    };
    secondaryGrip?: {
      position: { x: number; y: number; z: number };
      rotation: { x: number; y: number; z: number; w: number };
      confidence: number;
    };
    attachmentPoints: Array<{
      name: string;
      position: { x: number; y: number; z: number };
      rotation: { x: number; y: number; z: number; w: number };
    }>;
  }): HardpointResult {
    return new HardpointResult(
      json.weaponType,
      {
        position: Vector3.fromJSON(json.primaryGrip.position),
        rotation: Quaternion.fromJSON(json.primaryGrip.rotation),
        confidence: json.primaryGrip.confidence,
      },
      json.secondaryGrip
        ? {
            position: Vector3.fromJSON(json.secondaryGrip.position),
            rotation: Quaternion.fromJSON(json.secondaryGrip.rotation),
            confidence: json.secondaryGrip.confidence,
          }
        : undefined,
      json.attachmentPoints.map((p) => ({
        name: p.name,
        position: Vector3.fromJSON(p.position),
        rotation: Quaternion.fromJSON(p.rotation),
      })),
    );
  }
}

export class ArmorPlacementResult {
  constructor(
    public slot: ArmorSlot,
    public attachmentPoint: Vector3,
    public rotation: Quaternion,
    public scale: Vector3,
    public deformationWeights?: number[],
  ) {}

  static create(data: {
    slot: ArmorSlot;
    attachmentPoint: Vector3;
    rotation: Quaternion;
    scale: Vector3;
    deformationWeights?: number[];
  }): ArmorPlacementResult {
    return new ArmorPlacementResult(
      data.slot,
      data.attachmentPoint,
      data.rotation,
      data.scale,
      data.deformationWeights,
    );
  }

  get hasDeformation(): boolean {
    return !!this.deformationWeights && this.deformationWeights.length > 0;
  }

  get isUniformScale(): boolean {
    return (
      this.scale.x === this.scale.y &&
      this.scale.y === this.scale.z &&
      this.scale.x === this.scale.z
    );
  }

  toJSON() {
    return {
      slot: this.slot,
      attachmentPoint: this.attachmentPoint.toJSON(),
      rotation: this.rotation.toJSON(),
      scale: this.scale.toJSON(),
      deformationWeights: this.deformationWeights,
    };
  }

  static fromJSON(json: {
    slot: ArmorSlot;
    attachmentPoint: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number; w: number };
    scale: { x: number; y: number; z: number };
    deformationWeights?: number[];
  }): ArmorPlacementResult {
    return new ArmorPlacementResult(
      json.slot,
      Vector3.fromJSON(json.attachmentPoint),
      Quaternion.fromJSON(json.rotation),
      Vector3.fromJSON(json.scale),
      json.deformationWeights,
    );
  }
}

export class RiggingResult {
  constructor(
    public rigType: CreatureType,
    public bones: Array<{
      name: string;
      position: Vector3;
      rotation: Quaternion;
      parent?: string;
    }>,
    public animations?: string[],
  ) {}

  static create(data: {
    rigType: CreatureType;
    bones: Array<{
      name: string;
      position: Vector3;
      rotation: Quaternion;
      parent?: string;
    }>;
    animations?: string[];
  }): RiggingResult {
    return new RiggingResult(data.rigType, data.bones, data.animations);
  }

  get boneCount(): number {
    return this.bones.length;
  }

  get hasAnimations(): boolean {
    return !!this.animations && this.animations.length > 0;
  }

  get rootBones(): Array<{
    name: string;
    position: Vector3;
    rotation: Quaternion;
    parent?: string;
  }> {
    return this.bones.filter((bone) => !bone.parent);
  }

  getBoneByName(name: string) {
    return this.bones.find((bone) => bone.name === name);
  }

  getChildBones(parentName: string) {
    return this.bones.filter((bone) => bone.parent === parentName);
  }

  toJSON() {
    return {
      rigType: this.rigType,
      bones: this.bones.map((b) => ({
        name: b.name,
        position: b.position.toJSON(),
        rotation: b.rotation.toJSON(),
        parent: b.parent,
      })),
      animations: this.animations,
    };
  }

  static fromJSON(json: {
    rigType: CreatureType;
    bones: Array<{
      name: string;
      position: { x: number; y: number; z: number };
      rotation: { x: number; y: number; z: number; w: number };
      parent?: string;
    }>;
    animations?: string[];
  }): RiggingResult {
    return new RiggingResult(
      json.rigType,
      json.bones.map((b) => ({
        name: b.name,
        position: Vector3.fromJSON(b.position),
        rotation: Quaternion.fromJSON(b.rotation),
        parent: b.parent,
      })),
      json.animations,
    );
  }
}

export class BuildingAnalysisResult {
  constructor(
    public buildingType: BuildingType,
    public entryPoints: Array<{
      name: string;
      position: Vector3;
      rotation: Quaternion;
      isMain: boolean;
    }>,
    public interiorSpace?: {
      center: Vector3;
      size: Vector3;
    },
    public functionalAreas: Array<{
      name: string;
      type: "counter" | "vault" | "display" | "seating" | "storage";
      position: Vector3;
      size: Vector3;
    }> = [],
    public npcPositions: Array<{
      role: string;
      position: Vector3;
      rotation: Quaternion;
    }> = [],
    public metadata?: {
      floors: number;
      hasBasement: boolean;
      hasRoof: boolean;
    },
  ) {}

  static create(data: {
    buildingType: BuildingType;
    entryPoints: Array<{
      name: string;
      position: Vector3;
      rotation: Quaternion;
      isMain: boolean;
    }>;
    interiorSpace?: {
      center: Vector3;
      size: Vector3;
    };
    functionalAreas?: Array<{
      name: string;
      type: "counter" | "vault" | "display" | "seating" | "storage";
      position: Vector3;
      size: Vector3;
    }>;
    npcPositions?: Array<{
      role: string;
      position: Vector3;
      rotation: Quaternion;
    }>;
    metadata?: {
      floors: number;
      hasBasement: boolean;
      hasRoof: boolean;
    };
  }): BuildingAnalysisResult {
    return new BuildingAnalysisResult(
      data.buildingType,
      data.entryPoints,
      data.interiorSpace,
      data.functionalAreas || [],
      data.npcPositions || [],
      data.metadata,
    );
  }

  get mainEntry() {
    return this.entryPoints.find((e) => e.isMain);
  }

  get hasInterior(): boolean {
    return !!this.interiorSpace;
  }

  get npcCount(): number {
    return this.npcPositions.length;
  }

  get interiorVolume(): number | null {
    if (!this.interiorSpace) return null;
    const { size } = this.interiorSpace;
    return size.x * size.y * size.z;
  }

  toJSON() {
    return {
      buildingType: this.buildingType,
      entryPoints: this.entryPoints.map((e) => ({
        name: e.name,
        position: e.position.toJSON(),
        rotation: e.rotation.toJSON(),
        isMain: e.isMain,
      })),
      interiorSpace: this.interiorSpace
        ? {
            center: this.interiorSpace.center.toJSON(),
            size: this.interiorSpace.size.toJSON(),
          }
        : undefined,
      functionalAreas: this.functionalAreas.map((a) => ({
        name: a.name,
        type: a.type,
        position: a.position.toJSON(),
        size: a.size.toJSON(),
      })),
      npcPositions: this.npcPositions.map((n) => ({
        role: n.role,
        position: n.position.toJSON(),
        rotation: n.rotation.toJSON(),
      })),
      metadata: this.metadata,
    };
  }

  static fromJSON(json: {
    buildingType: BuildingType;
    entryPoints: Array<{
      name: string;
      position: { x: number; y: number; z: number };
      rotation: { x: number; y: number; z: number; w: number };
      isMain: boolean;
    }>;
    interiorSpace?: {
      center: { x: number; y: number; z: number };
      size: { x: number; y: number; z: number };
    };
    functionalAreas: Array<{
      name: string;
      type: "counter" | "vault" | "display" | "seating" | "storage";
      position: { x: number; y: number; z: number };
      size: { x: number; y: number; z: number };
    }>;
    npcPositions: Array<{
      role: string;
      position: { x: number; y: number; z: number };
      rotation: { x: number; y: number; z: number; w: number };
    }>;
    metadata?: {
      floors: number;
      hasBasement: boolean;
      hasRoof: boolean;
    };
  }): BuildingAnalysisResult {
    return new BuildingAnalysisResult(
      json.buildingType,
      json.entryPoints.map((e) => ({
        name: e.name,
        position: Vector3.fromJSON(e.position),
        rotation: Quaternion.fromJSON(e.rotation),
        isMain: e.isMain,
      })),
      json.interiorSpace
        ? {
            center: Vector3.fromJSON(json.interiorSpace.center),
            size: Vector3.fromJSON(json.interiorSpace.size),
          }
        : undefined,
      json.functionalAreas.map((a) => ({
        name: a.name,
        type: a.type,
        position: Vector3.fromJSON(a.position),
        size: Vector3.fromJSON(a.size),
      })),
      json.npcPositions.map((n) => ({
        role: n.role,
        position: Vector3.fromJSON(n.position),
        rotation: Quaternion.fromJSON(n.rotation),
      })),
      json.metadata,
    );
  }
}

export class GenerationStage {
  constructor(
    public stage:
      | "description"
      | "image"
      | "model"
      | "remesh"
      | "analysis"
      | "final",
    public status: "pending" | "processing" | "completed" | "failed",
    public timestamp: Date,
    public output?:
      | ImageGenerationResult
      | ModelGenerationResult
      | RemeshResult
      | HardpointResult
      | ArmorPlacementResult
      | RiggingResult
      | BuildingAnalysisResult
      | { modelUrl: string; metadata: AssetMetadata }
      | string,
    public error?: string,
  ) {}

  static create(data: {
    stage: "description" | "image" | "model" | "remesh" | "analysis" | "final";
    status: "pending" | "processing" | "completed" | "failed";
    timestamp?: Date;
    output?:
      | ImageGenerationResult
      | ModelGenerationResult
      | RemeshResult
      | HardpointResult
      | ArmorPlacementResult
      | RiggingResult
      | BuildingAnalysisResult
      | { modelUrl: string; metadata: AssetMetadata }
      | string;
    error?: string;
  }): GenerationStage {
    return new GenerationStage(
      data.stage,
      data.status,
      data.timestamp || new Date(),
      data.output,
      data.error,
    );
  }

  get isPending(): boolean {
    return this.status === "pending";
  }

  get isProcessing(): boolean {
    return this.status === "processing";
  }

  get isCompleted(): boolean {
    return this.status === "completed";
  }

  get isFailed(): boolean {
    return this.status === "failed";
  }

  get hasOutput(): boolean {
    return !!this.output;
  }

  toJSON() {
    return {
      stage: this.stage,
      status: this.status,
      timestamp: this.timestamp,
      output: this.output,
      error: this.error,
    };
  }

  static fromJSON(json: {
    stage: "description" | "image" | "model" | "remesh" | "analysis" | "final";
    status: "pending" | "processing" | "completed" | "failed";
    timestamp: string | Date;
    output?:
      | ImageGenerationResult
      | ModelGenerationResult
      | RemeshResult
      | HardpointResult
      | ArmorPlacementResult
      | RiggingResult
      | BuildingAnalysisResult
      | { modelUrl: string; metadata: AssetMetadata }
      | string;
    error?: string;
  }): GenerationStage {
    return new GenerationStage(
      json.stage,
      json.status,
      typeof json.timestamp === "string"
        ? new Date(json.timestamp)
        : json.timestamp,
      json.output,
      json.error,
    );
  }
}

export class GenerationResult {
  constructor(
    public id: string,
    public request: GenerationRequest,
    public stages: GenerationStage[],
    public createdAt: Date,
    public updatedAt: Date,
    public imageResult?: ImageGenerationResult,
    public modelResult?: ModelGenerationResult,
    public remeshResult?: RemeshResult,
    public analysisResult?:
      | HardpointResult
      | ArmorPlacementResult
      | RiggingResult
      | BuildingAnalysisResult,
    public finalAsset?: {
      modelUrl: string;
      metadata: ReturnType<GenerationRequest["toJSON"]> & {
        analysisResult?:
          | HardpointResult
          | ArmorPlacementResult
          | RiggingResult
          | BuildingAnalysisResult;
        generatedAt: Date;
        modelPath: string;
      };
    },
  ) {}

  static create(data: {
    id?: string;
    request: GenerationRequest;
    stages?: GenerationStage[];
    createdAt?: Date;
    updatedAt?: Date;
    imageResult?: ImageGenerationResult;
    modelResult?: ModelGenerationResult;
    remeshResult?: RemeshResult;
    analysisResult?:
      | HardpointResult
      | ArmorPlacementResult
      | RiggingResult
      | BuildingAnalysisResult;
    finalAsset?: {
      modelUrl: string;
      metadata: ReturnType<GenerationRequest["toJSON"]> & {
        analysisResult?:
          | HardpointResult
          | ArmorPlacementResult
          | RiggingResult
          | BuildingAnalysisResult;
        generatedAt: Date;
        modelPath: string;
      };
    };
  }): GenerationResult {
    return new GenerationResult(
      data.id || crypto.randomUUID(),
      data.request,
      data.stages || [],
      data.createdAt || new Date(),
      data.updatedAt || new Date(),
      data.imageResult,
      data.modelResult,
      data.remeshResult,
      data.analysisResult,
      data.finalAsset,
    );
  }

  get currentStage(): GenerationStage | undefined {
    return (
      this.stages.find((s) => s.isProcessing) ||
      this.stages[this.stages.length - 1]
    );
  }

  get isComplete(): boolean {
    return this.stages.every((s) => s.isCompleted);
  }

  get hasFailed(): boolean {
    return this.stages.some((s) => s.isFailed);
  }

  get completedStages(): GenerationStage[] {
    return this.stages.filter((s) => s.isCompleted);
  }

  get failedStages(): GenerationStage[] {
    return this.stages.filter((s) => s.isFailed);
  }

  get progressPercentage(): number {
    if (this.stages.length === 0) return 0;
    return (this.completedStages.length / this.stages.length) * 100;
  }

  toJSON() {
    return {
      id: this.id,
      request: this.request.toJSON(),
      stages: this.stages.map((s) => s.toJSON()),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      imageResult: this.imageResult?.toJSON(),
      modelResult: this.modelResult?.toJSON(),
      remeshResult: this.remeshResult?.toJSON(),
      analysisResult: this.analysisResult,
      finalAsset: this.finalAsset,
    };
  }

  static fromJSON(json: {
    id: string;
    request: ReturnType<GenerationRequest["toJSON"]>;
    stages: Array<ReturnType<GenerationStage["toJSON"]>>;
    createdAt: string | Date;
    updatedAt: string | Date;
    imageResult?: ReturnType<ImageGenerationResult["toJSON"]>;
    modelResult?: ReturnType<ModelGenerationResult["toJSON"]>;
    remeshResult?: ReturnType<RemeshResult["toJSON"]>;
    analysisResult?:
      | HardpointResult
      | ArmorPlacementResult
      | RiggingResult
      | BuildingAnalysisResult;
    finalAsset?: {
      modelUrl: string;
      metadata: ReturnType<GenerationRequest["toJSON"]> & {
        analysisResult?:
          | HardpointResult
          | ArmorPlacementResult
          | RiggingResult
          | BuildingAnalysisResult;
        generatedAt: Date;
        modelPath: string;
      };
    };
  }): GenerationResult {
    return new GenerationResult(
      json.id,
      GenerationRequest.fromJSON(json.request),
      json.stages.map((s) => GenerationStage.fromJSON(s)),
      typeof json.createdAt === "string"
        ? new Date(json.createdAt)
        : json.createdAt,
      typeof json.updatedAt === "string"
        ? new Date(json.updatedAt)
        : json.updatedAt,
      json.imageResult
        ? ImageGenerationResult.fromJSON(json.imageResult)
        : undefined,
      json.modelResult
        ? ModelGenerationResult.fromJSON(json.modelResult)
        : undefined,
      json.remeshResult ? RemeshResult.fromJSON(json.remeshResult) : undefined,
      json.analysisResult,
      json.finalAsset,
    );
  }
}
