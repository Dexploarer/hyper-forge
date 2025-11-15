/**
 * SimpleVRMViewer - Clean, focused VRM animation viewer
 *
 * Displays a VRM model with animation testing capabilities.
 * Keeps it simple: load VRM, show it, play animations.
 */

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { Play } from "lucide-react";
import styled from "styled-components";
import { retargetAnimation } from "../services/retargeting/AnimationRetargeting";
import { ThreeDPanel } from "./3DPanel";

const Container = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  background: #1a1a1a;
`;

const Canvas = styled.canvas`
  width: 100%;
  height: 100%;
  display: block;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(26, 26, 26, 0.8);
  color: white;
  font-size: 16px;
`;

const ErrorOverlay = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  padding: 16px;
  background: rgba(220, 53, 69, 0.9);
  color: white;
  border-radius: 8px;
  font-size: 14px;
`;

const InfoBox = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  backdrop-filter: blur(10px);
  line-height: 1.6;
`;

const UploadOverlay = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 5;
`;

const FileInput = styled.input`
  display: none;
`;

const UploadButton = styled.label`
  display: inline-block;
  padding: 12px 24px;
  background: rgba(139, 92, 246, 0.9);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.2s;
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(139, 92, 246, 1);
  }
`;

const AnimationsButton = styled.button`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(139, 92, 246, 0.9);
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  backdrop-filter: blur(10px);
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.2s;

  &:hover {
    background: rgba(139, 92, 246, 1);
  }
`;

const AnimationButton = styled.button<{ $active: boolean }>`
  width: 100%;
  padding: 12px 16px;
  border-radius: 8px;
  border: none;
  text-align: left;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  background: ${(props) =>
    props.$active ? "#8b5cf6" : "rgba(255, 255, 255, 0.05)"};
  color: ${(props) => (props.$active ? "white" : "rgba(255, 255, 255, 0.9)")};

  &:hover {
    background: ${(props) =>
      props.$active ? "#8b5cf6" : "rgba(255, 255, 255, 0.1)"};
  }
`;

interface SimpleVRMViewerProps {
  vrmUrl: string;
  onFileUpload?: (file: File) => void;
}

interface AnimationInfo {
  name: string;
  label: string;
  url: string;
}

export const SimpleVRMViewer: React.FC<SimpleVRMViewerProps> = ({
  vrmUrl,
  onFileUpload,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loadAnimationRef = useRef<((url: string) => Promise<void>) | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string>("");
  const [animationsPanelOpen, setAnimationsPanelOpen] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState<string>("idle");
  const [customAnimations, setCustomAnimations] = useState<AnimationInfo[]>([]);

  // Available animations - memoized to prevent infinite re-renders
  const baseUrl = import.meta.env.PROD
    ? ""
    : `http://localhost:${import.meta.env.VITE_API_PORT || "3004"}`;

  const defaultAnimations: AnimationInfo[] = React.useMemo(
    () => [
      { name: "idle", label: "Idle", url: `${baseUrl}/emotes/emote-idle.glb` },
      { name: "walk", label: "Walk", url: `${baseUrl}/emotes/emote-walk.glb` },
      { name: "run", label: "Run", url: `${baseUrl}/emotes/emote-run.glb` },
      { name: "jump", label: "Jump", url: `${baseUrl}/emotes/emote-jump.glb` },
    ],
    [baseUrl],
  );

  // Combine default and custom animations
  const animations = React.useMemo(
    () => [...defaultAnimations, ...customAnimations],
    [defaultAnimations, customAnimations],
  );

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;

    // If no VRM URL, just show empty scene
    if (!vrmUrl) {
      setLoading(false);
      setError(null);
      setInfo("");
    } else {
      setLoading(true);
      setError(null);
    }

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100,
    );
    camera.position.set(0, 1.6, 5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Controls
    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 1, 0);
    controls.update();

    // Lights
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(1, 2, 1);
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Grid
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);

    // VRM state
    let vrm: any = null;
    let mixer: THREE.AnimationMixer | null = null;
    let currentAction: THREE.AnimationAction | null = null;
    let rootToHips = 1;

    // Load VRM
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    // Animation loader function
    const loadAnimation = async (animUrl: string) => {
      if (!vrm || !mixer) {
        console.warn("VRM or mixer not ready");
        return;
      }

      try {
        const gltf = await loader.loadAsync(animUrl);
        if (!gltf.animations || gltf.animations.length === 0) {
          console.error("No animations found in GLB");
          return;
        }

        // Retarget animation to VRM skeleton
        const retargetedClip = retargetAnimation(gltf, vrm, rootToHips);
        if (!retargetedClip) {
          console.error("Animation retargeting failed");
          return;
        }

        // Stop current animation
        if (currentAction) {
          currentAction.fadeOut(0.2);
        }

        // Play new animation
        currentAction = mixer.clipAction(retargetedClip);
        currentAction.reset().fadeIn(0.2).play();
      } catch (err) {
        console.error("Failed to load animation:", err);
      }
    };

    // Store in ref so it can be called from outside the useEffect
    loadAnimationRef.current = loadAnimation;

    // Load VRM model (only if URL provided)
    if (vrmUrl) {
      loader.load(
        vrmUrl,
        async (gltf) => {
          vrm = gltf.userData.vrm;

          if (!vrm) {
            setError("No VRM data found in file");
            setLoading(false);
            return;
          }

          // Rotate VRM 0.0 models 180°
          const vrmVersion =
            vrm.meta?.metaVersion ||
            (vrm.meta?.specVersion?.startsWith("0.") ? "0" : "1");

          if (vrmVersion === "0") {
            VRMUtils.rotateVRM0(vrm);
          }

          scene.add(vrm.scene);

          // Calculate rootToHips for animation retargeting
          const humanoid = vrm.humanoid;
          if (humanoid && (humanoid as any).normalizedRestPose?.hips) {
            rootToHips = (humanoid as any).normalizedRestPose.hips.position[1];
          } else {
            const hipsNode = humanoid?.getRawBoneNode("hips");
            if (hipsNode) {
              const v = new THREE.Vector3();
              hipsNode.getWorldPosition(v);
              rootToHips = v.y;
            }
          }

          // Get bone count for info display
          const boneCount = humanoid
            ? Object.keys(humanoid.humanBones).length
            : 0;
          setInfo(
            `VRM loaded\nBones: ${boneCount}\nHeight: ${rootToHips.toFixed(2)}m`,
          );

          // Setup animation mixer
          mixer = new THREE.AnimationMixer(vrm.scene);

          setLoading(false);

          // Load initial idle animation
          await loadAnimation(animations[0].url);
        },
        (progress) => {
          const percent = ((progress.loaded / progress.total) * 100).toFixed(0);
          setInfo(`Loading... ${percent}%`);
        },
        (err) => {
          console.error("VRM load error:", err);
          setError(`Failed to load VRM: ${err}`);
          setLoading(false);
        },
      );
    }

    // Animation loop
    const clock = new THREE.Clock();
    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const deltaTime = clock.getDelta();

      // Update animation mixer
      if (mixer) {
        mixer.update(deltaTime);
      }

      // Update VRM (propagates normalized bone transforms to skeleton)
      if (vrm) {
        vrm.update(deltaTime);
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!canvasRef.current) return;
      camera.aspect =
        canvasRef.current.clientWidth / canvasRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(
        canvasRef.current.clientWidth,
        canvasRef.current.clientHeight,
      );
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    };
  }, [vrmUrl, animations]);

  const handleAnimationChange = async (animName: string) => {
    setCurrentAnimation(animName);

    // Find the animation URL
    const anim = animations.find((a) => a.name === animName);
    if (anim && loadAnimationRef.current) {
      await loadAnimationRef.current(anim.url);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
  };

  const handleAnimationUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const animName = `custom_${Date.now()}`;
      const animLabel = file.name.replace(/\.(glb|gltf)$/i, "");

      setCustomAnimations((prev) => [
        ...prev,
        {
          name: animName,
          label: animLabel,
          url: url,
        },
      ]);

      console.log("[SimpleVRMViewer] Added custom animation:", animLabel);
    }
  };

  return (
    <Container ref={containerRef}>
      <Canvas ref={canvasRef} />

      {/* Upload button */}
      <UploadOverlay>
        <FileInput
          type="file"
          accept=".vrm"
          id="vrm-upload-simple"
          onChange={handleFileChange}
        />
        <UploadButton htmlFor="vrm-upload-simple">
          {vrmUrl ? "Upload New VRM" : "Upload VRM"}
        </UploadButton>
      </UploadOverlay>

      {loading && <LoadingOverlay>Loading VRM...</LoadingOverlay>}

      {error && <ErrorOverlay>Error: {error}</ErrorOverlay>}

      {!loading && !error && info && <InfoBox>{info}</InfoBox>}

      {!loading && !error && vrmUrl && (
        <AnimationsButton onClick={() => setAnimationsPanelOpen(true)}>
          <Play size={16} />
          Animations
        </AnimationsButton>
      )}

      <ThreeDPanel
        isOpen={animationsPanelOpen}
        onClose={() => setAnimationsPanelOpen(false)}
        title="Animations"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Upload custom animation */}
          <div>
            <input
              type="file"
              accept=".glb,.gltf"
              id="animation-upload"
              style={{ display: "none" }}
              onChange={handleAnimationUpload}
            />
            <label
              htmlFor="animation-upload"
              style={{
                display: "block",
                padding: "12px 16px",
                background: "rgba(139, 92, 246, 0.2)",
                border: "2px dashed rgba(139, 92, 246, 0.5)",
                borderRadius: "8px",
                cursor: "pointer",
                textAlign: "center",
                fontSize: "14px",
                fontWeight: "600",
                color: "#8b5cf6",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(139, 92, 246, 0.3)";
                e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.8)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(139, 92, 246, 0.2)";
                e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.5)";
              }}
            >
              + Upload Animation (GLB/GLTF)
            </label>
          </div>

          {/* Animation list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {animations.map((anim) => (
              <AnimationButton
                key={anim.name}
                $active={currentAnimation === anim.name}
                onClick={() => handleAnimationChange(anim.name)}
              >
                {anim.label}
              </AnimationButton>
            ))}
          </div>
        </div>
      </ThreeDPanel>
    </Container>
  );
};
