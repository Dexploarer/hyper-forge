/**
 * Relationship Service
 * Manages relationships between game content entities
 */

import { db } from "../db";
import { logger } from '../utils/logger';
import { eq, and, or } from "drizzle-orm";
import type { NewEntityRelationship, EntityRelationship } from "../db/schema";
import { entityRelationships } from "../db/schema";

export type EntityType =
  | "npc"
  | "quest"
  | "lore"
  | "world"
  | "location"
  | "dialogue"
  | "music";

export type RelationshipType =
  | "mentions"
  | "requires"
  | "located_in"
  | "gives_quest"
  | "enemy_of"
  | "ally_of"
  | "plays_in"
  | "theme_for"
  | "related_to"
  | "part_of"
  | "prerequisite_for";

export interface CreateRelationshipParams {
  sourceType: EntityType;
  sourceId: string;
  targetType: EntityType;
  targetId: string;
  relationshipType: RelationshipType;
  strength?: "weak" | "medium" | "strong";
  metadata?: Record<string, any>;
  createdBy?: string;
}

export interface RelationshipWithEntities extends EntityRelationship {
  source?: any;
  target?: any;
}

export class RelationshipService {
  /**
   * Create a new relationship between two entities
   */
  async createRelationship(
    params: CreateRelationshipParams,
  ): Promise<EntityRelationship> {
    const relationship: NewEntityRelationship = {
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      targetType: params.targetType,
      targetId: params.targetId,
      relationshipType: params.relationshipType,
      strength: params.strength || "medium",
      metadata: params.metadata || {},
      createdBy: params.createdBy,
    };

    const [created] = await db
      .insert(entityRelationships)
      .values(relationship)
      .returning();

    console.log(
      `[RelationshipService] Created ${params.relationshipType} relationship: ${params.sourceType}:${params.sourceId} -> ${params.targetType}:${params.targetId}`,
    );

    return created;
  }

  /**
   * Create multiple relationships at once
   * Uses transaction to ensure all relationships are created atomically
   */
  async createRelationships(
    relationshipList: CreateRelationshipParams[],
  ): Promise<EntityRelationship[]> {
    if (relationshipList.length === 0) return [];

    const relationships: NewEntityRelationship[] = relationshipList.map(
      (params) => ({
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        targetType: params.targetType,
        targetId: params.targetId,
        relationshipType: params.relationshipType,
        strength: params.strength || "medium",
        metadata: params.metadata || {},
        createdBy: params.createdBy,
      }),
    );

    const created = await db.transaction(async (tx) => {
      const result = await tx
        .insert(entityRelationships)
        .values(relationships)
        .returning();

      console.log(
        `[RelationshipService] Created ${result.length} relationships`,
      );

      return result;
    });

    return created;
  }

  /**
   * Get all relationships for a specific entity
   */
  async getRelationships(
    entityType: EntityType,
    entityId: string,
    options?: {
      direction?: "outgoing" | "incoming" | "both";
      relationshipType?: RelationshipType;
    },
  ): Promise<EntityRelationship[]> {
    const direction = options?.direction || "both";

    let query;

    if (direction === "outgoing") {
      query = db
        .select()
        .from(entityRelationships)
        .where(
          and(
            eq(entityRelationships.sourceType, entityType),
            eq(entityRelationships.sourceId, entityId),
            options?.relationshipType
              ? eq(
                  entityRelationships.relationshipType,
                  options.relationshipType,
                )
              : undefined,
          ),
        );
    } else if (direction === "incoming") {
      query = db
        .select()
        .from(entityRelationships)
        .where(
          and(
            eq(entityRelationships.targetType, entityType),
            eq(entityRelationships.targetId, entityId),
            options?.relationshipType
              ? eq(
                  entityRelationships.relationshipType,
                  options.relationshipType,
                )
              : undefined,
          ),
        );
    } else {
      // both
      query = db
        .select()
        .from(entityRelationships)
        .where(
          and(
            or(
              and(
                eq(entityRelationships.sourceType, entityType),
                eq(entityRelationships.sourceId, entityId),
              ),
              and(
                eq(entityRelationships.targetType, entityType),
                eq(entityRelationships.targetId, entityId),
              ),
            ),
            options?.relationshipType
              ? eq(
                  entityRelationships.relationshipType,
                  options.relationshipType,
                )
              : undefined,
          ),
        );
    }

    const relationships = await query;

    console.log(
      `[RelationshipService] Found ${relationships.length} relationships for ${entityType}:${entityId}`,
    );

    return relationships;
  }

  /**
   * Get relationship graph for an entity (includes related entities)
   */
  async getRelationshipGraph(
    entityType: EntityType,
    entityId: string,
    options?: {
      depth?: number;
      relationshipTypes?: RelationshipType[];
    },
  ): Promise<{
    entity: { type: EntityType; id: string };
    relationships: EntityRelationship[];
    relatedEntities: Array<{
      type: EntityType;
      id: string;
      relationshipType: RelationshipType;
      strength: string;
    }>;
  }> {
    const depth = options?.depth || 1;
    const relationships = await this.getRelationships(entityType, entityId);

    // Extract unique related entities
    const relatedEntitiesMap = new Map<string, any>();

    for (const rel of relationships) {
      // Check if this entity is source or target
      if (rel.sourceType === entityType && rel.sourceId === entityId) {
        // We are source, add target
        const key = `${rel.targetType}:${rel.targetId}`;
        relatedEntitiesMap.set(key, {
          type: rel.targetType,
          id: rel.targetId,
          relationshipType: rel.relationshipType,
          strength: rel.strength,
        });
      } else {
        // We are target, add source
        const key = `${rel.sourceType}:${rel.sourceId}`;
        relatedEntitiesMap.set(key, {
          type: rel.sourceType,
          id: rel.sourceId,
          relationshipType: rel.relationshipType,
          strength: rel.strength,
        });
      }
    }

    const relatedEntities = Array.from(relatedEntitiesMap.values());

    console.log(
      `[RelationshipService] Built graph for ${entityType}:${entityId} - ${relatedEntities.length} related entities`,
    );

    return {
      entity: { type: entityType, id: entityId },
      relationships,
      relatedEntities,
    };
  }

  /**
   * Delete a specific relationship
   */
  async deleteRelationship(relationshipId: string): Promise<boolean> {
    const [deleted] = await db
      .delete(entityRelationships)
      .where(eq(entityRelationships.id, relationshipId))
      .returning();

    console.log(
      `[RelationshipService] Deleted relationship: ${relationshipId}`,
    );

    return !!deleted;
  }

  /**
   * Delete all relationships for an entity
   */
  async deleteEntityRelationships(
    entityType: EntityType,
    entityId: string,
  ): Promise<number> {
    const deleted = await db
      .delete(entityRelationships)
      .where(
        or(
          and(
            eq(entityRelationships.sourceType, entityType),
            eq(entityRelationships.sourceId, entityId),
          ),
          and(
            eq(entityRelationships.targetType, entityType),
            eq(entityRelationships.targetId, entityId),
          ),
        ),
      )
      .returning();

    console.log(
      `[RelationshipService] Deleted ${deleted.length} relationships for ${entityType}:${entityId}`,
    );

    return deleted.length;
  }

  /**
   * Find entities related by a specific relationship type
   */
  async findRelatedEntities(
    entityType: EntityType,
    entityId: string,
    relationshipType: RelationshipType,
  ): Promise<Array<{ type: EntityType; id: string }>> {
    const relationships = await this.getRelationships(entityType, entityId, {
      relationshipType,
    });

    const relatedEntities: Array<{ type: EntityType; id: string }> = [];

    for (const rel of relationships) {
      if (rel.sourceType === entityType && rel.sourceId === entityId) {
        relatedEntities.push({
          type: rel.targetType as EntityType,
          id: rel.targetId,
        });
      } else {
        relatedEntities.push({
          type: rel.sourceType as EntityType,
          id: rel.sourceId,
        });
      }
    }

    return relatedEntities;
  }

  /**
   * Check if a relationship exists between two entities
   */
  async relationshipExists(
    sourceType: EntityType,
    sourceId: string,
    targetType: EntityType,
    targetId: string,
    relationshipType?: RelationshipType,
  ): Promise<boolean> {
    const query = db
      .select()
      .from(entityRelationships)
      .where(
        and(
          eq(entityRelationships.sourceType, sourceType),
          eq(entityRelationships.sourceId, sourceId),
          eq(entityRelationships.targetType, targetType),
          eq(entityRelationships.targetId, targetId),
          relationshipType
            ? eq(entityRelationships.relationshipType, relationshipType)
            : undefined,
        ),
      )
      .limit(1);

    const [result] = await query;

    return !!result;
  }

  /**
   * Get relationship statistics for an entity
   */
  async getRelationshipStats(
    entityType: EntityType,
    entityId: string,
  ): Promise<{
    total: number;
    byType: Record<string, number>;
    byTargetType: Record<string, number>;
    byStrength: Record<string, number>;
  }> {
    const relationships = await this.getRelationships(entityType, entityId);

    const stats = {
      total: relationships.length,
      byType: {} as Record<string, number>,
      byTargetType: {} as Record<string, number>,
      byStrength: {} as Record<string, number>,
    };

    for (const rel of relationships) {
      // Count by relationship type
      stats.byType[rel.relationshipType] =
        (stats.byType[rel.relationshipType] || 0) + 1;

      // Count by target type
      const targetType =
        rel.sourceType === entityType && rel.sourceId === entityId
          ? rel.targetType
          : rel.sourceType;
      stats.byTargetType[targetType] =
        (stats.byTargetType[targetType] || 0) + 1;

      // Count by strength
      const strength = rel.strength || "medium";
      stats.byStrength[strength] = (stats.byStrength[strength] || 0) + 1;
    }

    return stats;
  }
}
