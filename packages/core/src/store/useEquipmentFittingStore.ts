import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { ArmorFittingViewerRef } from "../components/armor-fitting/ArmorFittingViewer";
import {
  FittingConfig,
  BodyRegion,
  CollisionPoint,
} from "../services/fitting/ArmorFittingService";
import { Asset } from "../types";
import {
  WeaponHandleDetector,
  HandleDetectionResult,
} from "../services/processing/WeaponHandleDetector";

interface HistoryEntry {
  fittingConfig: FittingConfig;
  timestamp: number;
}

// Equipment slot type - determines which workflow to use
type EquipmentSlotType = "armor" | "weapon";

interface EquipmentFittingState {
  // Selected items
  selectedAvatar: Asset | null;
  selectedArmor: Asset | null;
  selectedHelmet: Asset | null;
  selectedWeapon: Asset | null; // NEW - for weapon mode
  assetTypeFilter: "avatar" | "armor" | "helmet" | "weapon"; // NEW - added weapon

  // Equipment slot (determines mode)
  equipmentSlot: string; // 'Head', 'Spine2', 'Hips', 'Hand_R', 'Hand_L'

  // UI State
  currentTab: "quick" | "advanced"; // NEW - tab system
  showDebugger: boolean;

  // === ARMOR FITTING STATE ===
  // Fitting configuration
  fittingConfig: FittingConfig;

  // Helmet fitting parameters
  helmetFittingMethod: "auto" | "manual";
  helmetSizeMultiplier: number;
  helmetFitTightness: number;
  helmetVerticalOffset: number;
  helmetForwardOffset: number;
  helmetRotation: { x: number; y: number; z: number };

  // Armor options
  enableWeightTransfer: boolean;

  // Armor visualization
  visualizationMode: "none" | "regions" | "collisions" | "weights" | "hull";
  selectedBone: number;

  // Armor fitting results
  bodyRegions: Map<string, BodyRegion> | null;
  collisions: CollisionPoint[] | null;
  isArmorFitted: boolean;
  isArmorBound: boolean;
  isHelmetFitted: boolean;
  isHelmetAttached: boolean;

  // === WEAPON FITTING STATE === (NEW)
  // Grip detection
  handleDetectionResult: HandleDetectionResult | null;
  isDetectingHandle: boolean;

  // Creature sizing
  avatarHeight: number;
  creatureCategory: "tiny" | "small" | "medium" | "large" | "huge" | "colossal";
  autoScaleWeapon: boolean;
  weaponScaleOverride: number;

  // Manual adjustments for weapons
  manualPosition: { x: number; y: number; z: number };
  manualRotation: { x: number; y: number; z: number };

  // === SHARED STATE ===
  // Visualization
  showWireframe: boolean;
  showSkeleton: boolean; // NEW - for weapon mode

  // Animation
  currentAnimation: "tpose" | "walking" | "running";
  isAnimationPlaying: boolean;

  // Progress tracking
  isFitting: boolean;
  fittingProgress: number;

  // Error handling
  lastError: string | null;

  // History for undo/redo
  history: HistoryEntry[];
  historyIndex: number;

  // Loading states
  isExporting: boolean;
  isSavingConfig: boolean;
}

interface EquipmentFittingActions {
  // Asset selection
  setSelectedAvatar: (avatar: Asset | null) => void;
  setSelectedArmor: (armor: Asset | null) => void;
  setSelectedHelmet: (helmet: Asset | null) => void;
  setSelectedWeapon: (weapon: Asset | null) => void; // NEW
  setAssetTypeFilter: (type: EquipmentFittingState["assetTypeFilter"]) => void;
  handleAssetSelect: (asset: Asset) => void;

  // Equipment slot management
  setEquipmentSlot: (
    slot: string,
    viewerRef?: React.RefObject<ArmorFittingViewerRef | null>,
  ) => void;
  getSlotType: () => EquipmentSlotType; // NEW - returns 'armor' or 'weapon'

  // UI state
  setCurrentTab: (tab: "quick" | "advanced") => void; // NEW
  setShowDebugger: (show: boolean) => void;

  // === ARMOR FITTING ACTIONS ===
  // Fitting configuration
  setFittingConfig: (config: FittingConfig) => void;
  updateFittingConfig: (updates: Partial<FittingConfig>) => void;

  // Helmet fitting parameters
  setHelmetFittingMethod: (method: "auto" | "manual") => void;
  setHelmetSizeMultiplier: (multiplier: number) => void;
  setHelmetFitTightness: (tightness: number) => void;
  setHelmetVerticalOffset: (offset: number) => void;
  setHelmetForwardOffset: (offset: number) => void;
  setHelmetRotation: (rotation: { x: number; y: number; z: number }) => void;
  updateHelmetRotation: (axis: "x" | "y" | "z", value: number) => void;
  resetHelmetSettings: () => void;

  // Armor options
  setEnableWeightTransfer: (enabled: boolean) => void;

  // Armor visualization
  setVisualizationMode: (
    mode: EquipmentFittingState["visualizationMode"],
  ) => void;
  setSelectedBone: (bone: number) => void;

  // Armor fitting results
  setBodyRegions: (regions: Map<string, BodyRegion> | null) => void;
  setCollisions: (collisions: CollisionPoint[] | null) => void;
  setIsHelmetFitted: (fitted: boolean) => void;
  setIsHelmetAttached: (attached: boolean) => void;

  // Armor fitting actions
  performFitting: (
    viewerRef: React.RefObject<ArmorFittingViewerRef | null>,
  ) => Promise<void>;
  bindArmorToSkeleton: (
    viewerRef: React.RefObject<ArmorFittingViewerRef | null>,
  ) => Promise<void>;
  performHelmetFitting: (
    viewerRef: React.RefObject<ArmorFittingViewerRef | null>,
  ) => Promise<void>;
  attachHelmetToHead: (
    viewerRef: React.RefObject<ArmorFittingViewerRef | null>,
  ) => Promise<void>;
  detachHelmetFromHead: (
    viewerRef: React.RefObject<ArmorFittingViewerRef | null>,
  ) => Promise<void>;

  // === WEAPON FITTING ACTIONS === (NEW)
  // Grip detection
  detectGripPoint: (weaponAsset: Asset) => Promise<void>;
  setHandleDetectionResult: (result: HandleDetectionResult | null) => void;

  // Creature sizing
  setAvatarHeight: (height: number) => void;
  setCreatureCategory: (
    category: EquipmentFittingState["creatureCategory"],
  ) => void;
  setAutoScaleWeapon: (enabled: boolean) => void;
  setWeaponScaleOverride: (scale: number) => void;

  // Manual adjustments
  setManualPosition: (position: { x: number; y: number; z: number }) => void;
  setManualRotation: (rotation: { x: number; y: number; z: number }) => void;
  resetWeaponAdjustments: () => void; // NEW

  // === SHARED ACTIONS ===
  // Visualization
  setShowWireframe: (show: boolean) => void;
  setShowSkeleton: (show: boolean) => void; // NEW

  // Animation
  setCurrentAnimation: (
    animation: EquipmentFittingState["currentAnimation"],
  ) => void;
  setIsAnimationPlaying: (playing: boolean) => void;
  toggleAnimation: () => void;

  // Progress
  setIsFitting: (fitting: boolean) => void;
  setFittingProgress: (progress: number) => void;

  // Error handling
  setLastError: (error: string | null) => void;
  clearError: () => void;

  // History management
  saveToHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Export actions
  exportFittedArmor: (
    viewerRef: React.RefObject<ArmorFittingViewerRef | null>,
  ) => Promise<void>;
  exportEquippedAvatar: (
    viewerRef: React.RefObject<ArmorFittingViewerRef | null>,
  ) => Promise<void>;

  // Reset actions
  resetFitting: () => void;
  resetScene: (
    viewerRef: React.RefObject<ArmorFittingViewerRef | null>,
  ) => void;
  resetAll: () => void;

  // Configuration management
  saveConfiguration: () => Promise<void>;
  loadConfiguration: (file: File) => Promise<void>;
}

// Selectors for commonly used derived state
interface EquipmentFittingSelectors {
  isReadyToFit: () => boolean;
  hasUnsavedChanges: () => boolean;
  fittingMethod: () => FittingConfig["method"];
  currentProgress: () => string;
  isArmorMode: () => boolean; // NEW - true if Head/Spine2/Hips
  isWeaponMode: () => boolean; // NEW - true if Hand_R/Hand_L
}

type EquipmentFittingStore = EquipmentFittingState &
  EquipmentFittingActions &
  EquipmentFittingSelectors;

const initialState: EquipmentFittingState = {
  // Selected items
  selectedAvatar: null,
  selectedArmor: null,
  selectedHelmet: null,
  selectedWeapon: null,
  assetTypeFilter: "avatar",

  // Equipment slot
  equipmentSlot: "Spine2", // Default to armor chest

  // UI State
  currentTab: "quick",
  showDebugger: false,

  // === ARMOR FITTING STATE ===
  fittingConfig: {
    method: "shrinkwrap" as const,
    iterations: 8,
    stepSize: 0.15,
    smoothingRadius: 0.2,
    smoothingStrength: 0.3,
    targetOffset: 0.05,
    sampleRate: 1.0,
    preserveFeatures: true,
    featureAngleThreshold: 45,
    useImprovedShrinkwrap: false,
    preserveOpenings: true,
    pushInteriorVertices: true,
  },

  helmetFittingMethod: "auto",
  helmetSizeMultiplier: 1.0,
  helmetFitTightness: 1.0,
  helmetVerticalOffset: 0,
  helmetForwardOffset: 0,
  helmetRotation: { x: 0, y: 0, z: 0 },

  enableWeightTransfer: false,

  visualizationMode: "none",
  selectedBone: 0,

  bodyRegions: null,
  collisions: null,
  isArmorFitted: false,
  isArmorBound: false,
  isHelmetFitted: false,
  isHelmetAttached: false,

  // === WEAPON FITTING STATE ===
  handleDetectionResult: null,
  isDetectingHandle: false,

  avatarHeight: 1.83, // Medium human height
  creatureCategory: "medium",
  autoScaleWeapon: true,
  weaponScaleOverride: 1.0,

  manualPosition: { x: 0, y: 0, z: 0 },
  manualRotation: { x: 0, y: 0, z: 0 },

  // === SHARED STATE ===
  showWireframe: false,
  showSkeleton: false,

  currentAnimation: "tpose",
  isAnimationPlaying: false,

  isFitting: false,
  fittingProgress: 0,

  lastError: null,

  history: [],
  historyIndex: -1,

  isExporting: false,
  isSavingConfig: false,
};

export const useEquipmentFittingStore = create<EquipmentFittingStore>()(
  subscribeWithSelector(
    devtools(
      persist(
        immer((set, get) => ({
          ...initialState,

          // Asset selection
          setSelectedAvatar: (avatar) =>
            set((state) => {
              state.selectedAvatar = avatar;
              state.lastError = null;
            }),
          setSelectedArmor: (armor) =>
            set((state) => {
              state.selectedArmor = armor;
              state.lastError = null;
            }),
          setSelectedHelmet: (helmet) =>
            set((state) => {
              state.selectedHelmet = helmet;
              state.lastError = null;
            }),
          setSelectedWeapon: (weapon) =>
            set((state) => {
              state.selectedWeapon = weapon;
              state.lastError = null;
              // Reset manual adjustments when weapon changes
              if (weapon !== state.selectedWeapon) {
                state.manualPosition = { x: 0, y: 0, z: 0 };
                state.manualRotation = { x: 0, y: 0, z: 0 };
              }
            }),
          setAssetTypeFilter: (type) =>
            set((state) => {
              state.assetTypeFilter = type;
            }),
          handleAssetSelect: (asset) => {
            const { assetTypeFilter, saveToHistory } = get();
            saveToHistory();
            set((state) => {
              if (assetTypeFilter === "avatar") {
                state.selectedAvatar = asset;
              } else if (assetTypeFilter === "armor") {
                state.selectedArmor = asset;
              } else if (assetTypeFilter === "helmet") {
                state.selectedHelmet = asset;
              } else if (assetTypeFilter === "weapon") {
                state.selectedWeapon = asset;
              }
              state.lastError = null;
            });
          },

          // Equipment slot management
          setEquipmentSlot: (slot, viewerRef) => {
            const prevSlot = get().equipmentSlot;
            console.log(
              `=== SWITCHING EQUIPMENT SLOT: ${prevSlot} -> ${slot} ===`,
            );

            // Clear meshes from scene based on what we're leaving
            if (viewerRef?.current && prevSlot !== slot) {
              if (prevSlot === "Head" && slot !== "Head") {
                console.log("Leaving helmet mode - clearing helmet from scene");
                viewerRef.current.clearHelmet();
              } else if (prevSlot === "Spine2" && slot !== "Spine2") {
                console.log("Leaving armor mode - clearing armor from scene");
                viewerRef.current.clearArmor();
              }
            }

            set((state) => {
              state.equipmentSlot = slot;

              // Reset selection states when changing slots
              if (slot === "Head") {
                // Helmet mode
                state.selectedArmor = null;
                state.selectedWeapon = null;
                state.isArmorFitted = false;
                state.isArmorBound = false;
              } else if (slot === "Spine2" || slot === "Hips") {
                // Armor mode
                state.selectedHelmet = null;
                state.selectedWeapon = null;
                state.isHelmetFitted = false;
                state.isHelmetAttached = false;
              } else if (slot === "Hand_R" || slot === "Hand_L") {
                // Weapon mode
                state.selectedArmor = null;
                state.selectedHelmet = null;
                state.handleDetectionResult = null;
              }

              // Reset common states
              state.fittingProgress = 0;
              state.isFitting = false;
              state.lastError = null;

              // Reset animation to T-pose
              state.currentAnimation = "tpose";
              state.isAnimationPlaying = false;

              // Reset visual states
              state.showWireframe = false;

              // Update asset type filter to show equipment for the new slot
              if (state.selectedAvatar) {
                if (slot === "Head") {
                  state.assetTypeFilter = "helmet";
                } else if (slot === "Spine2" || slot === "Hips") {
                  state.assetTypeFilter = "armor";
                } else if (slot === "Hand_R" || slot === "Hand_L") {
                  state.assetTypeFilter = "weapon";
                }
              }
            });
          },

          getSlotType: () => {
            const slot = get().equipmentSlot;
            if (slot === "Hand_R" || slot === "Hand_L") {
              return "weapon";
            }
            return "armor";
          },

          // UI state
          setCurrentTab: (tab) =>
            set((state) => {
              state.currentTab = tab;
            }),
          setShowDebugger: (show) =>
            set((state) => {
              state.showDebugger = show;
            }),

          // === ARMOR FITTING ACTIONS ===
          setFittingConfig: (config) =>
            set((state) => {
              state.fittingConfig = config;
            }),
          updateFittingConfig: (updates) => {
            get().saveToHistory();
            set((state) => {
              Object.assign(state.fittingConfig, updates);
            });
          },

          setHelmetFittingMethod: (method) =>
            set((state) => {
              state.helmetFittingMethod = method;
            }),
          setHelmetSizeMultiplier: (multiplier) =>
            set((state) => {
              state.helmetSizeMultiplier = multiplier;
            }),
          setHelmetFitTightness: (tightness) =>
            set((state) => {
              state.helmetFitTightness = tightness;
            }),
          setHelmetVerticalOffset: (offset) =>
            set((state) => {
              state.helmetVerticalOffset = offset;
            }),
          setHelmetForwardOffset: (offset) =>
            set((state) => {
              state.helmetForwardOffset = offset;
            }),
          setHelmetRotation: (rotation) =>
            set((state) => {
              state.helmetRotation = rotation;
            }),
          updateHelmetRotation: (axis, value) =>
            set((state) => {
              state.helmetRotation[axis] = value;
            }),
          resetHelmetSettings: () =>
            set((state) => {
              state.helmetFittingMethod = "auto";
              state.helmetSizeMultiplier = 1.0;
              state.helmetFitTightness = 0.85;
              state.helmetVerticalOffset = 0;
              state.helmetForwardOffset = 0;
              state.helmetRotation = { x: 0, y: 0, z: 0 };
            }),

          setEnableWeightTransfer: (enabled) =>
            set((state) => {
              state.enableWeightTransfer = enabled;
            }),

          setVisualizationMode: (mode) =>
            set((state) => {
              state.visualizationMode = mode;
            }),
          setSelectedBone: (bone) =>
            set((state) => {
              state.selectedBone = bone;
            }),

          setBodyRegions: (regions) =>
            set((state) => {
              state.bodyRegions = regions;
            }),
          setCollisions: (collisions) =>
            set((state) => {
              state.collisions = collisions;
            }),
          setIsHelmetFitted: (fitted) =>
            set((state) => {
              state.isHelmetFitted = fitted;
            }),
          setIsHelmetAttached: (attached) =>
            set((state) => {
              state.isHelmetAttached = attached;
            }),

          performFitting: async (viewerRef) => {
            const {
              selectedAvatar,
              selectedArmor,
              fittingConfig,
              enableWeightTransfer,
              isFitting,
            } = get();

            if (!viewerRef.current || !selectedAvatar || !selectedArmor) {
              set((state) => {
                state.lastError = "Missing avatar or armor selection";
              });
              return;
            }

            if (isFitting) {
              console.warn("Already processing a fitting operation");
              return;
            }

            set((state) => {
              state.isFitting = true;
              state.fittingProgress = 0;
              state.lastError = null;
            });

            try {
              set((state) => {
                state.fittingProgress = 25;
              });
              console.log("🎯 Performing shrinkwrap-based armor fitting");

              const shrinkwrapParams = {
                ...fittingConfig,
                iterations: Math.min(fittingConfig.iterations || 8, 10),
                stepSize: fittingConfig.stepSize || 0.1,
                targetOffset: fittingConfig.targetOffset || 0.01,
                sampleRate: fittingConfig.sampleRate || 1.0,
                smoothingRadius: fittingConfig.smoothingRadius || 2,
                smoothingStrength: fittingConfig.smoothingStrength || 0.2,
                preserveFeatures: fittingConfig.preserveFeatures || false,
                featureAngleThreshold:
                  fittingConfig.featureAngleThreshold || 45,
                useImprovedShrinkwrap:
                  fittingConfig.useImprovedShrinkwrap || false,
                preserveOpenings: fittingConfig.preserveOpenings || false,
                pushInteriorVertices:
                  fittingConfig.pushInteriorVertices || false,
              };

              set((state) => {
                state.fittingProgress = 50;
              });
              viewerRef.current.performFitting?.(shrinkwrapParams);

              await new Promise((resolve) => setTimeout(resolve, 1000));
              set((state) => {
                state.fittingProgress = 80;
              });

              if (enableWeightTransfer) {
                set((state) => {
                  state.fittingProgress = 90;
                });
                viewerRef.current.transferWeights?.();
                await new Promise((resolve) => setTimeout(resolve, 800));
              }

              set((state) => {
                state.fittingProgress = 100;
                if (state.equipmentSlot === "Spine2") {
                  state.isArmorFitted = true;
                }
              });

              get().saveToHistory();
            } catch (error) {
              console.error("Fitting failed:", error);
              set((state) => {
                state.lastError = `Fitting failed: ${(error as Error).message}`;
              });
            } finally {
              setTimeout(() => {
                set((state) => {
                  state.isFitting = false;
                });
              }, 100);
            }
          },

          bindArmorToSkeleton: async (viewerRef) => {
            const { selectedAvatar, selectedArmor, isArmorFitted, isFitting } =
              get();

            if (
              !viewerRef.current ||
              !selectedAvatar ||
              !selectedArmor ||
              !isArmorFitted
            ) {
              set((state) => {
                state.lastError = "Must fit armor before binding to skeleton";
              });
              return;
            }

            if (isFitting) {
              console.warn("Already processing a binding operation");
              return;
            }

            set((state) => {
              state.isFitting = true;
              state.fittingProgress = 0;
              state.lastError = null;
            });

            try {
              console.log("🎯 Binding armor to skeleton");
              viewerRef.current.transferWeights();

              set((state) => {
                state.isArmorBound = true;
                state.fittingProgress = 100;
              });
            } catch (error) {
              console.error("Binding failed:", error);
              set((state) => {
                state.lastError = `Binding failed: ${(error as Error).message}`;
              });
            } finally {
              set((state) => {
                state.isFitting = false;
              });
            }
          },

          performHelmetFitting: async (viewerRef) => {
            const {
              selectedAvatar,
              selectedHelmet,
              helmetFittingMethod,
              helmetSizeMultiplier,
              helmetFitTightness,
              helmetVerticalOffset,
              helmetForwardOffset,
              helmetRotation,
            } = get();

            if (!viewerRef.current || !selectedAvatar || !selectedHelmet) {
              set((state) => {
                state.lastError = "Missing avatar or helmet selection";
              });
              return;
            }

            set((state) => {
              state.isFitting = true;
              state.lastError = null;
            });

            try {
              await viewerRef.current.performHelmetFitting({
                method: helmetFittingMethod,
                sizeMultiplier: helmetSizeMultiplier,
                fitTightness: helmetFitTightness,
                verticalOffset: helmetVerticalOffset,
                forwardOffset: helmetForwardOffset,
                rotation: {
                  x: (helmetRotation.x * Math.PI) / 180,
                  y: (helmetRotation.y * Math.PI) / 180,
                  z: (helmetRotation.z * Math.PI) / 180,
                },
              });

              set((state) => {
                state.isHelmetFitted = true;
              });
            } catch (error) {
              console.error("Helmet fitting failed:", error);
              set((state) => {
                state.lastError = `Helmet fitting failed: ${(error as Error).message}`;
              });
            } finally {
              set((state) => {
                state.isFitting = false;
              });
            }
          },

          attachHelmetToHead: async (viewerRef) => {
            if (!viewerRef.current) return;

            try {
              viewerRef.current.attachHelmetToHead();
              set((state) => {
                state.isHelmetAttached = true;
              });
            } catch (error) {
              console.error("Helmet attachment failed:", error);
              set((state) => {
                state.lastError = `Helmet attachment failed: ${(error as Error).message}`;
              });
            }
          },

          detachHelmetFromHead: async (viewerRef) => {
            if (!viewerRef.current) return;

            try {
              viewerRef.current.detachHelmetFromHead();
              set((state) => {
                state.isHelmetAttached = false;
              });
            } catch (error) {
              console.error("Helmet detachment failed:", error);
              set((state) => {
                state.lastError = `Helmet detachment failed: ${(error as Error).message}`;
              });
            }
          },

          // === WEAPON FITTING ACTIONS ===
          detectGripPoint: async (weaponAsset: Asset) => {
            if (!weaponAsset || !weaponAsset.hasModel) {
              set((state) => {
                state.lastError =
                  "No weapon model available for grip detection";
              });
              return;
            }

            set((state) => {
              state.isDetectingHandle = true;
              state.lastError = null;
            });

            try {
              const detector = new WeaponHandleDetector();
              const modelUrl = `/api/assets/${weaponAsset.id}/model`;
              const result = await detector.detectHandleArea(modelUrl, true);

              set((state) => {
                state.handleDetectionResult = result;
              });

              // Cleanup
              detector.dispose();
            } catch (error) {
              console.error("Grip detection failed:", error);
              set((state) => {
                state.lastError = `Grip detection failed: ${(error as Error).message}`;
              });
            } finally {
              set((state) => {
                state.isDetectingHandle = false;
              });
            }
          },

          setHandleDetectionResult: (result) =>
            set((state) => {
              state.handleDetectionResult = result;
            }),

          setAvatarHeight: (height) =>
            set((state) => {
              state.avatarHeight = height;
            }),

          setCreatureCategory: (category) =>
            set((state) => {
              state.creatureCategory = category;
              // Auto-adjust avatar height based on category
              const categoryHeights = {
                tiny: 0.6,
                small: 1.2,
                medium: 1.83,
                large: 2.5,
                huge: 4.0,
                colossal: 6.0,
              };
              state.avatarHeight = categoryHeights[category];
            }),

          setAutoScaleWeapon: (enabled) =>
            set((state) => {
              state.autoScaleWeapon = enabled;
            }),

          setWeaponScaleOverride: (scale) =>
            set((state) => {
              state.weaponScaleOverride = scale;
            }),

          setManualPosition: (position) =>
            set((state) => {
              state.manualPosition = position;
            }),

          setManualRotation: (rotation) =>
            set((state) => {
              state.manualRotation = rotation;
            }),

          resetWeaponAdjustments: () =>
            set((state) => {
              state.manualPosition = { x: 0, y: 0, z: 0 };
              state.manualRotation = { x: 0, y: 0, z: 0 };
              state.weaponScaleOverride = 1.0;
              state.avatarHeight = 1.83;
              state.creatureCategory = "medium";
            }),

          // === SHARED ACTIONS ===
          setShowWireframe: (show) =>
            set((state) => {
              state.showWireframe = show;
            }),

          setShowSkeleton: (show) =>
            set((state) => {
              state.showSkeleton = show;
            }),

          setCurrentAnimation: (animation) =>
            set((state) => {
              state.currentAnimation = animation;
              if (animation === "tpose") {
                state.isAnimationPlaying = false;
              }
            }),

          setIsAnimationPlaying: (playing) =>
            set((state) => {
              state.isAnimationPlaying = playing;
            }),

          toggleAnimation: () =>
            set((state) => {
              state.isAnimationPlaying = !state.isAnimationPlaying;
            }),

          setIsFitting: (fitting) =>
            set((state) => {
              state.isFitting = fitting;
            }),

          setFittingProgress: (progress) =>
            set((state) => {
              state.fittingProgress = progress;
            }),

          setLastError: (error) =>
            set((state) => {
              state.lastError = error;
            }),

          clearError: () =>
            set((state) => {
              state.lastError = null;
            }),

          // History management
          saveToHistory: () =>
            set((state) => {
              const entry: HistoryEntry = {
                fittingConfig: { ...state.fittingConfig },
                timestamp: Date.now(),
              };

              state.history = state.history.slice(0, state.historyIndex + 1);
              state.history.push(entry);
              state.historyIndex = state.history.length - 1;

              if (state.history.length > 50) {
                state.history = state.history.slice(-50);
                state.historyIndex = state.history.length - 1;
              }
            }),

          undo: () =>
            set((state) => {
              if (state.historyIndex > 0) {
                state.historyIndex--;
                const entry = state.history[state.historyIndex];
                state.fittingConfig = { ...entry.fittingConfig };
              }
            }),

          redo: () =>
            set((state) => {
              if (state.historyIndex < state.history.length - 1) {
                state.historyIndex++;
                const entry = state.history[state.historyIndex];
                state.fittingConfig = { ...entry.fittingConfig };
              }
            }),

          canUndo: () => get().historyIndex > 0,
          canRedo: () => get().historyIndex < get().history.length - 1,

          // Export actions
          exportFittedArmor: async (viewerRef) => {
            if (!viewerRef.current) return;

            set((state) => {
              state.isExporting = true;
              state.lastError = null;
            });

            try {
              const arrayBuffer = await viewerRef.current.exportFittedModel();
              const blob = new Blob([arrayBuffer], {
                type: "model/gltf-binary",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `fitted_armor_${Date.now()}.glb`;
              a.click();
              URL.revokeObjectURL(url);
            } catch (error) {
              console.error("Export failed:", error);
              set((state) => {
                state.lastError = `Export failed: ${(error as Error).message}`;
              });
            } finally {
              set((state) => {
                state.isExporting = false;
              });
            }
          },

          exportEquippedAvatar: async (viewerRef) => {
            if (!viewerRef.current) return;

            set((state) => {
              state.isExporting = true;
              state.lastError = null;
            });

            try {
              const arrayBuffer = await viewerRef.current.exportFittedModel();
              const blob = new Blob([arrayBuffer], {
                type: "model/gltf-binary",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `equipped_avatar_${Date.now()}.glb`;
              a.click();
              URL.revokeObjectURL(url);
            } catch (error) {
              console.error("Export failed:", error);
              set((state) => {
                state.lastError = `Export failed: ${(error as Error).message}`;
              });
            } finally {
              set((state) => {
                state.isExporting = false;
              });
            }
          },

          // Reset actions
          resetFitting: () => {
            set((state) => {
              state.fittingProgress = 0;
              state.isFitting = false;
              state.bodyRegions = null;
              state.collisions = null;
              state.lastError = null;
              state.isArmorFitted = false;
              state.isArmorBound = false;
              state.isHelmetFitted = false;
              state.isHelmetAttached = false;
              state.currentAnimation = "tpose";
              state.isAnimationPlaying = false;
            });
          },

          resetScene: (viewerRef) => {
            const { equipmentSlot } = get();

            console.log("=== RESETTING SCENE ===");

            if (!viewerRef?.current) {
              console.error("No viewer ref available for reset");
              return;
            }

            viewerRef.current.resetTransform();

            set((state) => {
              state.fittingProgress = 0;
              state.isFitting = false;
              state.lastError = null;
              state.showWireframe = false;
              state.currentAnimation = "tpose";
              state.isAnimationPlaying = false;

              if (equipmentSlot === "Head") {
                state.isHelmetFitted = false;
                state.isHelmetAttached = false;
                state.helmetFittingMethod = "auto";
                state.helmetSizeMultiplier = 1.0;
                state.helmetFitTightness = 1.0;
                state.helmetVerticalOffset = 0;
                state.helmetForwardOffset = 0;
                state.helmetRotation = { x: 0, y: 0, z: 0 };
              } else if (equipmentSlot === "Spine2") {
                state.isArmorFitted = false;
                state.isArmorBound = false;
                state.bodyRegions = null;
                state.collisions = null;
                state.fittingConfig = { ...initialState.fittingConfig };
              } else if (
                equipmentSlot === "Hand_R" ||
                equipmentSlot === "Hand_L"
              ) {
                state.handleDetectionResult = null;
                state.manualPosition = { x: 0, y: 0, z: 0 };
                state.manualRotation = { x: 0, y: 0, z: 0 };
              }
            });
          },

          resetAll: () => {
            set({
              ...initialState,
              history: [],
              historyIndex: -1,
            });
          },

          // Configuration management
          saveConfiguration: async () => {
            const {
              selectedAvatar,
              selectedArmor,
              selectedWeapon,
              fittingConfig,
              enableWeightTransfer,
              equipmentSlot,
            } = get();

            if (!selectedAvatar || (!selectedArmor && !selectedWeapon)) {
              set((state) => {
                state.lastError =
                  "Please select both avatar and equipment before saving";
              });
              return;
            }

            set((state) => {
              state.isSavingConfig = true;
              state.lastError = null;
            });

            try {
              const config = {
                avatarId: selectedAvatar.id,
                armorId: selectedArmor?.id,
                weaponId: selectedWeapon?.id,
                equipmentSlot,
                fittingConfig,
                enableWeightTransfer,
                timestamp: new Date().toISOString(),
              };

              const json = JSON.stringify(config, null, 2);
              const blob = new Blob([json], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `equipment_fitting_config_${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            } catch (error) {
              set((state) => {
                state.lastError = `Failed to save configuration: ${(error as Error).message}`;
              });
            } finally {
              set((state) => {
                state.isSavingConfig = false;
              });
            }
          },

          loadConfiguration: async (file: File) => {
            set((state) => {
              state.lastError = null;
            });

            try {
              const text = await file.text();
              const config = JSON.parse(text);

              set((state) => {
                state.fittingConfig = config.fittingConfig;
                state.enableWeightTransfer = config.enableWeightTransfer;
                if (config.equipmentSlot) {
                  state.equipmentSlot = config.equipmentSlot;
                }
              });

              get().saveToHistory();
            } catch (error) {
              set((state) => {
                state.lastError = `Failed to load configuration: ${(error as Error).message}`;
              });
            }
          },

          // Selectors
          isReadyToFit: () => {
            const {
              selectedAvatar,
              selectedArmor,
              selectedHelmet,
              selectedWeapon,
              equipmentSlot,
            } = get();

            if (equipmentSlot === "Head") {
              return !!(selectedAvatar && selectedHelmet);
            } else if (equipmentSlot === "Spine2" || equipmentSlot === "Hips") {
              return !!(selectedAvatar && selectedArmor);
            } else if (
              equipmentSlot === "Hand_R" ||
              equipmentSlot === "Hand_L"
            ) {
              return !!(selectedAvatar && selectedWeapon);
            }
            return false;
          },

          hasUnsavedChanges: () => {
            const { history, historyIndex } = get();
            return historyIndex < history.length - 1 || history.length > 0;
          },

          fittingMethod: () => get().fittingConfig.method,

          currentProgress: () => {
            const progress = get().fittingProgress;
            if (progress === 0) return "Ready";
            if (progress === 100) return "Complete";
            if (progress < 50) return "Positioning...";
            if (progress < 75) return "Fitting...";
            return "Finalizing...";
          },

          isArmorMode: () => {
            const slot = get().equipmentSlot;
            return slot === "Head" || slot === "Spine2" || slot === "Hips";
          },

          isWeaponMode: () => {
            const slot = get().equipmentSlot;
            return slot === "Hand_R" || slot === "Hand_L";
          },
        })),
        {
          name: "equipment-fitting-storage",
          partialize: (state) => ({
            fittingConfig: state.fittingConfig,
            enableWeightTransfer: state.enableWeightTransfer,
            equipmentSlot: state.equipmentSlot,
            visualizationMode: state.visualizationMode,
            showWireframe: state.showWireframe,
            avatarHeight: state.avatarHeight,
            creatureCategory: state.creatureCategory,
            autoScaleWeapon: state.autoScaleWeapon,
            currentTab: state.currentTab,
          }),
        },
      ),
      {
        name: "equipment-fitting-store",
      },
    ),
  ),
);

// Convenient selectors to use in components
export const useIsReadyToFit = () =>
  useEquipmentFittingStore((state) => state.isReadyToFit());
export const useHasUnsavedChanges = () =>
  useEquipmentFittingStore((state) => state.hasUnsavedChanges());
export const useFittingMethod = () =>
  useEquipmentFittingStore((state) => state.fittingMethod());
export const useCurrentProgress = () =>
  useEquipmentFittingStore((state) => state.currentProgress());
export const useIsArmorMode = () =>
  useEquipmentFittingStore((state) => state.isArmorMode());
export const useIsWeaponMode = () =>
  useEquipmentFittingStore((state) => state.isWeaponMode());
