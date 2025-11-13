/**
 * usePrompts Hooks Tests
 *
 * Tests for prompt management hooks (game styles, asset types, materials).
 * Tests integration with React Query and Zustand store.
 */

import { describe, it, expect, beforeEach, mock } from "bun:test";
import { renderHook, waitFor, act } from "@testing-library/react";
import {
  useGameStylePrompts,
  useAssetTypePrompts,
  useMaterialPromptTemplates,
} from "@/hooks/usePrompts";
import { createTestQueryClient, createWrapper } from "../../helpers/react-query";
import {
  PromptService,
  type GameStylePrompt,
  type AssetTypePrompt,
  type AssetTypePromptsByCategory,
  type PromptsResponse,
  type MaterialPromptTemplate,
} from "@/services/api/PromptService";

// Mock Game Style Prompts
const mockGameStylePrompts: PromptsResponse<
  Record<string, GameStylePrompt>
> = {
  version: "1.0.0",
  default: {
    runescape: {
      name: "RuneScape",
      base: "low-poly, retro MMORPG style",
      enhanced: "detailed low-poly with vibrant colors",
    },
    realistic: {
      name: "Realistic",
      base: "photorealistic, high detail",
    },
  },
  custom: {
    "custom-1": {
      name: "My Style",
      base: "custom game style",
    },
  },
};

// Mock Asset Type Prompts
const mockAssetTypePrompts: AssetTypePromptsByCategory = {
  avatar: {
    default: {
      warrior: { prompt: "warrior character" },
      mage: { prompt: "mage character" },
    },
    custom: {},
  },
  item: {
    default: {
      sword: { prompt: "sword weapon" },
      shield: { prompt: "shield armor" },
    },
    custom: {
      "custom-item": { prompt: "custom item type" },
    },
  },
};

// Mock Material Prompt Templates
const mockMaterialTemplates: MaterialPromptTemplate = {
  templates: {
    runescape: "${materialId} texture, low-poly RuneScape style",
    generic: "${materialId} texture",
  },
  customOverrides: {
    steel: "metallic steel texture with shine",
  },
};

// Mock Zustand store
const mockAssetTypePromptsStore = {
  warrior: "warrior character",
  mage: "mage character",
};

const mockSetAssetTypePrompts = mock(() => {});

describe("useGameStylePrompts Hook", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    wrapper = createWrapper(queryClient);

    // Mock PromptService
    mock.module("@/services/api/PromptService", () => ({
      PromptService: {
        getGameStylePrompts: mock(() => Promise.resolve(mockGameStylePrompts)),
        saveGameStylePrompts: mock(() => Promise.resolve()),
        deleteGameStyle: mock(() => Promise.resolve(true)),
        mergePrompts: mock((defaultPrompts: any, customPrompts: any) => ({
          ...defaultPrompts,
          ...customPrompts,
        })),
      },
    }));

    // Mock Zustand store
    mock.module("@/store", () => ({
      useGenerationStore: () => ({
        customGamePrompt: null,
        setCustomGamePrompt: mock(() => {}),
        assetTypePrompts: mockAssetTypePromptsStore,
        setAssetTypePrompts: mockSetAssetTypePrompts,
      }),
    }));
  });

  describe("Fetching Game Style Prompts", () => {
    it("should fetch game style prompts on mount", async () => {
      const { result } = renderHook(() => useGameStylePrompts(), { wrapper });

      expect(result.current.loading).toBe(true);

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.prompts).toBeDefined();
      expect(result.current.prompts.version).toBe("1.0.0");
      expect(result.current.prompts.default).toBeDefined();
      expect(result.current.prompts.custom).toBeDefined();
    });

    it("should provide modern React Query API", async () => {
      const { result } = renderHook(() => useGameStylePrompts(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.data).toBeDefined();
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it("should provide backward-compatible API", async () => {
      const { result } = renderHook(() => useGameStylePrompts(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.prompts).toBeDefined();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should merge default and custom prompts", async () => {
      const { result } = renderHook(() => useGameStylePrompts(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      const allStyles = result.current.getAllStyles();

      expect(allStyles).toBeDefined();
      expect(allStyles.runescape).toBeDefined();
      expect(allStyles["custom-1"]).toBeDefined();
    });
  });

  describe("Saving Custom Game Styles", () => {
    it("should save custom game style", async () => {
      const { result } = renderHook(() => useGameStylePrompts(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      const success = await act(async () => {
        return await result.current.saveCustomGameStyle("custom-2", {
          name: "New Style",
          base: "new custom style",
        });
      });

      expect(success).toBe(true);
    });

    it("should handle save errors", async () => {
      // Mock error
      mock.module("@/services/api/PromptService", () => ({
        PromptService: {
          getGameStylePrompts: mock(() =>
            Promise.resolve(mockGameStylePrompts)
          ),
          saveGameStylePrompts: mock(() =>
            Promise.reject(new Error("Save failed"))
          ),
        },
      }));

      queryClient = createTestQueryClient();
      wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => useGameStylePrompts(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      const success = await act(async () => {
        return await result.current.saveCustomGameStyle("custom-fail", {
          name: "Fail Style",
          base: "fail",
        });
      });

      expect(success).toBe(false);
    });
  });

  describe("Deleting Custom Game Styles", () => {
    it("should delete custom game style", async () => {
      const { result } = renderHook(() => useGameStylePrompts(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      const success = await act(async () => {
        return await result.current.deleteCustomGameStyle("custom-1");
      });

      expect(success).toBe(true);
    });

    it("should handle delete errors", async () => {
      // Mock error
      mock.module("@/services/api/PromptService", () => ({
        PromptService: {
          getGameStylePrompts: mock(() =>
            Promise.resolve(mockGameStylePrompts)
          ),
          deleteGameStyle: mock(() =>
            Promise.reject(new Error("Delete failed"))
          ),
        },
      }));

      queryClient = createTestQueryClient();
      wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => useGameStylePrompts(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      const success = await act(async () => {
        return await result.current.deleteCustomGameStyle("custom-1");
      });

      expect(success).toBe(false);
    });
  });
});

describe("useAssetTypePrompts Hook", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    wrapper = createWrapper(queryClient);

    // Mock PromptService
    mock.module("@/services/api/PromptService", () => ({
      PromptService: {
        getAssetTypePrompts: mock(() => Promise.resolve(mockAssetTypePrompts)),
        saveAssetTypePrompts: mock(() => Promise.resolve()),
        deleteAssetType: mock(() => Promise.resolve(true)),
        mergePrompts: mock((defaultPrompts: any, customPrompts: any) => ({
          ...defaultPrompts,
          ...customPrompts,
        })),
      },
    }));

    // Mock Zustand store
    mock.module("@/store", () => ({
      useGenerationStore: () => ({
        assetTypePrompts: mockAssetTypePromptsStore,
        setAssetTypePrompts: mockSetAssetTypePrompts,
      }),
    }));
  });

  describe("Fetching Asset Type Prompts", () => {
    it("should fetch asset type prompts on mount", async () => {
      const { result } = renderHook(() => useAssetTypePrompts(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.prompts).toBeDefined();
      expect(result.current.prompts.avatar).toBeDefined();
      expect(result.current.prompts.item).toBeDefined();
    });

    it("should provide modern React Query API", async () => {
      const { result } = renderHook(() => useAssetTypePrompts(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.data).toBeDefined();
      expect(result.current.isSuccess).toBe(true);
    });

    it("should provide backward-compatible API", async () => {
      const { result } = renderHook(() => useAssetTypePrompts(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.prompts).toBeDefined();
      expect(result.current.loading).toBe(false);
    });

    it("should get types by generation type", async () => {
      const { result } = renderHook(() => useAssetTypePrompts(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      const avatarTypes = result.current.getTypesByGeneration("avatar");
      const itemTypes = result.current.getTypesByGeneration("item");

      expect(avatarTypes).toBeDefined();
      expect(itemTypes).toBeDefined();
      expect(itemTypes.sword).toBeDefined();
    });

    it("should get all types merged", async () => {
      const { result } = renderHook(() => useAssetTypePrompts(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      const allTypes = result.current.getAllTypes();

      expect(allTypes).toBeDefined();
      expect(allTypes.warrior).toBeDefined();
      expect(allTypes.sword).toBeDefined();
    });
  });

  describe("Saving Custom Asset Types", () => {
    it("should save custom asset type for item", async () => {
      const { result } = renderHook(() => useAssetTypePrompts(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      const success = await act(async () => {
        return await result.current.saveCustomAssetType(
          "custom-weapon",
          { prompt: "custom weapon type" },
          "item"
        );
      });

      expect(success).toBe(true);
      expect(mockSetAssetTypePrompts).toHaveBeenCalled();
    });

    it("should save custom asset type for avatar", async () => {
      const { result } = renderHook(() => useAssetTypePrompts(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      const success = await act(async () => {
        return await result.current.saveCustomAssetType(
          "custom-avatar",
          { prompt: "custom avatar type" },
          "avatar"
        );
      });

      expect(success).toBe(true);
    });

    it("should not save unsupported generation type", async () => {
      const { result } = renderHook(() => useAssetTypePrompts(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      const success = await act(async () => {
        return await result.current.saveCustomAssetType(
          "custom-building",
          { prompt: "custom building" },
          "building" as any
        );
      });

      expect(success).toBe(false);
    });

    it("should update Zustand store when saving", async () => {
      const { result } = renderHook(() => useAssetTypePrompts(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.saveCustomAssetType(
          "new-type",
          { prompt: "new type prompt" },
          "item"
        );
      });

      expect(mockSetAssetTypePrompts).toHaveBeenCalled();
    });
  });

  describe("Deleting Custom Asset Types", () => {
    it("should delete custom asset type", async () => {
      const { result } = renderHook(() => useAssetTypePrompts(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      const success = await act(async () => {
        return await result.current.deleteCustomAssetType("custom-item", "item");
      });

      expect(success).toBe(true);
      expect(mockSetAssetTypePrompts).toHaveBeenCalled();
    });
  });
});

describe("useMaterialPromptTemplates Hook", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    wrapper = createWrapper(queryClient);

    // Mock PromptService
    mock.module("@/services/api/PromptService", () => ({
      PromptService: {
        getMaterialPrompts: mock(() => Promise.resolve(mockMaterialTemplates)),
        saveMaterialPrompts: mock(() => Promise.resolve()),
      },
    }));
  });

  describe("Fetching Material Templates", () => {
    it("should fetch material prompt templates on mount", async () => {
      const { result } = renderHook(() => useMaterialPromptTemplates(), {
        wrapper,
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.templates).toBeDefined();
      expect(result.current.templates.templates).toBeDefined();
      expect(result.current.templates.customOverrides).toBeDefined();
    });

    it("should provide modern React Query API", async () => {
      const { result } = renderHook(() => useMaterialPromptTemplates(), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.data).toBeDefined();
      expect(result.current.isSuccess).toBe(true);
    });

    it("should provide backward-compatible API", async () => {
      const { result } = renderHook(() => useMaterialPromptTemplates(), {
        wrapper,
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.templates).toBeDefined();
      expect(result.current.loading).toBe(false);
    });
  });

  describe("Saving Custom Overrides", () => {
    it("should save custom material override", async () => {
      const { result } = renderHook(() => useMaterialPromptTemplates(), {
        wrapper,
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      const success = await act(async () => {
        return await result.current.saveCustomOverride(
          "gold",
          "shiny gold texture override"
        );
      });

      expect(success).toBe(true);
    });

    it("should handle save errors", async () => {
      // Mock error
      mock.module("@/services/api/PromptService", () => ({
        PromptService: {
          getMaterialPrompts: mock(() =>
            Promise.resolve(mockMaterialTemplates)
          ),
          saveMaterialPrompts: mock(() =>
            Promise.reject(new Error("Save failed"))
          ),
        },
      }));

      queryClient = createTestQueryClient();
      wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => useMaterialPromptTemplates(), {
        wrapper,
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      const success = await act(async () => {
        return await result.current.saveCustomOverride("fail", "fail override");
      });

      expect(success).toBe(false);
    });
  });
});
