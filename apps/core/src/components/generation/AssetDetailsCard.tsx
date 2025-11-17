import {
  FileText,
  Layers,
  Package,
  User,
  Gamepad2,
  Eye,
  EyeOff,
} from "lucide-react";
import React from "react";

import { GameStylePrompt } from "../../services/api/PromptService";
// import { cn } from '../../styles'
import { CustomAssetType } from "../../types/generation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Textarea,
} from "../common";

interface AssetDetailsCardProps {
  generationType:
    | "item"
    | "avatar"
    | "building"
    | "environment"
    | "prop"
    | undefined;
  assetName: string;
  assetType: string;
  description: string;
  gameStyle: string;
  customStyle: string;
  assetVisibility: "public" | "private";
  customAssetTypes: CustomAssetType[];
  customGameStyles?: Record<string, GameStylePrompt>;
  onAssetNameChange: (value: string) => void;
  onAssetTypeChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onGameStyleChange: (style: "runescape" | "custom") => void;
  onCustomStyleChange: (value: string) => void;
  onAssetVisibilityChange: (visibility: "public" | "private") => void;
  onSaveCustomGameStyle?: (
    styleId: string,
    style: GameStylePrompt,
  ) => Promise<boolean>;
}

export const AssetDetailsCard: React.FC<AssetDetailsCardProps> = ({
  generationType,
  assetName,
  assetType,
  description,
  gameStyle,
  customStyle,
  assetVisibility,
  customAssetTypes,
  customGameStyles = {},
  onAssetNameChange,
  onAssetTypeChange,
  onDescriptionChange,
  onGameStyleChange,
  onCustomStyleChange,
  onAssetVisibilityChange,
  onSaveCustomGameStyle,
}) => {
  return (
    <Card className="overflow-hidden bg-gradient-to-br from-bg-primary via-bg-primary to-primary/5 border-border-primary shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            {generationType === "avatar" ? (
              <User className="w-5 h-5 text-primary" />
            ) : (
              <Package className="w-5 h-5 text-primary" />
            )}
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">
              {generationType === "avatar" ? "Avatar Details" : "Asset Details"}
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Define what you want to create
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <FileText className="w-3.5 h-3.5 text-primary" />
              </div>
              {generationType === "avatar" ? "Avatar Name" : "Asset Name"}
            </label>
            <Input
              value={assetName}
              onChange={(e) => onAssetNameChange(e.target.value)}
              placeholder={
                generationType === "avatar"
                  ? "e.g., Goblin Warrior"
                  : "e.g., Dragon Sword"
              }
              className="w-full bg-bg-secondary/70 border-border-primary/50 focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <Layers className="w-3.5 h-3.5 text-primary" />
              </div>
              Asset Type
            </label>
            <select
              value={assetType}
              onChange={(e) => onAssetTypeChange(e.target.value)}
              className="w-full px-4 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-20 transition-all appearance-none cursor-pointer [&>option]:bg-bg-primary [&>option]:text-text-primary"
            >
              {generationType === "avatar" ? (
                <>
                  <option value="character">👤 Character</option>
                  <option value="humanoid">🧍 Humanoid</option>
                  <option value="npc">🤝 NPC</option>
                  <option value="creature">🐲 Creature</option>
                </>
              ) : (
                <>
                  <option value="weapon">⚔️ Weapon</option>
                  <option value="armor">🛡️ Armor</option>
                  <option value="tool">🔨 Tool</option>
                  <option value="building">🏰 Building</option>
                  <option value="consumable">🧪 Consumable</option>
                  <option value="resource">💎 Resource</option>
                </>
              )}
              {customAssetTypes
                .filter((t) => t.name)
                .map((type) => (
                  <option key={type.name} value={type.name.toLowerCase()}>
                    ✨ {type.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <FileText className="w-3.5 h-3.5 text-primary" />
            </div>
            Description
          </label>
          <Textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Describe your asset in detail..."
            rows={4}
            className="w-full resize-none bg-bg-secondary/70 border-border-primary/50 focus:border-primary"
          />
        </div>

        {/* Game Style Selection */}
        <GameStyleSelector
          gameStyle={gameStyle}
          customStyle={customStyle}
          customGameStyles={customGameStyles}
          onGameStyleChange={onGameStyleChange}
          onCustomStyleChange={onCustomStyleChange}
          onSaveCustomGameStyle={onSaveCustomGameStyle}
        />

        {/* Visibility Toggle */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              {assetVisibility === "public" ? (
                <Eye className="w-3.5 h-3.5 text-primary" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-primary" />
              )}
            </div>
            Asset Visibility
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onAssetVisibilityChange("public")}
              className={`flex-1 px-4 py-2.5 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                assetVisibility === "public"
                  ? "bg-primary/10 border-primary text-primary font-medium"
                  : "bg-bg-secondary border-border-primary text-text-secondary hover:border-primary/50"
              }`}
            >
              <Eye className="w-4 h-4" />
              Public
            </button>
            <button
              type="button"
              onClick={() => onAssetVisibilityChange("private")}
              className={`flex-1 px-4 py-2.5 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                assetVisibility === "private"
                  ? "bg-primary/10 border-primary text-primary font-medium"
                  : "bg-bg-secondary border-border-primary text-text-secondary hover:border-primary/50"
              }`}
            >
              <EyeOff className="w-4 h-4" />
              Private
            </button>
          </div>
          <div className="px-3 py-2 bg-primary/5 border border-primary/10 rounded-lg">
            <p className="text-xs text-text-secondary">
              {assetVisibility === "public"
                ? "Anyone can view this asset"
                : "Only you can view this asset"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Sub-component for game style selection
const GameStyleSelector: React.FC<{
  gameStyle: string;
  customStyle: string;
  customGameStyles?: Record<string, GameStylePrompt>;
  onGameStyleChange: (style: "runescape" | "custom") => void;
  onCustomStyleChange: (value: string) => void;
  onSaveCustomGameStyle?: (
    styleId: string,
    style: GameStylePrompt,
  ) => Promise<boolean>;
}> = ({
  gameStyle,
  customStyle,
  customGameStyles = {},
  onGameStyleChange,
  onCustomStyleChange,
  onSaveCustomGameStyle: _onSaveCustomGameStyle,
}) => {
  // Determine the current selected value for the dropdown
  const currentValue =
    gameStyle === "runescape"
      ? "runescape"
      : gameStyle === "custom" && customStyle
        ? `custom:${customStyle}`
        : "runescape";

  const handleChange = (value: string) => {
    if (value === "runescape") {
      onGameStyleChange("runescape");
    } else if (value.startsWith("custom:")) {
      const styleId = value.replace("custom:", "");
      onGameStyleChange("custom");
      onCustomStyleChange(styleId);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-text-primary flex items-center gap-2">
        <div className="p-1.5 bg-primary/10 rounded-lg">
          <Gamepad2 className="w-3.5 h-3.5 text-primary" />
        </div>
        Game Style
      </label>
      <select
        value={currentValue}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full px-4 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none cursor-pointer [&>option]:bg-bg-primary [&>option]:text-text-primary"
      >
        <option value="runescape">RuneScape 2007</option>
        {Object.entries(customGameStyles).map(([styleId, style]) => (
          <option key={styleId} value={`custom:${styleId}`}>
            {style.name}
          </option>
        ))}
      </select>
      {/* Show style details below the dropdown */}
      {gameStyle === "runescape" && (
        <div className="px-3 py-2 bg-primary/5 border border-primary/10 rounded-lg">
          <p className="text-xs text-text-secondary">Classic low-poly style</p>
        </div>
      )}
      {gameStyle === "custom" &&
        customStyle &&
        customGameStyles[customStyle] && (
          <div className="px-3 py-2 bg-primary/5 border border-primary/10 rounded-lg">
            <p className="text-xs text-text-secondary">
              {customGameStyles[customStyle].base}
            </p>
          </div>
        )}
    </div>
  );
};

export default AssetDetailsCard;
