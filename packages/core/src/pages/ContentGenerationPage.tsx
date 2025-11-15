import React, { useState } from "react";
import {
  ChevronLeft,
  List,
  Settings,
  Activity,
  CheckCircle,
} from "lucide-react";

import {
  ContentTypeSelector,
  NPCGenerationCard,
  QuestGenerationCard,
  DialogueGenerationCard,
  LoreGenerationCard,
  GeneratedContentList,
  ContentPreviewCard,
} from "@/components/content";
import { Button, Drawer, TabNavigation } from "@/components/common";
import {
  DialogueData,
  GeneratedContent,
  type ContentType,
  type ContentView,
  type NPCData,
  type QuestData,
  type DialogueNode,
  type LoreData,
} from "@/types/content";

interface ContentGenerationPageProps {
  initialType?: ContentType; // Optional initial content type to skip selector
  initialPrompt?: string; // Optional initial prompt to pre-fill forms
}

export const ContentGenerationPage: React.FC<ContentGenerationPageProps> = ({
  initialType,
  initialPrompt,
}) => {
  // Content type selection
  const [contentType, setContentType] = useState<ContentType | null>(
    initialType || null,
  );

  // View management
  const [activeView, setActiveView] = useState<ContentView>("config");

  // Generated content
  const [generatedContents, setGeneratedContents] = useState<
    GeneratedContent[]
  >([]);
  const [selectedContent, setSelectedContent] =
    useState<GeneratedContent | null>(null);
  const [showContentDrawer, setShowContentDrawer] = useState(false);

  // Handle content generation completion
  const handleContentGenerated = (
    data: any,
    rawResponse: string,
    type: ContentType,
  ) => {
    const id = `${type}-${Date.now()}`;
    let name = "";
    let contentData: NPCData | QuestData | DialogueData | LoreData;

    // Extract name and data based on type
    if (type === "npc") {
      contentData = data as NPCData & { id: string; metadata: any };
      name = (data as any).name || "Unnamed NPC";
    } else if (type === "quest") {
      contentData = data as QuestData & {
        id: string;
        difficulty: string;
        questType: string;
        metadata: any;
      };
      name = (data as any).title || "Unnamed Quest";
    } else if (type === "dialogue") {
      // Convert DialogueNode[] to DialogueData class
      const nodes = data as DialogueNode[];
      contentData = DialogueData.create({
        nodes,
        metadata: {
          description: `Dialogue tree with ${nodes.length} nodes`,
        },
      });
      name = `Dialogue Tree (${nodes.length} nodes)`;
    } else if (type === "lore") {
      contentData = data as LoreData & { id: string; metadata: any };
      name = (data as any).title || "Unnamed Lore";
    } else {
      return;
    }

    const newContent = GeneratedContent.create({
      id,
      type,
      name,
      data: contentData,
      metadata: {
        type,
        rawResponse,
        ...(data.metadata || {}),
      },
      createdAt: new Date(),
    });

    setGeneratedContents((prev) => [newContent, ...prev]);
    setSelectedContent(newContent);
    setActiveView("results");
  };

  // Reset to type selection
  const handleBack = () => {
    setContentType(null);
    setActiveView("config");
  };

  // Show type selector if no type selected
  if (!contentType) {
    return (
      <div className="h-full overflow-y-auto">
        <ContentTypeSelector onSelectType={setContentType} />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto py-3 pb-4">
        {/* Header with tabs */}
        <div className="mb-3">
          <TabNavigation
            activeView={activeView}
            tabs={[
              { id: "config", icon: Settings, label: "Configuration" },
              { id: "progress", icon: Activity, label: "Progress" },
              {
                id: "results",
                icon: CheckCircle,
                label: "Results",
                badge: generatedContents.length,
              },
            ]}
            onTabChange={setActiveView}
            variant="underline"
          />
        </div>

        {/* Config View */}
        {activeView === "config" && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              {/* Back Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-text-secondary hover:text-text-primary"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to content types
              </Button>

              {/* Content List Button */}
              {generatedContents.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowContentDrawer(true)}
                  className="flex items-center gap-2"
                >
                  <List className="w-4 h-4" />
                  <span>Recent Content ({generatedContents.length})</span>
                </Button>
              )}
            </div>

            {/* Main Generation Card */}
            <div className="mx-auto">
              {contentType === "npc" && (
                <NPCGenerationCard
                  onGenerated={(npc, raw) =>
                    handleContentGenerated(npc, raw, "npc")
                  }
                  initialPrompt={initialPrompt}
                />
              )}
              {contentType === "quest" && (
                <QuestGenerationCard
                  onGenerated={(quest, raw) =>
                    handleContentGenerated(quest, raw, "quest")
                  }
                  initialPrompt={initialPrompt}
                />
              )}
              {contentType === "dialogue" && (
                <DialogueGenerationCard
                  onGenerated={(nodes, raw) =>
                    handleContentGenerated(nodes, raw, "dialogue")
                  }
                  initialPrompt={initialPrompt}
                />
              )}
              {contentType === "lore" && (
                <LoreGenerationCard
                  onGenerated={(lore, raw) =>
                    handleContentGenerated(lore, raw, "lore")
                  }
                  initialPrompt={initialPrompt}
                />
              )}
            </div>
          </div>
        )}

        {/* Progress View */}
        {activeView === "progress" && (
          <div className="animate-fade-in text-center py-12">
            <p className="text-text-secondary">
              Progress tracking coming soon...
            </p>
          </div>
        )}

        {/* Results View */}
        {activeView === "results" && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold text-text-primary">
                Generated Content
              </h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowContentDrawer(true)}
                className="flex items-center gap-2"
              >
                <List className="w-4 h-4" />
                <span>View List ({generatedContents.length})</span>
              </Button>
            </div>

            {/* Content Preview */}
            <div className="mx-auto">
              {selectedContent ? (
                <ContentPreviewCard content={selectedContent} />
              ) : (
                <div className="text-center py-12 text-text-secondary">
                  <p>Select content to preview</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content List Drawer */}
      <Drawer
        open={showContentDrawer}
        onClose={() => setShowContentDrawer(false)}
        side="right"
        size="md"
        title={`Generated Content (${generatedContents.length})`}
      >
        <div className="p-6">
          <GeneratedContentList
            contents={
              activeView === "results"
                ? generatedContents
                : generatedContents.slice(0, 5)
            }
            selectedContent={selectedContent}
            onContentSelect={(content) => {
              setSelectedContent(content);
              setActiveView("results");
              setShowContentDrawer(false);
            }}
          />
          {activeView === "config" && generatedContents.length > 0 && (
            <div className="mt-4">
              <Button
                variant="primary"
                onClick={() => {
                  setActiveView("results");
                  setShowContentDrawer(false);
                }}
                className="w-full"
              >
                View All ({generatedContents.length})
              </Button>
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
};

export default ContentGenerationPage;
