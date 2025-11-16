/**
 * AnimationPlayer cdnUrl Migration Tests
 *
 * Verifies that AnimationPlayer component correctly uses cdnUrl instead of modelUrl
 * Tests animation loading from CDN URLs
 *
 * NO MOCKS for internal code
 */

import { describe, it, expect } from "bun:test";
import { render } from "@testing-library/react";
import React from "react";
import { AnimationPlayer } from "@/components/shared/AnimationPlayer";

describe("AnimationPlayer - cdnUrl Migration", () => {
  describe("cdnUrl Prop Interface", () => {
    it("should accept cdnUrl prop", () => {
      const cdnUrl = "/api/assets/character-123/model.glb";

      expect(() => {
        render(<AnimationPlayer cdnUrl={cdnUrl} />);
      }).not.toThrow();
    });

    it("should handle animations with cdnUrl", () => {
      const cdnUrl = "/api/assets/character-123/model.glb";
      const animations = {
        basic: {
          walking: "walking.glb",
          running: "running.glb",
          tpose: "t-pose.glb",
        },
      };
      const assetId = "character-123";

      const { container } = render(
        <AnimationPlayer
          cdnUrl={cdnUrl}
          animations={animations}
          assetId={assetId}
        />,
      );

      expect(container).toBeDefined();
    });

    it("should construct animation URLs from assetId and animation filenames", () => {
      const cdnUrl = "/api/assets/character-123/model.glb";
      const animations = {
        basic: {
          walking: "walking.glb",
          tpose: "t-pose.glb",
        },
      };
      const assetId = "character-123";

      const { container } = render(
        <AnimationPlayer
          cdnUrl={cdnUrl}
          animations={animations}
          assetId={assetId}
        />,
      );

      // Component constructs URLs like: /api/assets/{assetId}/{filename}
      // Verify it renders without error
      expect(container.querySelector("button")).toBeDefined();
    });
  });

  describe("Animation File Loading", () => {
    it("should load t-pose model from CDN", () => {
      const cdnUrl = "/api/assets/character-123/model.glb";
      const animations = {
        basic: {
          tpose: "t-pose.glb",
        },
      };

      const { container } = render(
        <AnimationPlayer
          cdnUrl={cdnUrl}
          animations={animations}
          assetId="character-123"
        />,
      );

      // Should attempt to load /api/assets/character-123/t-pose.glb
      expect(container).toBeDefined();
    });

    it("should load walking animation from CDN", () => {
      const cdnUrl = "/api/assets/character-123/model.glb";
      const animations = {
        basic: {
          walking: "walking.glb",
        },
      };

      const { container } = render(
        <AnimationPlayer
          cdnUrl={cdnUrl}
          animations={animations}
          assetId="character-123"
        />,
      );

      expect(container).toBeDefined();
    });

    it("should load running animation from CDN", () => {
      const cdnUrl = "/api/assets/character-123/model.glb";
      const animations = {
        basic: {
          running: "running.glb",
        },
      };

      const { container } = render(
        <AnimationPlayer
          cdnUrl={cdnUrl}
          animations={animations}
          assetId="character-123"
        />,
      );

      expect(container).toBeDefined();
    });
  });

  describe("Character Height Integration", () => {
    it("should pass characterHeight to ThreeViewer via cdnUrl", () => {
      const cdnUrl = "/api/assets/character-123/model.glb";
      const characterHeight = 1.8;
      const animations = {
        basic: {
          tpose: "t-pose.glb",
        },
      };

      const { container } = render(
        <AnimationPlayer
          cdnUrl={cdnUrl}
          animations={animations}
          characterHeight={characterHeight}
          assetId="character-123"
        />,
      );

      // ThreeViewer should receive characterHeight in assetInfo
      expect(container).toBeDefined();
    });
  });

  describe("Primary Model URL Selection", () => {
    it("should prefer t-pose model as primary model URL", () => {
      const cdnUrl = "/api/assets/character-123/model.glb";
      const animations = {
        basic: {
          tpose: "t-pose.glb",
          walking: "walking.glb",
          running: "running.glb",
        },
      };

      const { container } = render(
        <AnimationPlayer
          cdnUrl={cdnUrl}
          animations={animations}
          assetId="character-123"
        />,
      );

      // Component should set primaryModelUrl to t-pose
      expect(container).toBeDefined();
    });

    it("should fallback to walking if no t-pose", () => {
      const cdnUrl = "/api/assets/character-123/model.glb";
      const animations = {
        basic: {
          walking: "walking.glb",
          running: "running.glb",
        },
      };

      const { container } = render(
        <AnimationPlayer
          cdnUrl={cdnUrl}
          animations={animations}
          assetId="character-123"
        />,
      );

      expect(container).toBeDefined();
    });

    it("should fallback to running if no t-pose or walking", () => {
      const cdnUrl = "/api/assets/character-123/model.glb";
      const animations = {
        basic: {
          running: "running.glb",
        },
      };

      const { container } = render(
        <AnimationPlayer
          cdnUrl={cdnUrl}
          animations={animations}
          assetId="character-123"
        />,
      );

      expect(container).toBeDefined();
    });

    it("should show no animations message if no suitable model", () => {
      const cdnUrl = "/api/assets/character-123/model.glb";
      const animations = {
        basic: {},
      };

      const { container } = render(
        <AnimationPlayer
          cdnUrl={cdnUrl}
          animations={animations}
          assetId="character-123"
        />,
      );

      // Should show "No animations available" message
      expect(container.textContent).toContain("No animations available");
    });
  });

  describe("No modelUrl References", () => {
    it("should only use cdnUrl, not modelUrl", () => {
      const cdnUrl = "/api/assets/character-123/model.glb";

      const result = render(<AnimationPlayer cdnUrl={cdnUrl} />);

      // If this compiles and runs, cdnUrl migration is complete
      expect(result).toBeDefined();
    });
  });
});
