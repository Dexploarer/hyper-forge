import {
  Search,
  User,
  ChevronRight,
  Loader2,
  Sword,
  Box,
  HardHat,
  Shirt,
} from "lucide-react";
import React, { useState, useMemo } from "react";

import { cn } from "../../styles";
import { Asset } from "../../types";
import { Badge, Input } from "../common";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";

interface ArmorAssetListProps {
  assets: Asset[];
  loading: boolean;
  assetType: "avatar" | "armor" | "helmet" | "weapon"; // UPDATED - added weapon
  selectedAsset: Asset | null;
  selectedAvatar?: Asset | null;
  selectedArmor?: Asset | null;
  selectedHelmet?: Asset | null; // NEW
  selectedWeapon?: Asset | null; // NEW - for weapon selection
  onAssetSelect: (asset: Asset) => void;
  onAssetTypeChange: (type: "avatar" | "armor" | "helmet" | "weapon") => void; // UPDATED - added weapon
  hideTypeToggle?: boolean; // NEW - for armor fitting page
  equipmentSlot?: "Head" | "Spine2" | "Pelvis" | "Hand_R" | "Hand_L"; // UPDATED - added weapon slots
}

export const ArmorAssetList: React.FC<ArmorAssetListProps> = ({
  assets,
  loading,
  assetType,
  selectedAsset,
  selectedAvatar,
  selectedArmor,
  selectedHelmet, // NEW
  selectedWeapon, // NEW
  onAssetSelect,
  onAssetTypeChange,
  hideTypeToggle = false, // NEW
  equipmentSlot = "Spine2", // NEW - default to chest
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter assets - SIMPLE: just filter by type
  const avatarAssets = useMemo(
    () => assets.filter((a) => a.type === "character"),
    [assets],
  );

  const armorAssets = useMemo(
    () => assets.filter((a) => a.type === "armor"),
    [assets],
  );

  const helmetAssets = useMemo(
    () => assets.filter((a) => a.type === "armor"),
    [assets],
  );

  const weaponAssets = useMemo(
    () => assets.filter((a) => a.type === "weapon"),
    [assets],
  );

  const filteredAssets = useMemo(() => {
    // Filter based on asset type only
    let baseAssets: Asset[] = [];

    if (assetType === "avatar") {
      baseAssets = avatarAssets;
    } else if (assetType === "armor") {
      baseAssets = armorAssets;
    } else if (assetType === "helmet") {
      baseAssets = helmetAssets;
    } else if (assetType === "weapon") {
      baseAssets = weaponAssets;
    }

    return baseAssets.filter((a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [
    assetType,
    avatarAssets,
    armorAssets,
    helmetAssets,
    weaponAssets,
    searchTerm,
  ]);

  // Infinite scroll
  const { displayCount, isLoadingMore, containerRef } = useInfiniteScroll({
    totalItems: filteredAssets.length,
    initialCount: 20,
    loadIncrement: 10,
    threshold: 300,
  });

  // Slice assets for infinite scroll
  const visibleAssets = useMemo(
    () => filteredAssets.slice(0, displayCount),
    [filteredAssets, displayCount],
  );

  // Get icon for asset type - SIMPLE
  const getAssetIcon = (asset: Asset) => {
    if (asset.type === "character") return User;
    if (asset.type === "weapon") return Sword;
    if (asset.type === "armor") return Shirt;
    return Box; // Default fallback
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border-primary bg-bg-primary bg-opacity-30">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          {hideTypeToggle
            ? assetType === "avatar"
              ? "Select Avatar"
              : assetType === "helmet"
                ? "Select Helmet"
                : assetType === "weapon"
                  ? "Select Weapon"
                  : "Select Armor"
            : "Asset Library"}
        </h2>

        {/* Asset Type Toggle - Show avatars and appropriate equipment type */}
        {hideTypeToggle && (
          <div className="flex gap-2 p-1 bg-bg-tertiary/30 rounded-xl">
            <button
              onClick={() => onAssetTypeChange("avatar")}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                "flex items-center justify-center gap-2",
                assetType === "avatar"
                  ? "bg-primary/80 text-white shadow-lg shadow-primary/20"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/20",
              )}
            >
              <User size={16} />
              Avatars
            </button>
            <button
              onClick={() => {
                const isHandSlot =
                  equipmentSlot === "Hand_R" || equipmentSlot === "Hand_L";
                onAssetTypeChange(
                  equipmentSlot === "Head"
                    ? "helmet"
                    : isHandSlot
                      ? "weapon"
                      : "armor",
                );
              }}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                "flex items-center justify-center gap-2",
                assetType ===
                  (equipmentSlot === "Head"
                    ? "helmet"
                    : equipmentSlot === "Hand_R" || equipmentSlot === "Hand_L"
                      ? "weapon"
                      : "armor")
                  ? "bg-primary/80 text-white shadow-lg shadow-primary/20"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/20",
              )}
            >
              {equipmentSlot === "Head" ? (
                <>
                  <HardHat size={16} />
                  Helmets
                </>
              ) : equipmentSlot === "Hand_R" || equipmentSlot === "Hand_L" ? (
                <>
                  <Sword size={16} />
                  Weapons
                </>
              ) : (
                <>
                  <Shirt size={16} />
                  Armor
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto custom-scrollbar"
      >
        {/* Search */}
        <div className="p-3 sticky top-0 solid-panel z-10 ">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
              size={18}
            />
            <Input
              type="text"
              placeholder={`Search ${assetType}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3"
            />
          </div>
        </div>

        {/* Asset List */}
        <div className="p-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-32 gap-3">
              <Loader2 className="animate-spin text-primary" size={28} />
              <p className="text-sm text-text-tertiary">Loading assets...</p>
            </div>
          ) : visibleAssets.length === 0 && !isLoadingMore ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-bg-secondary/50 rounded-2xl mb-4">
                {assetType === "avatar" ? (
                  <User size={24} className="text-text-tertiary" />
                ) : assetType === "weapon" ? (
                  <Sword size={24} className="text-text-tertiary" />
                ) : assetType === "helmet" ? (
                  <HardHat size={24} className="text-text-tertiary" />
                ) : (
                  <Shirt size={24} className="text-text-tertiary" />
                )}
              </div>
              <p className="text-text-tertiary text-sm">
                No {assetType}s found
              </p>
              {searchTerm && (
                <p className="text-text-tertiary/60 text-xs mt-1">
                  Try a different search term
                </p>
              )}
            </div>
          ) : (
            // All types: Avatar, Armor, Helmet, or Weapon - simple list
            <div className="space-y-1.5">
              {visibleAssets.map((asset) => {
                const Icon = getAssetIcon(asset);
                return (
                  <button
                    key={asset.id}
                    onClick={() => onAssetSelect(asset)}
                    className={cn(
                      "w-full p-2 rounded-lg border transition-all duration-200 text-left group",
                      selectedAsset?.id === asset.id
                        ? "bg-primary/20 border-primary shadow-md shadow-primary/20"
                        : "bg-bg-tertiary/20 border-white/10 hover:border-white/20 hover:bg-bg-tertiary/30",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-bg-tertiary rounded flex items-center justify-center">
                          <Icon className="w-5 h-5 text-text-secondary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-text-primary">
                            {asset.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="secondary"
                              size="sm"
                              className="capitalize bg-bg-tertiary/50 text-text-secondary border border-white/10"
                            >
                              {asset.type}
                            </Badge>
                            <Badge
                              variant="primary"
                              size="sm"
                              className="bg-primary/20 text-primary border border-primary/30"
                            >
                              <Box size={10} className="mr-1" />
                              3D
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <ChevronRight
                        className={cn(
                          "w-4 h-4 transition-transform",
                          selectedAsset?.id === asset.id
                            ? "text-primary"
                            : "text-text-tertiary group-hover:text-text-secondary group-hover:translate-x-0.5",
                        )}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Loading indicator for infinite scroll */}
          {isLoadingMore && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <span className="ml-2 text-sm text-text-secondary">
                Loading more assets...
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
