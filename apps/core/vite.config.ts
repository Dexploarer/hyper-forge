import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom", "react/jsx-runtime", "three"],
    alias: {
      "@": path.resolve(__dirname, "src"),
      react: path.resolve(__dirname, "../../node_modules/react"),
      "react-dom": path.resolve(__dirname, "../../node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(
        __dirname,
        "../../node_modules/react/jsx-runtime",
      ),
      // Remove three alias - let Bun/Vite resolve it naturally
    },
    conditions: ["browser"],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "three",
      "@react-three/fiber",
      "@react-three/drei",
      "three/addons/controls/OrbitControls.js",
      "three/examples/jsm/loaders/GLTFLoader.js",
    ],
    esbuildOptions: {
      resolveExtensions: [".mjs", ".js", ".jsx", ".json", ".ts", ".tsx"],
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:3004",
        changeOrigin: true,
      },
      "/assets": {
        target: "http://localhost:3004",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          "react-core": ["react", "react-dom", "react/jsx-runtime"],

          // Three.js core library
          "three-core": ["three"],

          // Three.js addons and React integration
          "three-addons": [
            "@react-three/fiber",
            "@react-three/drei",
            "three/examples/jsm/controls/OrbitControls.js",
            "three/examples/jsm/loaders/GLTFLoader.js",
            "three/examples/jsm/controls/TransformControls.js",
            "three/examples/jsm/exporters/GLTFExporter.js",
            "three/examples/jsm/postprocessing/EffectComposer.js",
            "three/examples/jsm/postprocessing/RenderPass.js",
            "three/examples/jsm/postprocessing/SSAOPass.js",
            "three/examples/jsm/postprocessing/UnrealBloomPass.js",
          ],

          // VRM character support
          "three-vrm": ["@pixiv/three-vrm"],

          // TensorFlow.js and MediaPipe (heavy libs)
          tensorflow: [
            "@tensorflow/tfjs",
            "@tensorflow/tfjs-backend-webgl",
            "@tensorflow-models/hand-pose-detection",
            "@mediapipe/hands",
          ],

          // UI libraries
          "ui-libs": [
            "lucide-react",
            "recharts",
            "react-joyride",
            "@xyflow/react",
          ],

          // State management and data fetching
          "state-management": [
            "zustand",
            "@tanstack/react-query",
            "@tanstack/react-query-devtools",
          ],

          // Auth
          auth: ["@privy-io/react-auth"],

          // AI SDK
          "ai-sdk": [
            "ai",
            "@ai-sdk/openai",
            "@ai-sdk/anthropic",
            "@ai-sdk/google",
          ],

          // Utilities
          utils: ["clsx", "immer", "tailwind-merge", "zod"],
        },
      },
    },
    // Increase chunk size warning limit for Three.js bundles
    chunkSizeWarningLimit: 1000,
    // Disable source maps in production (security - don't expose source code)
    // Enable in development for debugging
    sourcemap: process.env.NODE_ENV !== "production",
  },
});
