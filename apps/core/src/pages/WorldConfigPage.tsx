import { Settings, AlertCircle, Download } from "lucide-react";
import React, { useState, useEffect } from "react";

import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Tray,
} from "@/components/common";
import {
  WorldConfigList,
  TabNavigation,
  WorldConfigEditor,
  WorldConfigCreateTab,
  WorldConfigTemplatesTab,
  WorldConfigImportTab,
  type WorldConfigTab,
} from "@/components/world-config";
import {
  worldConfigClient,
  type WorldConfigurationData,
} from "@/services/api/WorldConfigAPIClient";
import { notify } from "@/utils/notify";

export const WorldConfigPage: React.FC = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState<WorldConfigTab>("list");

  // Data state
  const [configurations, setConfigurations] = useState<
    WorldConfigurationData[]
  >([]);
  const [selectedConfig, setSelectedConfig] =
    useState<WorldConfigurationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfigId, setDeleteConfigId] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewContext, setPreviewContext] = useState<string>("");
  const [showEditor, setShowEditor] = useState(false);
  const [editingConfig, setEditingConfig] =
    useState<WorldConfigurationData | null>(null);

  // Load configurations on mount
  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await worldConfigClient.listConfigurations({
        includeTemplates: false,
      });
      // Safety check - ensure configs is always an array
      const configs = result?.configs || [];
      setConfigurations(configs);
    } catch (err) {
      // World config is optional - don't show error, just use empty array
      console.warn(
        "WorldConfigPage: Failed to load configurations (optional):",
        err,
      );
      setConfigurations([]);
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleActivate = async (id: string) => {
    try {
      await worldConfigClient.activateConfiguration(id);
      notify.success("Configuration activated!");
      await loadConfigurations();
    } catch (err) {
      notify.error("Failed to activate configuration");
    }
  };

  const handleClone = async (id: string) => {
    try {
      const config = configurations.find((c) => c.id === id);
      const newName = config ? `${config.name} (Copy)` : undefined;
      await worldConfigClient.cloneConfiguration(id, newName);
      notify.success("Configuration cloned!");
      await loadConfigurations();
    } catch (err) {
      notify.error("Failed to clone configuration");
    }
  };

  const handleEdit = (id: string) => {
    const config = configurations.find((c) => c.id === id);
    if (config) {
      setEditingConfig(config);
      setShowEditor(true);
    }
  };

  const handleExport = async (id: string) => {
    try {
      await worldConfigClient.downloadConfiguration(id);
      notify.success("Configuration exported!");
    } catch (err) {
      notify.error("Failed to export configuration");
    }
  };

  const handleDelete = (id: string) => {
    setDeleteConfigId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteConfigId) return;

    try {
      // First deactivate if active
      const config = configurations.find((c) => c.id === deleteConfigId);
      if (config?.isActive) {
        await worldConfigClient.updateConfiguration(deleteConfigId, {
          isActive: false,
        });
      }

      await worldConfigClient.deleteConfiguration(deleteConfigId);
      notify.success("Configuration deleted!");
      setShowDeleteModal(false);
      setDeleteConfigId(null);
      await loadConfigurations();
    } catch (err) {
      notify.error("Failed to delete configuration");
    }
  };

  const handlePreview = async (id: string) => {
    try {
      const result = await worldConfigClient.buildAIContext(id);
      setPreviewContext(result.context);
      setShowPreviewModal(true);
    } catch (err) {
      notify.error("Failed to load preview");
    }
  };

  const handleCreateNew = () => {
    setEditingConfig(null);
    setShowEditor(true);
  };

  const handleEditorSave = () => {
    loadConfigurations();
  };

  const handleEditorClose = () => {
    setShowEditor(false);
    setEditingConfig(null);
  };

  // Tab counts
  const tabCounts = {
    list: configurations.length,
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-primary/10 to-accent/10 border border-border-primary rounded-xl">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-text-primary">
                World Configurations
              </h1>
              <p className="text-sm text-text-secondary">
                Manage world parameters for AI content generation
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={tabCounts}
        />

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-400">{error}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={loadConfigurations}>
              Retry
            </Button>
          </div>
        )}

        {/* Tab Content */}
        <div className="mt-6">
          {/* List Tab */}
          {activeTab === "list" && (
            <WorldConfigList
              configurations={configurations}
              selectedId={selectedConfig?.id}
              onSelect={setSelectedConfig}
              onActivate={handleActivate}
              onClone={handleClone}
              onEdit={handleEdit}
              onExport={handleExport}
              onDelete={handleDelete}
              onPreview={handlePreview}
              onCreate={handleCreateNew}
              loading={loading}
            />
          )}

          {/* Create Tab */}
          {activeTab === "create" && (
            <WorldConfigCreateTab onConfigCreated={loadConfigurations} />
          )}

          {/* Templates Tab */}
          {activeTab === "templates" && (
            <WorldConfigTemplatesTab onTemplateUsed={loadConfigurations} />
          )}

          {/* Import Tab */}
          {activeTab === "import" && (
            <WorldConfigImportTab onConfigImported={loadConfigurations} />
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        size="sm"
      >
        <ModalHeader>Delete Configuration</ModalHeader>
        <ModalBody>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-text-primary mb-2">
                Are you sure you want to delete this configuration?
              </p>
              <p className="text-sm text-text-secondary">
                This action cannot be undone.
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </ModalFooter>
      </Modal>

      {/* Preview Tray */}
      <Tray
        open={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="AI Context Preview"
        defaultHeight="lg"
        resizable={true}
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-text-secondary">
            This is the context that will be prepended to AI generation prompts:
          </p>
          <pre className="bg-bg-tertiary border border-border-primary rounded-lg p-4 overflow-x-auto text-xs text-text-primary font-mono max-h-[400px] overflow-y-auto whitespace-pre-wrap">
            {previewContext}
          </pre>
          <div className="flex justify-end gap-3 pt-4 border-t border-border-primary">
            <Button
              variant="secondary"
              onClick={async () => {
                await navigator.clipboard.writeText(previewContext);
                notify.success("Copied to clipboard!");
              }}
            >
              Copy to Clipboard
            </Button>
            <Button onClick={() => setShowPreviewModal(false)}>Close</Button>
          </div>
        </div>
      </Tray>

      {/* Configuration Editor */}
      <WorldConfigEditor
        open={showEditor}
        onClose={handleEditorClose}
        onSave={handleEditorSave}
        editConfig={editingConfig}
      />
    </div>
  );
};

export default WorldConfigPage;
