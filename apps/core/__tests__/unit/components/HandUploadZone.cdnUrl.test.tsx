/**
 * HandUploadZone cdnUrl Migration Tests
 *
 * Verifies that HandUploadZone correctly calls setCdnUrl with blob URLs
 * Tests file upload and blob URL creation
 *
 * NO MOCKS for internal code
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { render, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { HandUploadZone } from "@/components/hand-rigging/HandUploadZone";
import { useHandRiggingStore } from "@/store/useHandRiggingStore";

describe("HandUploadZone - cdnUrl Migration", () => {
  beforeEach(() => {
    // Reset store
    const store = useHandRiggingStore.getState();
    store.reset();
  });

  describe("File Upload with cdnUrl", () => {
    it("should call setCdnUrl with blob URL on file select", async () => {
      const { container } = render(<HandUploadZone />);

      // Create a fake GLB file
      const file = new File(["glb content"], "test-model.glb", {
        type: "model/gltf-binary",
      });

      // Find the hidden file input
      const fileInput = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      expect(fileInput).toBeDefined();

      if (fileInput) {
        // Simulate file selection
        Object.defineProperty(fileInput, "files", {
          value: [file],
          writable: false,
        });

        fireEvent.change(fileInput);

        await waitFor(() => {
          const state = useHandRiggingStore.getState();
          expect(state.selectedFile).toBe(file);
          expect(state.cdnUrl).toBeDefined();
          expect(state.cdnUrl).toContain("blob:");
        });
      }
    });

    it("should create blob URL for uploaded GLB file", async () => {
      const { container } = render(<HandUploadZone />);

      const file = new File(["glb content"], "character.glb", {
        type: "model/gltf-binary",
      });

      const fileInput = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      if (fileInput) {
        Object.defineProperty(fileInput, "files", {
          value: [file],
          writable: false,
        });

        fireEvent.change(fileInput);

        await waitFor(() => {
          const state = useHandRiggingStore.getState();
          // Blob URL should start with "blob:"
          expect(state.cdnUrl?.startsWith("blob:")).toBe(true);
        });
      }
    });

    it("should create blob URL for uploaded GLTF file", async () => {
      const { container } = render(<HandUploadZone />);

      const file = new File(["gltf content"], "character.gltf", {
        type: "model/gltf+json",
      });

      const fileInput = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      if (fileInput) {
        Object.defineProperty(fileInput, "files", {
          value: [file],
          writable: false,
        });

        fireEvent.change(fileInput);

        await waitFor(() => {
          const state = useHandRiggingStore.getState();
          expect(state.cdnUrl?.startsWith("blob:")).toBe(true);
        });
      }
    });
  });

  describe("Drag and Drop with cdnUrl", () => {
    it("should call setCdnUrl with blob URL on file drop", async () => {
      const { container } = render(<HandUploadZone />);

      const file = new File(["glb content"], "dropped-model.glb", {
        type: "model/gltf-binary",
      });

      // Find the drop zone
      const dropZone = container.querySelector('[class*="border-dashed"]');
      expect(dropZone).toBeDefined();

      if (dropZone) {
        // Simulate file drop
        const dropEvent = new Event("drop", { bubbles: true });
        Object.defineProperty(dropEvent, "dataTransfer", {
          value: {
            files: [file],
          },
        });

        fireEvent(dropZone, dropEvent);

        await waitFor(() => {
          const state = useHandRiggingStore.getState();
          expect(state.selectedFile).toBe(file);
          expect(state.cdnUrl).toBeDefined();
          expect(state.cdnUrl?.startsWith("blob:")).toBe(true);
        });
      }
    });
  });

  describe("Error Handling", () => {
    it("should show error for non-GLB/GLTF files", async () => {
      const { container } = render(<HandUploadZone />);

      const file = new File(["text content"], "not-a-model.txt", {
        type: "text/plain",
      });

      const fileInput = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      if (fileInput) {
        Object.defineProperty(fileInput, "files", {
          value: [file],
          writable: false,
        });

        fireEvent.change(fileInput);

        await waitFor(() => {
          const state = useHandRiggingStore.getState();
          expect(state.error).toBeDefined();
          expect(state.error).toContain("GLB or GLTF");
        });
      }
    });

    it("should clear error on successful file upload", async () => {
      const { container } = render(<HandUploadZone />);
      const store = useHandRiggingStore.getState();

      // Set an error first
      store.setError("Previous error");

      const file = new File(["glb content"], "valid-model.glb", {
        type: "model/gltf-binary",
      });

      const fileInput = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      if (fileInput) {
        Object.defineProperty(fileInput, "files", {
          value: [file],
          writable: false,
        });

        fireEvent.change(fileInput);

        await waitFor(() => {
          const state = useHandRiggingStore.getState();
          expect(state.error).toBeNull();
        });
      }
    });
  });

  describe("UI Feedback", () => {
    it("should show file name after upload", async () => {
      const { container } = render(<HandUploadZone />);

      const file = new File(["glb content"], "my-awesome-character.glb", {
        type: "model/gltf-binary",
      });

      const fileInput = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      if (fileInput) {
        Object.defineProperty(fileInput, "files", {
          value: [file],
          writable: false,
        });

        fireEvent.change(fileInput);

        await waitFor(() => {
          expect(container.textContent).toContain("my-awesome-character.glb");
        });
      }
    });

    it("should show file size after upload", async () => {
      const { container } = render(<HandUploadZone />);

      // Create a file with known size
      const content = new Array(1024 * 100).fill("x").join(""); // ~100KB
      const file = new File([content], "model.glb", {
        type: "model/gltf-binary",
      });

      const fileInput = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      if (fileInput) {
        Object.defineProperty(fileInput, "files", {
          value: [file],
          writable: false,
        });

        fireEvent.change(fileInput);

        await waitFor(() => {
          // Should show file size in MB
          expect(container.textContent).toContain("MB");
        });
      }
    });
  });

  describe("No modelUrl References", () => {
    it("should only use setCdnUrl, not setModelUrl", async () => {
      const { container } = render(<HandUploadZone />);

      const file = new File(["glb content"], "test.glb", {
        type: "model/gltf-binary",
      });

      const fileInput = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      if (fileInput) {
        Object.defineProperty(fileInput, "files", {
          value: [file],
          writable: false,
        });

        fireEvent.change(fileInput);

        await waitFor(() => {
          const state = useHandRiggingStore.getState();

          // Should have cdnUrl
          expect(state.cdnUrl).toBeDefined();

          // Should NOT have modelUrl
          // @ts-expect-error - modelUrl should not exist
          expect(state.modelUrl).toBeUndefined();
        });
      }
    });

    it("should create blob URLs, not file paths", async () => {
      const { container } = render(<HandUploadZone />);

      const file = new File(["glb content"], "test.glb", {
        type: "model/gltf-binary",
      });

      const fileInput = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      if (fileInput) {
        Object.defineProperty(fileInput, "files", {
          value: [file],
          writable: false,
        });

        fireEvent.change(fileInput);

        await waitFor(() => {
          const state = useHandRiggingStore.getState();

          // cdnUrl should be a blob URL, not a file path
          expect(state.cdnUrl).toContain("blob:");
          expect(state.cdnUrl).not.toContain("file://");
        });
      }
    });
  });
});
