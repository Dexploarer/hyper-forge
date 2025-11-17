/**
 * Seed Data Routes
 * API endpoints for generating interconnected seed data
 */

import { Elysia, t } from "elysia";
import { logger } from "../utils/logger";
import { SeedDataService } from "../services/SeedDataService";
import { RelationshipService } from "../services/RelationshipService";
import { db } from "../db";
import {
  npcs,
  quests,
  lores,
  worlds,
  locations,
  musicTracks,
  type NewNPC,
  type NewQuest,
  type NewLore,
  type NewWorld,
  type NewLocation,
  type NewMusicTrack,
} from "../db/schema";

// Initialize services once at module level
const seedDataService = new SeedDataService();
const relationshipService = new RelationshipService();

export const seedDataRoutes = new Elysia({
  prefix: "/api/seed-data",
  name: "seed-data",
})
  // Generate complete world with all linked content
  .post(
    "/generate-world",
    async ({ body }) => {
      const { theme, genre, scale, quality, userId } = body;

      logger.info(
        { context: "SeedData", scale, genre, theme },
        "Generating world",
      );

      // Generate the interconnected world data
      const { seedData } = await seedDataService.generateSeedWorld({
        theme,
        genre,
        scale,
        quality,
      });

      // Save world
      const [createdWorld] = await db
        .insert(worlds)
        .values({
          name: seedData.world.name,
          description: seedData.world.description,
          genre: seedData.world.genre,
          data: seedData.world.data,
          tags: seedData.world.tags,
          createdBy: userId,
        } as NewWorld)
        .returning();

      logger.info(
        { context: "SeedData" },
        "Created world: ${createdWorld.name}",
      );

      // Save locations
      const locationMap = new Map<string, string>(); // name -> id
      for (const loc of seedData.locations) {
        const [createdLocation] = await db
          .insert(locations)
          .values({
            name: loc.name,
            type: loc.type,
            worldId: createdWorld.id,
            data: loc.data,
            tags: loc.tags,
            createdBy: userId,
          } as NewLocation)
          .returning();

        locationMap.set(loc.name, createdLocation.id);

        // Create world-location relationship
        await relationshipService.createRelationship({
          sourceType: "location",
          sourceId: createdLocation.id,
          targetType: "world",
          targetId: createdWorld.id,
          relationshipType: "part_of",
          strength: "strong",
          createdBy: userId,
        });
      }

      logger.info(
        { context: "SeedData", count: locationMap.size },
        "Created locations",
      );

      // Save NPCs
      const npcMap = new Map<string, string>(); // name -> id
      for (const npcData of seedData.npcs) {
        const [createdNPC] = await db
          .insert(npcs)
          .values({
            name: npcData.name,
            archetype: npcData.archetype,
            data: npcData,
            generationParams: {
              archetype: npcData.archetype,
              locationName: npcData.locationName,
            },
            tags: [npcData.archetype, npcData.locationName],
            createdBy: userId,
          } as NewNPC)
          .returning();

        npcMap.set(npcData.name, createdNPC.id);

        // Create NPC-location relationship
        const locationId = locationMap.get(npcData.locationName);
        if (locationId) {
          await relationshipService.createRelationship({
            sourceType: "npc",
            sourceId: createdNPC.id,
            targetType: "location",
            targetId: locationId,
            relationshipType: "located_in",
            strength: "strong",
            createdBy: userId,
          });
        }
      }

      logger.info({ context: "SeedData" }, "Created ${npcMap.size} NPCs");

      // Save quests
      const questMap = new Map<string, string>(); // title -> id
      for (const questData of seedData.quests) {
        const [createdQuest] = await db
          .insert(quests)
          .values({
            title: questData.title,
            questType: questData.questType,
            difficulty: questData.difficulty,
            data: questData,
            generationParams: {
              questType: questData.questType,
              difficulty: questData.difficulty,
            },
            tags: [questData.questType, questData.difficulty],
            createdBy: userId,
          } as NewQuest)
          .returning();

        questMap.set(questData.title, createdQuest.id);

        // Create quest-location relationship
        const locationId = locationMap.get(questData.location);
        if (locationId) {
          await relationshipService.createRelationship({
            sourceType: "quest",
            sourceId: createdQuest.id,
            targetType: "location",
            targetId: locationId,
            relationshipType: "located_in",
            strength: "strong",
            createdBy: userId,
          });
        }

        // Create quest-NPC relationships
        for (const npcName of questData.npcs) {
          const npcId = npcMap.get(npcName);
          if (npcId) {
            await relationshipService.createRelationship({
              sourceType: "npc",
              sourceId: npcId,
              targetType: "quest",
              targetId: createdQuest.id,
              relationshipType: "gives_quest",
              strength: "strong",
              createdBy: userId,
            });
          }
        }
      }

      logger.info({ context: "SeedData" }, "Created ${questMap.size} quests");

      // Save lore
      const loreMap = new Map<string, string>(); // title -> id
      for (const loreData of seedData.lore) {
        const [createdLore] = await db
          .insert(lores)
          .values({
            title: loreData.title,
            category: loreData.category,
            summary: loreData.summary,
            data: loreData,
            generationParams: {
              category: loreData.category,
            },
            tags: [loreData.category, ...(loreData.relatedTopics || [])],
            createdBy: userId,
          } as NewLore)
          .returning();

        loreMap.set(loreData.title, createdLore.id);

        // Create lore-world relationship
        await relationshipService.createRelationship({
          sourceType: "lore",
          sourceId: createdLore.id,
          targetType: "world",
          targetId: createdWorld.id,
          relationshipType: "part_of",
          strength: "medium",
          createdBy: userId,
        });

        // Create lore-NPC relationships (if characters mentioned)
        if (loreData.characters) {
          for (const characterName of loreData.characters) {
            const npcId = npcMap.get(characterName);
            if (npcId) {
              await relationshipService.createRelationship({
                sourceType: "lore",
                sourceId: createdLore.id,
                targetType: "npc",
                targetId: npcId,
                relationshipType: "mentions",
                strength: "medium",
                createdBy: userId,
              });
            }
          }
        }
      }

      logger.info(
        { context: "SeedData" },
        "Created ${loreMap.size} lore entries",
      );

      // Save music
      const musicMap = new Map<string, string>(); // title -> id
      for (const musicData of seedData.music) {
        const [createdMusic] = await db
          .insert(musicTracks)
          .values({
            title: musicData.title,
            mood: musicData.mood,
            data: musicData.data,
            tags: musicData.tags,
            createdBy: userId,
          } as NewMusicTrack)
          .returning();

        musicMap.set(musicData.title, createdMusic.id);

        // Create music-context relationships
        let targetId: string | undefined;
        let targetType: "location" | "quest" | "npc" | undefined;

        if (musicData.contextType === "location") {
          targetId = locationMap.get(musicData.contextName);
          targetType = "location";
        } else if (musicData.contextType === "quest") {
          targetId = questMap.get(musicData.contextName);
          targetType = "quest";
        } else if (musicData.contextType === "npc") {
          targetId = npcMap.get(musicData.contextName);
          targetType = "npc";
        }

        if (targetId && targetType) {
          await relationshipService.createRelationship({
            sourceType: "music",
            sourceId: createdMusic.id,
            targetType,
            targetId,
            relationshipType: "theme_for",
            strength: "strong",
            createdBy: userId,
          });
        }
      }

      logger.info(
        { context: "SeedData" },
        "Created ${musicMap.size} music tracks",
      );

      // Create additional relationships from the relationships array
      for (const rel of seedData.relationships) {
        let sourceId: string | undefined;
        let targetId: string | undefined;

        // Find source ID
        if (rel.sourceType === "npc") sourceId = npcMap.get(rel.sourceName);
        else if (rel.sourceType === "quest")
          sourceId = questMap.get(rel.sourceName);
        else if (rel.sourceType === "lore")
          sourceId = loreMap.get(rel.sourceName);
        else if (rel.sourceType === "location")
          sourceId = locationMap.get(rel.sourceName);
        else if (rel.sourceType === "music")
          sourceId = musicMap.get(rel.sourceName);

        // Find target ID
        if (rel.targetType === "npc") targetId = npcMap.get(rel.targetName);
        else if (rel.targetType === "quest")
          targetId = questMap.get(rel.targetName);
        else if (rel.targetType === "lore")
          targetId = loreMap.get(rel.targetName);
        else if (rel.targetType === "location")
          targetId = locationMap.get(rel.targetName);
        else if (rel.targetType === "music")
          targetId = musicMap.get(rel.targetName);

        if (sourceId && targetId) {
          // Check if relationship already exists to avoid duplicates
          const exists = await relationshipService.relationshipExists(
            rel.sourceType as any,
            sourceId,
            rel.targetType as any,
            targetId,
            rel.relationshipType as any,
          );

          if (!exists) {
            await relationshipService.createRelationship({
              sourceType: rel.sourceType as any,
              sourceId,
              targetType: rel.targetType as any,
              targetId,
              relationshipType: rel.relationshipType as any,
              strength: rel.strength,
              metadata: rel.metadata,
              createdBy: userId,
            });
          }
        }
      }

      logger.info(
        { context: "SeedData" },
        "Created all relationships from seed data",
      );

      return {
        success: true,
        world: createdWorld,
        counts: {
          locations: locationMap.size,
          npcs: npcMap.size,
          quests: questMap.size,
          lore: loreMap.size,
          music: musicMap.size,
          relationships: seedData.relationships.length,
        },
        message: `Generated ${seedData.world.name} with all interconnected content`,
      };
    },
    {
      body: t.Object({
        theme: t.String({ minLength: 1 }),
        genre: t.String({ minLength: 1 }),
        scale: t.Union([
          t.Literal("small"),
          t.Literal("medium"),
          t.Literal("large"),
        ]),
        quality: t.Optional(
          t.Union([
            t.Literal("quality"),
            t.Literal("speed"),
            t.Literal("balanced"),
          ]),
        ),
        userId: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Seed Data"],
        summary: "Generate complete interconnected world",
        description:
          "Generates a complete game world with NPCs, quests, lore, locations, music, and relationships all linked together",
      },
    },
  )

  // Get relationship graph for any entity
  .get(
    "/relationships/:entityType/:entityId",
    async ({ params }) => {
      const { entityType, entityId } = params;

      const graph = await relationshipService.getRelationshipGraph(
        entityType as any,
        entityId,
      );

      return graph;
    },
    {
      params: t.Object({
        entityType: t.String(),
        entityId: t.String(),
      }),
      detail: {
        tags: ["Relationships"],
        summary: "Get relationship graph for entity",
        description:
          "Returns all relationships and related entities for a specific entity",
      },
    },
  );
