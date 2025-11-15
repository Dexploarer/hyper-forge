import React, { useState, useEffect } from "react";
import { Settings, Clock, FileText, ChevronDown } from "lucide-react";

import {
  PlaytestConfigCard,
  PlaytestReportCard,
  TesterProfileList,
  GeneratedPlaytestList,
} from "@/components/playtester";
import { Button, TabNavigation } from "@/components/common";
import { useNavigation } from "@/hooks/useNavigation";
import type {
  PlaytestContentType,
  PlaytestView,
  GeneratedPlaytest,
  PlaytestResult,
} from "@/types/playtester";

const CONTENT_TYPES: Array<{
  value: PlaytestContentType;
  label: string;
  description: string;
}> = [
  {
    value: "quest",
    label: "Quest",
    description: "Test quest objectives and flow",
  },
  {
    value: "dialogue",
    label: "Dialogue",
    description: "Test conversation trees",
  },
  { value: "npc", label: "NPC", description: "Test character interactions" },
  { value: "combat", label: "Combat", description: "Test combat encounters" },
  { value: "puzzle", label: "Puzzle", description: "Test puzzle mechanics" },
];

export const PlaytesterSwarmPage: React.FC = () => {
  const { importedPlaytestContent } = useNavigation();

  // Content type selection - default to quest, or use imported content type
  const [contentType, setContentType] = useState<PlaytestContentType>(
    importedPlaytestContent?.contentType || "quest",
  );
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  // Pre-filled content from import
  const [importedContent, setImportedContent] = useState<unknown | null>(
    importedPlaytestContent?.content || null,
  );

  // Set content type and imported content when navigation provides it
  useEffect(() => {
    if (importedPlaytestContent) {
      setContentType(importedPlaytestContent.contentType);
      setImportedContent(importedPlaytestContent.content);
    }
  }, [importedPlaytestContent]);

  // View management
  const [activeView, setActiveView] = useState<PlaytestView>("config");

  // Tester profile selection
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);

  // Generated playtests
  const [generatedPlaytests, setGeneratedPlaytests] = useState<
    GeneratedPlaytest[]
  >([]);
  const [selectedPlaytest, setSelectedPlaytest] =
    useState<GeneratedPlaytest | null>(null);

  // Handle playtest completion
  const handleTestCompleted = (result: PlaytestResult) => {
    const id = result.sessionId;
    const name = `${result.contentType.charAt(0).toUpperCase()}${result.contentType.slice(1)} Test`;

    const newPlaytest: GeneratedPlaytest = {
      id,
      contentType: result.contentType as PlaytestContentType,
      name,
      result,
      createdAt: new Date().toISOString(),
    };

    setGeneratedPlaytests((prev) => [newPlaytest, ...prev]);
    setSelectedPlaytest(newPlaytest);
    setActiveView("results");
  };

  const selectedType = CONTENT_TYPES.find((t) => t.value === contentType)!;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto py-4 pb-6">
        {/* Content Type Selector Dropdown */}
        <div className="mb-4">
          <div className="relative inline-block">
            <button
              onClick={() => setShowTypeDropdown(!showTypeDropdown)}
              className="flex items-center gap-3 px-4 py-2.5 bg-bg-secondary hover:bg-bg-tertiary border border-border-primary rounded-lg transition-colors group"
            >
              <div>
                <div className="text-sm font-semibold text-text-primary capitalize">
                  {selectedType.label} Testing
                </div>
                <div className="text-xs text-text-tertiary">
                  {selectedType.description}
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-text-secondary transition-transform ${showTypeDropdown ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown Menu */}
            {showTypeDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowTypeDropdown(false)}
                />
                <div className="absolute top-full left-0 mt-2 w-72 bg-bg-primary border border-border-primary rounded-lg shadow-xl z-20 overflow-hidden">
                  {CONTENT_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => {
                        setContentType(type.value);
                        setShowTypeDropdown(false);
                      }}
                      className={`w-full px-4 py-3 text-left transition-colors border-b border-border-primary last:border-b-0 ${
                        contentType === type.value
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-bg-hover text-text-primary"
                      }`}
                    >
                      <div className="font-medium text-sm capitalize">
                        {type.label}
                      </div>
                      <div className="text-xs text-text-tertiary mt-0.5">
                        {type.description}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Header with tabs */}
        <div className="mb-4">
          <TabNavigation
            activeView={activeView}
            tabs={[
              { id: "config", icon: Settings, label: "Config" },
              { id: "progress", icon: Clock, label: "Progress" },
              {
                id: "results",
                icon: FileText,
                label: "Results",
                badge: generatedPlaytests.length,
              },
            ]}
            onTabChange={setActiveView}
            variant="minimal"
          />
        </div>

        {/* Config View */}
        {activeView === "config" && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Main Configuration Card */}
              <div className="lg:col-span-2">
                <PlaytestConfigCard
                  contentType={contentType}
                  selectedProfiles={selectedProfiles}
                  onTestCompleted={handleTestCompleted}
                  importedContent={importedContent}
                />
              </div>

              {/* Sidebar - Tester Profiles */}
              <div className="space-y-4">
                <TesterProfileList
                  selectedProfiles={selectedProfiles}
                  onProfilesChange={setSelectedProfiles}
                />

                {generatedPlaytests.length > 0 && (
                  <Button
                    variant="ghost"
                    onClick={() => setActiveView("results")}
                    className="w-full"
                  >
                    View All Results ({generatedPlaytests.length})
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Progress View */}
        {activeView === "progress" && (
          <div className="animate-fade-in text-center py-12">
            <p className="text-text-secondary">
              Progress tracking coming soon...
            </p>
            <p className="text-xs text-text-tertiary mt-2">
              Tests currently run in real-time. Check the Results tab after
              testing completes.
            </p>
          </div>
        )}

        {/* Results View */}
        {activeView === "results" && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Playtests List */}
              <GeneratedPlaytestList
                playtests={generatedPlaytests}
                selectedPlaytest={selectedPlaytest}
                onPlaytestSelect={setSelectedPlaytest}
              />

              {/* Playtest Report */}
              <div className="lg:col-span-3">
                {selectedPlaytest ? (
                  <PlaytestReportCard result={selectedPlaytest.result} />
                ) : (
                  <div className="text-center py-12 text-text-secondary">
                    <p>Select a playtest to view report</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaytesterSwarmPage;
