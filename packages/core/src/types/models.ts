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
} from "./index";

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
