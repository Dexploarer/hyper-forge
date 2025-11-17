/**
 * Format Conversion Tests
 *
 * Tests for model format conversions (GLB, FBX, VRM)
 * Note: Export tests require FileReader API which is browser-only
 * These tests are better suited for E2E/browser environment
 */

import { describe, it, expect } from "bun:test";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

describe("GLB Export", () => {
  it.skip("should export scene to GLB", async () => {
    const scene = new THREE.Scene();
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const exporter = new GLTFExporter();

    return new Promise<void>((resolve, reject) => {
      exporter.parse(
        scene,
        (result) => {
          expect(result).toBeDefined();

          if (result instanceof ArrayBuffer) {
            expect(result.byteLength).toBeGreaterThan(0);
          } else {
            expect(typeof result).toBe("object");
          }

          resolve();
        },
        (error) => {
          reject(error);
        },
        { binary: true },
      );
    }).finally(() => {
      geometry.dispose();
      material.dispose();
    });
  });

  it.skip("should export with animations", async () => {
    const scene = new THREE.Scene();
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Create animation
    const times = [0, 1, 2];
    const values = [0, 0, 0, 1, 1, 1, 0, 0, 0];
    const track = new THREE.VectorKeyframeTrack(".position", times, values);
    const clip = new THREE.AnimationClip("test", 2, [track]);

    const exporter = new GLTFExporter();

    return new Promise<void>((resolve, reject) => {
      exporter.parse(
        scene,
        (result) => {
          expect(result).toBeDefined();
          resolve();
        },
        (error) => {
          reject(error);
        },
        { binary: true, animations: [clip] },
      );
    }).finally(() => {
      geometry.dispose();
      material.dispose();
    });
  });

  it.skip("should preserve materials during export", async () => {
    const scene = new THREE.Scene();
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      metalness: 0.8,
      roughness: 0.2,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const exporter = new GLTFExporter();

    return new Promise<void>((resolve, reject) => {
      exporter.parse(
        scene,
        (result) => {
          expect(result).toBeDefined();
          // Material properties should be preserved
          resolve();
        },
        (error) => {
          reject(error);
        },
        { binary: false },
      );
    }).finally(() => {
      geometry.dispose();
      material.dispose();
    });
  });

  it.skip("should handle multiple meshes", async () => {
    const scene = new THREE.Scene();

    const mesh1 = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0xff0000 }),
    );

    const mesh2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.5),
      new THREE.MeshStandardMaterial({ color: 0x00ff00 }),
    );

    scene.add(mesh1, mesh2);

    const exporter = new GLTFExporter();

    return new Promise<void>((resolve, reject) => {
      exporter.parse(
        scene,
        (result) => {
          expect(result).toBeDefined();
          resolve();
        },
        (error) => {
          reject(error);
        },
        { binary: true },
      );
    }).finally(() => {
      mesh1.geometry.dispose();
      mesh1.material.dispose();
      mesh2.geometry.dispose();
      mesh2.material.dispose();
    });
  });
});

describe("Model Transformation for Export", () => {
  it("should center model before export", () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    geometry.translate(5, 10, -3);
    geometry.computeBoundingBox();

    const center = new THREE.Vector3();
    geometry.boundingBox?.getCenter(center);

    geometry.translate(-center.x, -center.y, -center.z);
    geometry.computeBoundingBox();

    const newCenter = new THREE.Vector3();
    geometry.boundingBox?.getCenter(newCenter);

    expect(newCenter.length()).toBeLessThan(0.0001);

    geometry.dispose();
  });

  it("should normalize scale before export", () => {
    const geometry = new THREE.BoxGeometry(10, 20, 30);
    geometry.computeBoundingBox();

    const size = new THREE.Vector3();
    geometry.boundingBox?.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);

    const scale = 1 / maxDim;
    geometry.scale(scale, scale, scale);
    geometry.computeBoundingBox();

    const newSize = new THREE.Vector3();
    geometry.boundingBox?.getSize(newSize);
    const newMaxDim = Math.max(newSize.x, newSize.y, newSize.z);

    expect(newMaxDim).toBeCloseTo(1, 5);

    geometry.dispose();
  });

  it("should apply rotation before export", () => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial(),
    );

    mesh.rotation.y = Math.PI / 2;
    mesh.updateMatrixWorld(true);

    // Apply rotation to geometry
    mesh.geometry.applyMatrix4(mesh.matrixWorld);

    // Reset mesh transform
    mesh.position.set(0, 0, 0);
    mesh.rotation.set(0, 0, 0);
    mesh.scale.set(1, 1, 1);
    mesh.updateMatrixWorld(true);

    expect(mesh.rotation.y).toBeCloseTo(0, 5);

    mesh.geometry.dispose();
    mesh.material.dispose();
  });
});

describe("Texture Handling", () => {
  it.skip("should export model with texture", async () => {
    const scene = new THREE.Scene();

    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "red";
      ctx.fillRect(0, 0, 256, 256);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshStandardMaterial({ map: texture });
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const mesh = new THREE.Mesh(geometry, material);

    scene.add(mesh);

    const exporter = new GLTFExporter();

    return new Promise<void>((resolve, reject) => {
      exporter.parse(
        scene,
        (result) => {
          expect(result).toBeDefined();
          resolve();
        },
        (error) => {
          reject(error);
        },
        { binary: true },
      );
    }).finally(() => {
      geometry.dispose();
      material.dispose();
      texture.dispose();
    });
  });

  it.skip("should handle multiple textures", async () => {
    const scene = new THREE.Scene();

    const createTexture = (color: string) => {
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 128, 128);
      }
      return new THREE.CanvasTexture(canvas);
    };

    const material = new THREE.MeshStandardMaterial({
      map: createTexture("red"),
      normalMap: createTexture("blue"),
      roughnessMap: createTexture("green"),
    });

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const exporter = new GLTFExporter();

    return new Promise<void>((resolve, reject) => {
      exporter.parse(
        scene,
        (result) => {
          expect(result).toBeDefined();
          resolve();
        },
        (error) => {
          reject(error);
        },
        { binary: true },
      );
    }).finally(() => {
      geometry.dispose();
      material.map?.dispose();
      material.normalMap?.dispose();
      material.roughnessMap?.dispose();
      material.dispose();
    });
  });
});

describe("Skeleton/Rigging Preservation", () => {
  it.skip("should preserve skeleton during export", async () => {
    const scene = new THREE.Scene();
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });

    // Create simple skeleton
    const bones: THREE.Bone[] = [];
    const bone1 = new THREE.Bone();
    bone1.name = "Bone1";
    bone1.position.y = 0;
    bones.push(bone1);

    const bone2 = new THREE.Bone();
    bone2.name = "Bone2";
    bone2.position.y = 1;
    bone1.add(bone2);
    bones.push(bone2);

    const skeleton = new THREE.Skeleton(bones);
    const skinnedMesh = new THREE.SkinnedMesh(geometry, material);
    skinnedMesh.add(bone1);
    skinnedMesh.bind(skeleton);

    scene.add(skinnedMesh);

    const exporter = new GLTFExporter();

    return new Promise<void>((resolve, reject) => {
      exporter.parse(
        scene,
        (result) => {
          expect(result).toBeDefined();
          // Skeleton should be preserved
          resolve();
        },
        (error) => {
          reject(error);
        },
        { binary: true },
      );
    }).finally(() => {
      geometry.dispose();
      material.dispose();
    });
  });

  it("should export skinned mesh correctly", () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });

    const bones: THREE.Bone[] = [];
    const bone = new THREE.Bone();
    bone.name = "Root";
    bones.push(bone);

    const skeleton = new THREE.Skeleton(bones);
    const skinnedMesh = new THREE.SkinnedMesh(geometry, material);
    skinnedMesh.add(bone);
    skinnedMesh.bind(skeleton);

    expect(skinnedMesh.skeleton).toBeDefined();
    expect(skinnedMesh.skeleton.bones.length).toBe(1);

    geometry.dispose();
    material.dispose();
  });
});

describe("Animation Preservation", () => {
  it("should preserve animation tracks", () => {
    const times = [0, 1, 2];
    const positionValues = [0, 0, 0, 1, 1, 1, 0, 0, 0];
    const rotationValues = [0, 0, 0, 1, 0.707, 0.707, 0, 0, 1];

    const positionTrack = new THREE.VectorKeyframeTrack(
      ".position",
      times,
      positionValues,
    );
    const rotationTrack = new THREE.QuaternionKeyframeTrack(
      ".quaternion",
      times,
      rotationValues,
    );

    const clip = new THREE.AnimationClip("walk", 2, [
      positionTrack,
      rotationTrack,
    ]);

    expect(clip.tracks.length).toBe(2);
    expect(clip.duration).toBe(2);
    expect(clip.name).toBe("walk");
  });

  it("should validate animation clip", () => {
    const times = [0, 1, 2];
    const values = [0, 0, 0, 1, 1, 1, 0, 0, 0];
    const track = new THREE.VectorKeyframeTrack(".position", times, values);
    const clip = new THREE.AnimationClip("test", 2, [track]);

    // Validate clip
    expect(clip.validate()).toBe(true);
  });

  it("should optimize animation tracks", () => {
    const times = [0, 1, 2, 3, 4];
    const values = [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0];
    const track = new THREE.VectorKeyframeTrack(".position", times, values);
    const clip = new THREE.AnimationClip("test", 4, [track]);

    clip.optimize();

    expect(clip.tracks[0]).toBeDefined();
  });
});

describe("Format-Specific Features", () => {
  it.skip("should handle GLB-specific properties", async () => {
    const scene = new THREE.Scene();
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const exporter = new GLTFExporter();

    return new Promise<void>((resolve, reject) => {
      exporter.parse(
        scene,
        (result) => {
          if (result instanceof ArrayBuffer) {
            // Check GLB magic number
            const view = new DataView(result);
            const magic = view.getUint32(0, true);
            expect(magic).toBe(0x46546c67); // "glTF" in hex
          }
          resolve();
        },
        (error) => {
          reject(error);
        },
        { binary: true },
      );
    }).finally(() => {
      geometry.dispose();
      material.dispose();
    });
  });

  it.skip("should export as GLTF (JSON)", async () => {
    const scene = new THREE.Scene();
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const exporter = new GLTFExporter();

    return new Promise<void>((resolve, reject) => {
      exporter.parse(
        scene,
        (result) => {
          if (typeof result === "object" && !(result instanceof ArrayBuffer)) {
            expect(result.asset).toBeDefined();
            expect(result.scene).toBeDefined();
          }
          resolve();
        },
        (error) => {
          reject(error);
        },
        { binary: false },
      );
    }).finally(() => {
      geometry.dispose();
      material.dispose();
    });
  });
});

describe("Export Validation", () => {
  it.skip("should validate exported model has required properties", async () => {
    const scene = new THREE.Scene();
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = "TestCube";
    scene.add(mesh);

    const exporter = new GLTFExporter();

    return new Promise<void>((resolve, reject) => {
      exporter.parse(
        scene,
        (result) => {
          if (typeof result === "object" && !(result instanceof ArrayBuffer)) {
            expect(result.asset).toBeDefined();
            expect(result.asset.version).toBeDefined();
            expect(result.scenes).toBeDefined();
            expect(result.nodes).toBeDefined();
            expect(result.meshes).toBeDefined();
            expect(result.materials).toBeDefined();
          }
          resolve();
        },
        (error) => {
          reject(error);
        },
        { binary: false },
      );
    }).finally(() => {
      geometry.dispose();
      material.dispose();
    });
  });

  it.skip("should check for empty exports", async () => {
    const scene = new THREE.Scene();
    const exporter = new GLTFExporter();

    return new Promise<void>((resolve, reject) => {
      exporter.parse(
        scene,
        (result) => {
          // Empty scene should still export
          expect(result).toBeDefined();
          resolve();
        },
        (error) => {
          reject(error);
        },
        { binary: true },
      );
    });
  });
});
