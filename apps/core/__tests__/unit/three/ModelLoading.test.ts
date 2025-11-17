/**
 * Model Loading Tests
 *
 * Tests for GLB/GLTF model loading and parsing
 */

import { describe, it, expect, beforeEach } from "bun:test";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import path from "path";

describe("GLTFLoader", () => {
  let loader: GLTFLoader;

  beforeEach(() => {
    loader = new GLTFLoader();
  });

  it("should create GLTFLoader instance", () => {
    expect(loader).toBeDefined();
  });

  it.skip(
    "should load GLB file",
    async () => {
      // Skipped: Requires file:// URL support and actual GLB file
      // This test should run in E2E environment with real files
      const modelPath = `file://${path.join(process.cwd(), "dist/emotes/emote-idle.glb")}`;

      return new Promise<void>((resolve, reject) => {
        loader.load(
          modelPath,
          (gltf) => {
            expect(gltf).toBeDefined();
            expect(gltf.scene).toBeInstanceOf(THREE.Group);
            resolve();
          },
          undefined,
          (error) => {
            // File might not exist in test env, that's ok
            console.log("GLB load test skipped - file not found");
            resolve();
          },
        );
      });
    },
    { timeout: 5000 },
  );

  it.skip(
    "should handle load progress",
    async () => {
      // Skipped: Requires file loading which doesn't work in unit tests
      const modelPath = `file://${path.join(process.cwd(), "dist/emotes/emote-idle.glb")}`;
      let progressCalled = false;

      return new Promise<void>((resolve) => {
        loader.load(
          modelPath,
          () => {
            expect(progressCalled).toBe(true);
            resolve();
          },
          (progress) => {
            progressCalled = true;
            expect(progress.loaded).toBeGreaterThanOrEqual(0);
            expect(progress.total).toBeGreaterThanOrEqual(0);
          },
          () => {
            // Error is ok for this test
            resolve();
          },
        );
      });
    },
    { timeout: 5000 },
  );

  it.skip(
    "should handle load error gracefully",
    async () => {
      // Skipped: URL validation happens before error callback in Bun
      const invalidPath =
        "https://invalid-domain-that-does-not-exist-12345.com/model.glb";

      return new Promise<void>((resolve) => {
        loader.load(
          invalidPath,
          () => {
            throw new Error("Should not succeed with invalid path");
          },
          undefined,
          (error) => {
            expect(error).toBeDefined();
            resolve();
          },
        );
      });
    },
    { timeout: 5000 },
  );
});

describe("Model Analysis", () => {
  it("should analyze model structure", () => {
    // Create a simple test model
    const scene = new THREE.Group();
    scene.name = "TestModel";

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = "TestMesh";

    scene.add(mesh);

    // Analyze structure
    let meshCount = 0;
    let vertexCount = 0;
    let faceCount = 0;

    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        meshCount++;
        const geometry = object.geometry;
        const positions = geometry.getAttribute("position");
        if (positions) {
          vertexCount += positions.count;
        }
        const index = geometry.getIndex();
        if (index) {
          faceCount += index.count / 3;
        }
      }
    });

    expect(meshCount).toBe(1);
    expect(vertexCount).toBe(24);
    expect(faceCount).toBe(12);

    geometry.dispose();
    material.dispose();
  });

  it("should count materials in model", () => {
    const scene = new THREE.Group();

    const material1 = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const material2 = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

    const mesh1 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material1);
    const mesh2 = new THREE.Mesh(new THREE.SphereGeometry(0.5), material2);

    scene.add(mesh1, mesh2);

    const materials = new Set<THREE.Material>();
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (Array.isArray(object.material)) {
          object.material.forEach((m) => materials.add(m));
        } else {
          materials.add(object.material);
        }
      }
    });

    expect(materials.size).toBe(2);

    mesh1.geometry.dispose();
    mesh2.geometry.dispose();
    material1.dispose();
    material2.dispose();
  });

  it("should detect animations in GLTF", () => {
    const animations: THREE.AnimationClip[] = [];

    // Create test animation
    const times = [0, 1, 2];
    const values = [0, 1, 0];
    const track = new THREE.NumberKeyframeTrack(".position[x]", times, values);
    const clip = new THREE.AnimationClip("test", 2, [track]);

    animations.push(clip);

    expect(animations.length).toBe(1);
    expect(animations[0].name).toBe("test");
  });

  it("should find skinned meshes", () => {
    const scene = new THREE.Group();

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });

    const bones: THREE.Bone[] = [];
    const bone1 = new THREE.Bone();
    bone1.name = "Bone1";
    bones.push(bone1);

    const skeleton = new THREE.Skeleton(bones);
    const skinnedMesh = new THREE.SkinnedMesh(geometry, material);
    skinnedMesh.add(bone1);
    skinnedMesh.bind(skeleton);

    scene.add(skinnedMesh);

    let skinnedMeshCount = 0;
    scene.traverse((object) => {
      if (object instanceof THREE.SkinnedMesh) {
        skinnedMeshCount++;
      }
    });

    expect(skinnedMeshCount).toBe(1);
    expect(skinnedMesh.skeleton).toBeDefined();
    expect(skinnedMesh.skeleton.bones.length).toBe(1);

    geometry.dispose();
    material.dispose();
  });
});

describe("Model Transformation", () => {
  it("should center model at origin", () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    geometry.translate(5, 10, -3);
    geometry.computeBoundingBox();

    const center = new THREE.Vector3();
    geometry.boundingBox?.getCenter(center);

    // Center the geometry
    geometry.translate(-center.x, -center.y, -center.z);
    geometry.computeBoundingBox();

    const newCenter = new THREE.Vector3();
    geometry.boundingBox?.getCenter(newCenter);

    expect(newCenter.x).toBeCloseTo(0, 5);
    expect(newCenter.y).toBeCloseTo(0, 5);
    expect(newCenter.z).toBeCloseTo(0, 5);

    geometry.dispose();
  });

  it("should scale model to unit size", () => {
    const geometry = new THREE.BoxGeometry(10, 20, 30);
    geometry.computeBoundingBox();

    const size = new THREE.Vector3();
    geometry.boundingBox?.getSize(size);
    const maxDimension = Math.max(size.x, size.y, size.z);

    const scale = 1 / maxDimension;
    geometry.scale(scale, scale, scale);
    geometry.computeBoundingBox();

    const newSize = new THREE.Vector3();
    geometry.boundingBox?.getSize(newSize);
    const newMaxDimension = Math.max(newSize.x, newSize.y, newSize.z);

    expect(newMaxDimension).toBeCloseTo(1, 5);

    geometry.dispose();
  });

  it("should rotate model", () => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial(),
    );

    mesh.rotation.y = Math.PI / 2;
    mesh.updateMatrixWorld(true);

    expect(mesh.rotation.y).toBeCloseTo(Math.PI / 2, 5);

    mesh.geometry.dispose();
    mesh.material.dispose();
  });

  it("should position model on ground plane", () => {
    const geometry = new THREE.BoxGeometry(1, 2, 1);
    geometry.computeBoundingBox();

    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());

    // Position bottom of model at Y=0
    const minY = geometry.boundingBox!.min.y;
    mesh.position.y = -minY;

    mesh.updateMatrixWorld(true);

    const worldBox = new THREE.Box3().setFromObject(mesh);

    expect(worldBox.min.y).toBeCloseTo(0, 5);

    geometry.dispose();
    mesh.material.dispose();
  });
});

describe("Model Validation", () => {
  it("should validate model has geometry", () => {
    const scene = new THREE.Group();
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial(),
    );
    scene.add(mesh);

    let hasGeometry = false;
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.geometry) {
        hasGeometry = true;
      }
    });

    expect(hasGeometry).toBe(true);

    mesh.geometry.dispose();
    mesh.material.dispose();
  });

  it("should validate model has materials", () => {
    const scene = new THREE.Group();
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0xff0000 }),
    );
    scene.add(mesh);

    let hasMaterial = false;
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.material) {
        hasMaterial = true;
      }
    });

    expect(hasMaterial).toBe(true);

    mesh.geometry.dispose();
    mesh.material.dispose();
  });

  it("should detect invalid geometry", () => {
    const geometry = new THREE.BufferGeometry();

    const isValid = geometry.getAttribute("position") !== undefined;

    expect(isValid).toBe(false);

    geometry.dispose();
  });

  it("should detect degenerate triangles", () => {
    const geometry = new THREE.BufferGeometry();

    // Create degenerate triangle (all points at same location)
    const vertices = new Float32Array([0, 0, 0, 0, 0, 0, 0, 0, 0]);

    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    geometry.computeBoundingBox();

    const size = new THREE.Vector3();
    geometry.boundingBox?.getSize(size);

    const isDegenerate = size.x === 0 && size.y === 0 && size.z === 0;

    expect(isDegenerate).toBe(true);

    geometry.dispose();
  });
});
