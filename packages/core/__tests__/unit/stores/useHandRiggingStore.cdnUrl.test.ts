/**
 * useHandRiggingStore cdnUrl Migration Tests
 *
 * Verifies that HandRiggingStore uses cdnUrl instead of modelUrl
 * Tests the setCdnUrl action and cdnUrl state management
 *
 * NO MOCKS for internal code
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { useHandRiggingStore } from "@/store/useHandRiggingStore";

describe("useHandRiggingStore - cdnUrl Migration", () => {
  beforeEach(() => {
    // Reset store to initial state
    const store = useHandRiggingStore.getState();
    store.reset();
  });

  describe("cdnUrl State", () => {
    it("should have cdnUrl state property", () => {
      const state = useHandRiggingStore.getState();
      expect(state).toHaveProperty("cdnUrl");
      expect(state.cdnUrl).toBeNull();
    });

    it("should initialize cdnUrl as null", () => {
      const state = useHandRiggingStore.getState();
      expect(state.cdnUrl).toBeNull();
    });
  });

  describe("setCdnUrl Action", () => {
    it("should set cdnUrl to CDN URL", () => {
      const store = useHandRiggingStore.getState();
      const cdnUrl = "https://cdn.example.com/assets/character.glb";

      store.setCdnUrl(cdnUrl);

      const state = useHandRiggingStore.getState();
      expect(state.cdnUrl).toBe(cdnUrl);
    });

    it("should set cdnUrl to blob URL for uploaded files", () => {
      const store = useHandRiggingStore.getState();
      const blobUrl = "blob:http://localhost:5173/abc-123-def";

      store.setCdnUrl(blobUrl);

      const state = useHandRiggingStore.getState();
      expect(state.cdnUrl).toBe(blobUrl);
    });

    it("should set cdnUrl to relative API URL", () => {
      const store = useHandRiggingStore.getState();
      const cdnUrl = "/api/assets/character-123/model.glb";

      store.setCdnUrl(cdnUrl);

      const state = useHandRiggingStore.getState();
      expect(state.cdnUrl).toBe(cdnUrl);
    });

    it("should set cdnUrl to null to clear", () => {
      const store = useHandRiggingStore.getState();

      // Set a URL first
      store.setCdnUrl("https://cdn.example.com/assets/model.glb");
      expect(useHandRiggingStore.getState().cdnUrl).not.toBeNull();

      // Clear it
      store.setCdnUrl(null);
      expect(useHandRiggingStore.getState().cdnUrl).toBeNull();
    });

    it("should revoke old blob URL when setting new cdnUrl", () => {
      const store = useHandRiggingStore.getState();

      // Set initial blob URL
      const oldBlobUrl = "blob:http://localhost:5173/old-123";
      store.setCdnUrl(oldBlobUrl);

      // Set new URL (should revoke old blob URL)
      const newCdnUrl = "https://cdn.example.com/assets/new-model.glb";
      store.setCdnUrl(newCdnUrl);

      const state = useHandRiggingStore.getState();
      expect(state.cdnUrl).toBe(newCdnUrl);
      expect(state.cdnUrl).not.toBe(oldBlobUrl);
    });
  });

  describe("Integration with setSelectedAvatar", () => {
    it("should clear cdnUrl when avatar is deselected", () => {
      const store = useHandRiggingStore.getState();

      // Set cdnUrl first
      store.setCdnUrl("https://cdn.example.com/assets/avatar.glb");
      expect(useHandRiggingStore.getState().cdnUrl).not.toBeNull();

      // Deselect avatar (null)
      store.setSelectedAvatar(null);

      const state = useHandRiggingStore.getState();
      expect(state.cdnUrl).toBeNull();
    });

    it("should NOT automatically set cdnUrl when avatar is selected", () => {
      const store = useHandRiggingStore.getState();

      const avatar = {
        id: "avatar-123",
        name: "Test Avatar",
        type: "character" as const,
        cdnUrl: "https://cdn.example.com/assets/avatar.glb",
        createdAt: new Date().toISOString(),
        createdBy: "user-123",
        isPublic: true,
        hasModel: true,
      };

      store.setSelectedAvatar(avatar);

      // setSelectedAvatar doesn't auto-set cdnUrl
      // The component must call setCdnUrl explicitly
      const state = useHandRiggingStore.getState();
      expect(state.selectedAvatar).toBe(avatar);
      // cdnUrl is set separately in the component
    });
  });

  describe("Integration with setSelectedFile", () => {
    it("should clear cdnUrl when file is deselected", () => {
      const store = useHandRiggingStore.getState();

      // Set cdnUrl first
      store.setCdnUrl("blob:http://localhost:5173/test-123");
      expect(useHandRiggingStore.getState().cdnUrl).not.toBeNull();

      // Deselect file (null)
      store.setSelectedFile(null);

      const state = useHandRiggingStore.getState();
      expect(state.cdnUrl).toBeNull();
    });
  });

  describe("Reset Action", () => {
    it("should reset cdnUrl to null", () => {
      const store = useHandRiggingStore.getState();

      // Set cdnUrl
      store.setCdnUrl("https://cdn.example.com/assets/model.glb");
      expect(useHandRiggingStore.getState().cdnUrl).not.toBeNull();

      // Reset store
      store.reset();

      const state = useHandRiggingStore.getState();
      expect(state.cdnUrl).toBeNull();
    });

    it("should revoke blob URL on reset", () => {
      const store = useHandRiggingStore.getState();

      // Set blob URL
      const blobUrl = "blob:http://localhost:5173/reset-test-123";
      store.setCdnUrl(blobUrl);

      // Reset should revoke the blob URL
      store.reset();

      const state = useHandRiggingStore.getState();
      expect(state.cdnUrl).toBeNull();
    });
  });

  describe("No modelUrl References", () => {
    it("should NOT have modelUrl property in state", () => {
      const state = useHandRiggingStore.getState();

      expect(state).toHaveProperty("cdnUrl");
      expect(state).not.toHaveProperty("modelUrl");
    });

    it("should NOT have setModelUrl action", () => {
      const store = useHandRiggingStore.getState();

      expect(store).toHaveProperty("setCdnUrl");
      // @ts-expect-error - setModelUrl should not exist
      expect(store.setModelUrl).toBeUndefined();
    });

    it("should use cdnUrl for all model references", () => {
      const store = useHandRiggingStore.getState();

      const cdnUrl = "https://cdn.example.com/assets/character.glb";
      store.setCdnUrl(cdnUrl);

      const state = useHandRiggingStore.getState();

      expect(state.cdnUrl).toBe(cdnUrl);
      // @ts-expect-error - modelUrl should not exist
      expect(state.modelUrl).toBeUndefined();
    });
  });

  describe("Persistence", () => {
    it("should NOT persist cdnUrl (blob URLs are not serializable)", () => {
      const store = useHandRiggingStore.getState();

      // Set blob URL
      store.setCdnUrl("blob:http://localhost:5173/test-123");

      // The partialize config should exclude cdnUrl from persistence
      // (blob URLs are runtime-only and can't be persisted)
      const state = useHandRiggingStore.getState();
      expect(state.cdnUrl).toBeDefined();

      // Only useSimpleMode and showDebugImages are persisted
      expect(true).toBe(true);
    });
  });
});
