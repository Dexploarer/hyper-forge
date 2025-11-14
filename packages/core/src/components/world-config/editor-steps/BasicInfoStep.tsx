import { Info, Tag, X } from "lucide-react";
import React from "react";

import {
  Input,
  Textarea,
  Button,
  SelectOrCustom,
  HelpTooltip,
  Checkbox,
} from "@/components/common";

interface BasicInfoStepProps {
  data: {
    name: string;
    description: string;
    genre: string;
    tags: string[];
    isTemplate: boolean;
    templateName?: string;
  };
  onChange: (data: any) => void;
}

const GENRES = [
  "Fantasy",
  "Dark Fantasy",
  "Sci-Fi",
  "Cyberpunk",
  "Post-Apocalyptic",
  "Steampunk",
  "Urban Fantasy",
  "Horror",
  "Historical",
  "Modern",
  "Superhero",
  "Western",
  "Space Opera",
  "Magical Realism",
  "Custom",
];

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  data,
  onChange,
}) => {
  const [newTag, setNewTag] = React.useState("");

  const handleAddTag = () => {
    if (newTag.trim() && !data.tags.includes(newTag.trim())) {
      onChange({ ...data, tags: [...data.tags, newTag.trim()] });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    onChange({ ...data, tags: data.tags.filter((t) => t !== tag) });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border-primary">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
          <Info className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">
            Basic Information
          </h2>
          <p className="text-sm text-text-secondary">
            Start with the essentials: name, genre, and description
          </p>
        </div>
      </div>

      {/* Configuration Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-primary flex items-center gap-2">
          Configuration Name <span className="text-red-400">*</span>
          <HelpTooltip content="Give your world configuration a unique, descriptive name that helps identify it at a glance. This will be shown throughout the application when referencing this configuration." />
        </label>
        <Input
          value={data.name}
          onChange={(e) => onChange({ ...data, name: e.target.value })}
          placeholder="e.g., High Fantasy Kingdom, Cyberpunk Megacity..."
          className="w-full"
          maxLength={255}
        />
      </div>

      {/* Genre */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-primary flex items-center gap-2">
          Genre <span className="text-red-400">*</span>
          <HelpTooltip content="Select a predefined genre or enter a custom one that best describes your world's setting and atmosphere." />
        </label>
        <SelectOrCustom
          value={data.genre}
          onChange={(value) => onChange({ ...data, genre: value })}
          options={GENRES.filter((g) => g !== "Custom")}
          label=""
          placeholder="Select a genre or type your own..."
          customPlaceholder="Enter custom genre..."
          className="w-full"
          allowEmpty={false}
        />
        <p className="text-xs text-text-tertiary">
          Choose the primary genre that defines your world
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-primary flex items-center gap-2">
          Description <span className="text-red-400">*</span>
          <HelpTooltip content="Provide a comprehensive description of your world that captures its themes, setting, tone, and unique characteristics. This helps guide AI generation to match your vision." />
        </label>
        <Textarea
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          placeholder="Describe the world this configuration represents. Include key themes, setting, and tone..."
          className="w-full min-h-[120px]"
          maxLength={1000}
        />
        <p className="text-xs text-text-tertiary text-right">
          {data.description.length} / 1000 characters
        </p>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-primary flex items-center gap-2">
          <Tag className="w-4 h-4" />
          Tags
          <HelpTooltip content="Add searchable tags to categorize and quickly find this configuration. Tags help organize your world configs and make them easier to discover." />
        </label>
        <div className="flex items-center gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add tags (e.g., magic, dragons, politics...)"
            className="flex-1"
            maxLength={50}
          />
          <Button
            variant="secondary"
            onClick={handleAddTag}
            disabled={!newTag.trim()}
          >
            Add
          </Button>
        </div>
        {data.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {data.tags.map((tag) => (
              <div
                key={tag}
                className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium flex items-center gap-2"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-red-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-text-tertiary">
          Add tags to help categorize and search for this configuration
        </p>
      </div>

      {/* Template Option */}
      <div className="space-y-3 p-4 bg-bg-tertiary/30 rounded-lg border border-border-primary">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={data.isTemplate}
            onChange={(checked) =>
              onChange({
                ...data,
                isTemplate: checked,
                templateName: checked
                  ? data.templateName || data.name
                  : undefined,
              })
            }
          />
          <div className="flex-1">
            <label className="text-sm font-medium text-text-primary cursor-pointer flex items-center gap-2">
              Mark as Template
              <HelpTooltip content="Save this configuration as a reusable template that can be quickly duplicated for new projects with similar settings." />
            </label>
            <p className="text-xs text-text-secondary mt-1">
              Templates can be reused to create new configurations quickly
            </p>
          </div>
        </div>

        {data.isTemplate && (
          <div className="space-y-2 pl-7">
            <label className="text-sm font-medium text-text-primary">
              Template Name
            </label>
            <Input
              value={data.templateName || ""}
              onChange={(e) =>
                onChange({ ...data, templateName: e.target.value })
              }
              placeholder="e.g., Standard Fantasy, Sci-Fi Starter..."
              className="w-full"
              maxLength={100}
            />
          </div>
        )}
      </div>
    </div>
  );
};
