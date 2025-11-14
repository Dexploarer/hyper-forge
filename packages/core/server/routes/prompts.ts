/**
 * Prompts Routes
 * Serves prompt configuration files from public/prompts directory
 */

import { Elysia, t } from "elysia";
import { logger } from "../utils/logger";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, "..", "..");
const PROMPTS_DIR = path.join(ROOT_DIR, "public", "prompts");

export const promptRoutes = new Elysia({ prefix: "/api/prompts" })
  // Get game style prompts
  .get(
    "/game-styles",
    async ({ set }) => {
      const file = Bun.file(path.join(PROMPTS_DIR, "game-style-prompts.json"));
      if (!(await file.exists())) {
        set.status = 404;
        return { error: "Game style prompts file not found" };
      }
      try {
        const data = await file.json();
        return data;
      } catch (error) {
        logger.error(
          { context: "Prompts", err: error },
          "Error loading game style prompts",
        );
        set.status = 500;
        return { error: "Failed to load game style prompts" };
      }
    },
    {
      detail: {
        tags: ["Prompts"],
        summary: "Get game style prompts",
        description:
          "Retrieve game style prompt templates for asset generation",
      },
    },
  )

  // Get asset type prompts
  .get(
    "/asset-types",
    async ({ set }) => {
      const file = Bun.file(path.join(PROMPTS_DIR, "asset-type-prompts.json"));
      if (!(await file.exists())) {
        set.status = 404;
        return { error: "Asset type prompts file not found" };
      }
      try {
        const data = await file.json();
        return data;
      } catch (error) {
        logger.error(
          { context: "Prompts", err: error },
          "Error loading asset type prompts",
        );
        set.status = 500;
        return { error: "Failed to load asset type prompts" };
      }
    },
    {
      detail: {
        tags: ["Prompts"],
        summary: "Get asset type prompts",
        description:
          "Retrieve asset type prompt templates for different asset categories",
      },
    },
  )

  // Get material prompts
  .get(
    "/materials",
    async ({ set }) => {
      const file = Bun.file(path.join(PROMPTS_DIR, "material-prompts.json"));
      if (!(await file.exists())) {
        set.status = 404;
        return { error: "Material prompts file not found" };
      }
      try {
        const data = await file.json();
        return data;
      } catch (error) {
        logger.error(
          { context: "Prompts", err: error },
          "Error loading material prompts",
        );
        set.status = 500;
        return { error: "Failed to load material prompts" };
      }
    },
    {
      detail: {
        tags: ["Prompts"],
        summary: "Get material prompts",
        description: "Retrieve material prompt templates for texturing",
      },
    },
  )

  // Get generation prompts
  .get(
    "/generation",
    async ({ set }) => {
      const file = Bun.file(path.join(PROMPTS_DIR, "generation-prompts.json"));
      if (!(await file.exists())) {
        set.status = 404;
        return { error: "Generation prompts file not found" };
      }
      try {
        const data = await file.json();
        return data;
      } catch (error) {
        logger.error(
          { context: "Prompts", err: error },
          "Error loading generation prompts",
        );
        set.status = 500;
        return { error: "Failed to load generation prompts" };
      }
    },
    {
      detail: {
        tags: ["Prompts"],
        summary: "Get generation prompts",
        description: "Retrieve generation prompt templates for the pipeline",
      },
    },
  )

  // Get GPT-4 enhancement prompts
  .get(
    "/gpt4-enhancement",
    async ({ set }) => {
      const file = Bun.file(
        path.join(PROMPTS_DIR, "gpt4-enhancement-prompts.json"),
      );
      if (!(await file.exists())) {
        set.status = 404;
        return { error: "GPT-4 enhancement prompts file not found" };
      }
      try {
        const data = await file.json();
        return data;
      } catch (error) {
        logger.error(
          { context: "Prompts", err: error },
          "Error loading GPT-4 enhancement prompts",
        );
        set.status = 500;
        return { error: "Failed to load GPT-4 enhancement prompts" };
      }
    },
    {
      detail: {
        tags: ["Prompts"],
        summary: "Get GPT-4 enhancement prompts",
        description: "Retrieve GPT-4 prompt enhancement templates",
      },
    },
  )

  // Get material presets
  .get(
    "/material-presets",
    async ({ set }) => {
      const file = Bun.file(path.join(PROMPTS_DIR, "material-presets.json"));
      if (!(await file.exists())) {
        set.status = 404;
        return { error: "Material presets file not found" };
      }
      try {
        const data = await file.json();
        return data;
      } catch (error) {
        logger.error(
          { context: "Prompts", err: error },
          "Error loading material presets",
        );
        set.status = 500;
        return { error: "Failed to load material presets" };
      }
    },
    {
      detail: {
        tags: ["Prompts"],
        summary: "Get material presets",
        description: "Retrieve material preset configurations",
      },
    },
  )

  // Get weapon detection prompts
  .get(
    "/weapon-detection",
    async ({ set }) => {
      const file = Bun.file(
        path.join(PROMPTS_DIR, "weapon-detection-prompts.json"),
      );
      if (!(await file.exists())) {
        set.status = 404;
        return { error: "Weapon detection prompts file not found" };
      }
      try {
        const data = await file.json();
        return data;
      } catch (error) {
        logger.error(
          { context: "Prompts", err: error },
          "Error loading weapon detection prompts",
        );
        set.status = 500;
        return { error: "Failed to load weapon detection prompts" };
      }
    },
    {
      detail: {
        tags: ["Prompts"],
        summary: "Get weapon detection prompts",
        description: "Retrieve weapon detection prompt templates for AI vision",
      },
    },
  );
