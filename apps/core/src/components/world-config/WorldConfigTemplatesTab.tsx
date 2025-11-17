import React, { useState, useEffect } from "react";
import { Layout, Star, Plus, Loader2, AlertCircle } from "lucide-react";

import {
  Button,
  Card,
  CardHeader,
  CardContent,
  LoadingSpinner,
} from "@/components/common";
import {
  worldConfigClient,
  type WorldConfigurationData,
} from "@/services/api/WorldConfigAPIClient";
import { notify } from "@/utils/notify";

interface WorldConfigTemplatesTabProps {
  onTemplateUsed: () => void;
}

export const WorldConfigTemplatesTab: React.FC<
  WorldConfigTemplatesTabProps
> = ({ onTemplateUsed }) => {
  const [templates, setTemplates] = useState<WorldConfigurationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingFrom, setCreatingFrom] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await worldConfigClient.listTemplates();
      setTemplates(result.templates || []);
    } catch (err) {
      console.error("Failed to load templates:", err);
      setError("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async (
    templateId: string,
    templateName: string,
  ) => {
    try {
      setCreatingFrom(templateId);

      await worldConfigClient.createFromTemplate(templateId, {
        name: `${templateName} (My Version)`,
      });

      notify.success("Configuration created from template!");
      onTemplateUsed();
    } catch (err) {
      console.error("Failed to create from template:", err);
      notify.error("Failed to create from template");
    } finally {
      setCreatingFrom(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-500/10 border-red-500/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div className="flex-1">
              <p className="text-sm text-red-400">{error}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={loadTemplates}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Layout className="w-16 h-16 text-text-tertiary mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            No Templates Available
          </h3>
          <p className="text-sm text-text-secondary mb-6">
            There are no configuration templates available yet. Create a
            configuration and mark it as a template to make it reusable.
          </p>
          <Button
            variant="primary"
            onClick={() => notify.info("Switch to Create tab")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Configuration
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary">
            Configuration Templates
          </h2>
          <p className="text-sm text-text-secondary">
            Pre-configured world setups you can use as starting points
          </p>
        </div>
        <div className="px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg">
          <span className="text-sm font-medium text-primary">
            {templates.length}{" "}
            {templates.length === 1 ? "Template" : "Templates"}
          </span>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card
            key={template.id}
            className="hover:border-primary/50 transition-colors"
          >
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Star className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-text-primary truncate">
                    {template.templateName || template.name}
                  </h3>
                  <p className="text-xs text-text-tertiary">{template.genre}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-text-secondary line-clamp-3">
                {template.description}
              </p>

              {/* Tags */}
              {template.tags && template.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {template.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-bg-tertiary rounded text-xs text-text-tertiary"
                    >
                      {tag}
                    </span>
                  ))}
                  {template.tags.length > 3 && (
                    <span className="px-2 py-0.5 bg-bg-tertiary rounded text-xs text-text-tertiary">
                      +{template.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-bg-tertiary/50 rounded">
                  <div className="text-xs text-text-tertiary">Races</div>
                  <div className="text-sm font-semibold text-text-primary">
                    {template.races?.length || 0}
                  </div>
                </div>
                <div className="p-2 bg-bg-tertiary/50 rounded">
                  <div className="text-xs text-text-tertiary">Factions</div>
                  <div className="text-sm font-semibold text-text-primary">
                    {template.factions?.length || 0}
                  </div>
                </div>
                <div className="p-2 bg-bg-tertiary/50 rounded">
                  <div className="text-xs text-text-tertiary">Skills</div>
                  <div className="text-sm font-semibold text-text-primary">
                    {template.skills?.length || 0}
                  </div>
                </div>
              </div>

              {/* Use Template Button */}
              <Button
                variant="primary"
                onClick={() =>
                  handleUseTemplate(
                    template.id,
                    template.templateName || template.name,
                  )
                }
                disabled={creatingFrom !== null}
                className="w-full"
              >
                {creatingFrom === template.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Use This Template
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
