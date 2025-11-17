/**
 * Meshy AI API Mock Fixtures
 * Smart mocks for Meshy AI 3D generation to avoid costs and ensure test reliability
 */

export const mockMeshyTaskResponse = {
  task_id: "mock-meshy-task-123",
  status: "PENDING",
  progress: 0,
};

export const mockMeshyProcessingResponse = {
  result: {
    status: "IN_PROGRESS",
    progress: 45,
  },
};

export const mockMeshySuccessResponse = {
  result: {
    status: "SUCCEEDED",
    progress: 100,
    model_urls: {
      glb: "https://mock-cdn.meshy.ai/models/mock-model.glb",
      fbx: "https://mock-cdn.meshy.ai/models/mock-model.fbx",
      usdz: "https://mock-cdn.meshy.ai/models/mock-model.usdz",
    },
    polycount: 5000,
    thumbnail_url: "https://mock-cdn.meshy.ai/thumbnails/mock-thumbnail.png",
  },
};

export const mockMeshyFailedResponse = {
  result: {
    status: "FAILED",
    progress: 0,
    error: "Image processing failed: Invalid image format",
  },
};

export const mockMeshyRetextureTaskResponse = {
  task_id: "mock-retexture-task-456",
  status: "PENDING",
};

export const mockMeshyRetextureSuccessResponse = {
  status: "SUCCEEDED",
  progress: 100,
  model_urls: {
    glb: "https://mock-cdn.meshy.ai/models/mock-retextured.glb",
  },
  thumbnail_url: "https://mock-cdn.meshy.ai/thumbnails/mock-retextured.png",
};

export const mockMeshyRiggingTaskResponse = {
  task_id: "mock-rigging-task-789",
  status: "PENDING",
};

export const mockMeshyRiggingSuccessResponse = {
  status: "SUCCEEDED",
  progress: 100,
  result: {
    basic_animations: {
      walking_glb_url: "https://mock-cdn.meshy.ai/animations/walking.glb",
      running_glb_url: "https://mock-cdn.meshy.ai/animations/running.glb",
    },
  },
};

/**
 * Create mock GLB file buffer
 */
export function createMockGLBBuffer(): Buffer {
  // Valid GLB header (magic number: 0x46546C67 = "glTF" in little-endian)
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0); // Magic: glTF
  header.writeUInt32LE(2, 4); // Version: 2
  header.writeUInt32LE(100, 8); // Length: 100 bytes

  // JSON chunk header
  const jsonChunkHeader = Buffer.alloc(8);
  jsonChunkHeader.writeUInt32LE(80, 0); // Chunk length
  jsonChunkHeader.writeUInt32LE(0x4e4f534a, 4); // Chunk type: JSON

  // Minimal glTF JSON
  const gltfJson = {
    asset: { version: "2.0" },
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [] }],
  };
  const jsonStr = JSON.stringify(gltfJson);
  const jsonBuffer = Buffer.from(jsonStr.padEnd(80, " "));

  return Buffer.concat([header, jsonChunkHeader, jsonBuffer]);
}

/**
 * Create comprehensive mock fetch for all Meshy API endpoints
 */
export function createMeshyMock(config?: {
  imageToThreeStatus?: "PENDING" | "IN_PROGRESS" | "SUCCEEDED" | "FAILED";
  retextureStatus?: "PENDING" | "SUCCEEDED" | "FAILED";
  riggingStatus?: "PENDING" | "SUCCEEDED" | "FAILED";
}) {
  const {
    imageToThreeStatus = "SUCCEEDED",
    retextureStatus = "SUCCEEDED",
    riggingStatus = "SUCCEEDED",
  } = config || {};

  return async (url: string | URL, options?: any) => {
    const urlStr = typeof url === "string" ? url : url.toString();

    // Image-to-3D POST (start task)
    if (urlStr.includes("image-to-3d") && options?.method === "POST") {
      return {
        ok: true,
        status: 200,
        json: async () => mockMeshyTaskResponse,
      } as any;
    }

    // Image-to-3D GET (check status)
    if (urlStr.includes("image-to-3d") && urlStr.includes("mock-meshy-task")) {
      if (imageToThreeStatus === "SUCCEEDED") {
        return {
          ok: true,
          status: 200,
          json: async () => mockMeshySuccessResponse,
        } as any;
      } else if (imageToThreeStatus === "FAILED") {
        return {
          ok: true,
          status: 200,
          json: async () => mockMeshyFailedResponse,
        } as any;
      } else {
        return {
          ok: true,
          status: 200,
          json: async () => mockMeshyProcessingResponse,
        } as any;
      }
    }

    // Retexture POST (start task)
    if (urlStr.includes("retexture") && options?.method === "POST") {
      return {
        ok: true,
        status: 200,
        json: async () => mockMeshyRetextureTaskResponse,
      } as any;
    }

    // Retexture GET (check status)
    if (
      urlStr.includes("retexture") &&
      urlStr.includes("mock-retexture-task")
    ) {
      return {
        ok: true,
        status: 200,
        json: async () =>
          retextureStatus === "SUCCEEDED"
            ? mockMeshyRetextureSuccessResponse
            : { status: retextureStatus },
      } as any;
    }

    // Rigging POST (start task)
    if (urlStr.includes("rigging") && options?.method === "POST") {
      return {
        ok: true,
        status: 200,
        json: async () => mockMeshyRiggingTaskResponse,
      } as any;
    }

    // Rigging GET (check status)
    if (urlStr.includes("rigging") && urlStr.includes("mock-rigging-task")) {
      return {
        ok: true,
        status: 200,
        json: async () =>
          riggingStatus === "SUCCEEDED"
            ? mockMeshyRiggingSuccessResponse
            : { status: riggingStatus },
      } as any;
    }

    // GLB file download
    if (urlStr.includes(".glb")) {
      return {
        ok: true,
        status: 200,
        arrayBuffer: async () => createMockGLBBuffer(),
      } as any;
    }

    return { ok: false, status: 404 } as any;
  };
}
