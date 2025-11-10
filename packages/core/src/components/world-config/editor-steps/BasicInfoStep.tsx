import { Info, Tag, X } from "lucide-react";
import React from "react";

import { Input, Textarea, Button } from "@/components/common";

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
        <label className="text-sm font-medium text-text-primary">
          Configuration Name <span className="text-red-400">*</span>
        </label>
        <Input
          value={data.name}
          onChange={(e) => onChange({ ...data, name: e.target.value })}
          placeholder="e.g., High Fantasy Kingdom, Cyberpunk Megacity..."
          className="w-full"
          maxLength={255}
        />
        <p className="text-xs text-text-tertiary">
          Give your world configuration a descriptive name
        </p>
      </div>

      {/* Genre */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-primary">
          Genre <span className="text-red-400">*</span>
        </label>
        <select
          value={data.genre}
          onChange={(e) => onChange({ ...data, genre: e.target.value })}
          className="w-full px-4 py-2.5 bg-bg-tertiary border border-border-primary/50 rounded-lg text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 [&>option]:bg-bg-tertiary [&>option]:text-text-primary"
        >
          <option value="">Select a genre</option>
          {GENRES.map((genre) => (
            <option key={genre} value={genre.toLowerCase().replace(/ /g, "-")}>
              {genre}
            </option>
          ))}
        </select>
        <p className="text-xs text-text-tertiary">
          Choose the primary genre that defines your world
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-primary">
          Description <span className="text-red-400">*</span>
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
          <input
            type="checkbox"
            checked={data.isTemplate}
            onChange={(e) =>
              onChange({
                ...data,
                isTemplate: e.target.checked,
                templateName: e.target.checked
                  ? data.templateName || data.name
                  : undefined,
              })
            }
            className="w-4 h-4 mt-0.5 text-primary bg-bg-tertiary border-border-primary rounded focus:ring-primary focus:ring-2"
          />
          <div className="flex-1">
            <label className="text-sm font-medium text-text-primary cursor-pointer">
              Mark as Template
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
