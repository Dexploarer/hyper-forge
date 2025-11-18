/**
 * Content Library Page
 * Browse and manage saved content (NPCs, quests, dialogues, lore)
 */

import React, { useState } from "react";
import {
  FileText,
  Users,
  Scroll,
  BookOpen,
  Search,
  Filter,
  Grid3x3,
  List,
  Volume2,
} from "lucide-react";
import { useContent, ContentItem, ContentType } from "@/hooks/useContent";
import { EditNPCModal } from "@/components/content/EditNPCModal";
import { EditQuestModal } from "@/components/content/EditQuestModal";
import { EditDialogueModal } from "@/components/content/EditDialogueModal";
import { EditLoreModal } from "@/components/content/EditLoreModal";
import { LibraryCard } from "@/components/content/LibraryCard";
import { ContentDetailModal } from "@/components/content/ContentDetailModal";

const CONTENT_TYPE_ICONS = {
  npc: Users,
  quest: Scroll,
  dialogue: FileText,
  lore: BookOpen,
  audio: Volume2,
} as const;

const CONTENT_TYPE_LABELS = {
  npc: "NPC",
  quest: "Quest",
  dialogue: "Dialogue",
  lore: "Lore",
  audio: "Audio",
} as const;

type ViewMode = "grid" | "list";

export const ContentLibraryPage: React.FC = () => {
  const {
    allContent,
    loading,
    deleteNPC,
    deleteQuest,
    deleteDialogue,
    deleteLore,
    deleteAudio,
  } = useContent();
  const [filterType, setFilterType] = useState<ContentType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filter content based on type and search
  const filteredContent = allContent.filter((item) => {
    const matchesType = filterType === "all" || item.type === filterType;
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Sort by creation date (newest first)
  const sortedContent = [...filteredContent].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  const handleDelete = async (item: ContentItem) => {
    if (!confirm(`Are you sure you want to delete this ${item.type}?`)) return;

    switch (item.type) {
      case "npc":
        await deleteNPC(item.id);
        break;
      case "quest":
        await deleteQuest(item.id);
        break;
      case "dialogue":
        await deleteDialogue(item.id);
        break;
      case "lore":
        await deleteLore(item.id);
        break;
      case "audio":
        await deleteAudio(item.id);
        break;
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-text-secondary">Loading content library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 bg-bg-primary">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Search, Filters, and View Toggle */}
        <div className="bg-bg-secondary rounded-xl border border-border-primary p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Search */}
            <div className="flex-1 flex items-center gap-2">
              <Search className="w-5 h-5 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search your content library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-bg-tertiary border border-border-primary rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-text-tertiary" />
              <select
                value={filterType}
                onChange={(e) =>
                  setFilterType(e.target.value as ContentType | "all")
                }
                className="bg-bg-tertiary border border-border-primary rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Types ({allContent.length})</option>
                <option value="npc">
                  NPCs ({allContent.filter((i) => i.type === "npc").length})
                </option>
                <option value="quest">
                  Quests ({allContent.filter((i) => i.type === "quest").length})
                </option>
                <option value="dialogue">
                  Dialogues (
                  {allContent.filter((i) => i.type === "dialogue").length})
                </option>
                <option value="lore">
                  Lore ({allContent.filter((i) => i.type === "lore").length})
                </option>
                <option value="audio">
                  Audio ({allContent.filter((i) => i.type === "audio").length})
                </option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-bg-tertiary rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded transition-colors ${
                  viewMode === "grid"
                    ? "bg-primary/20 text-primary"
                    : "text-text-tertiary hover:text-text-secondary"
                }`}
                title="Grid View"
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded transition-colors ${
                  viewMode === "list"
                    ? "bg-primary/20 text-primary"
                    : "text-text-tertiary hover:text-text-secondary"
                }`}
                title="List View"
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            {/* Count */}
            <div className="text-sm text-text-tertiary whitespace-nowrap">
              {sortedContent.length} of {allContent.length} items
            </div>
          </div>
        </div>

        {/* Content Grid/List */}
        {sortedContent.length === 0 ? (
          <div className="bg-bg-secondary rounded-xl border border-border-primary p-16 text-center">
            <BookOpen className="w-16 h-16 text-text-tertiary mx-auto mb-4 opacity-50" />
            <p className="text-text-secondary mb-2 text-lg font-medium">
              No content found
            </p>
            <p className="text-sm text-text-tertiary">
              {searchQuery || filterType !== "all"
                ? "Try adjusting your filters"
                : "Generate some content to get started"}
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            {sortedContent.map((item, index) => (
              <div
                key={item.id}
                className="animate-in slide-in-from-bottom duration-300"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: "backwards",
                }}
              >
                <LibraryCard
                  item={item}
                  onClick={() => setSelectedItem(item)}
                  onEdit={() => setEditingItem(item)}
                  onDelete={() => handleDelete(item)}
                  refreshKey={refreshKey}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-bg-secondary rounded-xl border border-border-primary divide-y divide-border-primary animate-in fade-in duration-300">
            {sortedContent.map((item) => (
              <div
                key={item.id}
                className="p-4 hover:bg-bg-tertiary transition-colors"
              >
                <LibraryCard
                  item={item}
                  onClick={() => setSelectedItem(item)}
                  onEdit={() => setEditingItem(item)}
                  onDelete={() => handleDelete(item)}
                  refreshKey={refreshKey}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <ContentDetailModal
          item={selectedItem}
          open={true}
          onClose={() => setSelectedItem(null)}
          onEdit={() => {
            setEditingItem(selectedItem);
            setSelectedItem(null);
          }}
          onDelete={() => handleDelete(selectedItem)}
          onImageGenerated={() => {
            // Increment refreshKey to trigger LibraryCard refresh
            setRefreshKey((prev) => prev + 1);
          }}
        />
      )}

      {/* Edit Modals */}
      {editingItem?.type === "npc" && (
        <EditNPCModal
          open={true}
          onClose={() => setEditingItem(null)}
          npc={editingItem.data}
        />
      )}
      {editingItem?.type === "quest" && (
        <EditQuestModal
          open={true}
          onClose={() => setEditingItem(null)}
          quest={editingItem.data}
        />
      )}
      {editingItem?.type === "dialogue" && (
        <EditDialogueModal
          open={true}
          onClose={() => setEditingItem(null)}
          dialogue={editingItem.data}
        />
      )}
      {editingItem?.type === "lore" && (
        <EditLoreModal
          open={true}
          onClose={() => setEditingItem(null)}
          lore={editingItem.data}
        />
      )}
    </div>
  );
};

export default ContentLibraryPage;
