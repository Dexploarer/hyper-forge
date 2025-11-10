import { Settings, AlertCircle, Download } from "lucide-react";
import React, { useState, useEffect } from "react";

import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/common";
import {
  WorldConfigList,
  TabNavigation,
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
      setConfigurations(result.configurations);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load configurations";
      setError(errorMessage);
      notify.error(errorMessage);
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
      setSelectedConfig(config);
      setActiveTab("create");
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
    setSelectedConfig(null);
    setActiveTab("create");
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
            <div className="p-8 bg-bg-secondary border border-border-primary rounded-xl text-center">
              <Settings className="w-12 h-12 text-text-tertiary mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Configuration Editor
              </h3>
              <p className="text-sm text-text-secondary mb-4">
                {selectedConfig
                  ? `Editing: ${selectedConfig.name}`
                  : "The configuration editor will be available in the next sprint."}
              </p>
              {selectedConfig && (
                <Button
                  variant="secondary"
                  onClick={() => setActiveTab("list")}
                >
                  Back to List
                </Button>
              )}
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === "templates" && (
            <div className="p-8 bg-bg-secondary border border-border-primary rounded-xl text-center">
              <Settings className="w-12 h-12 text-text-tertiary mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Configuration Templates
              </h3>
              <p className="text-sm text-text-secondary">
                Pre-made templates will be available in the next sprint.
              </p>
            </div>
          )}

          {/* Import Tab */}
          {activeTab === "import" && (
            <div className="p-8 bg-bg-secondary border border-border-primary rounded-xl text-center">
              <Download className="w-12 h-12 text-text-tertiary mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Import Configuration
              </h3>
              <p className="text-sm text-text-secondary">
                Import functionality will be available in the next sprint.
              </p>
            </div>
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

      {/* Preview Modal */}
      <Modal
        open={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        size="lg"
      >
        <ModalHeader>AI Context Preview</ModalHeader>
        <ModalBody>
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">
              This is the context that will be prepended to AI generation
              prompts:
            </p>
            <pre className="bg-bg-tertiary border border-border-primary rounded-lg p-4 overflow-x-auto text-xs text-text-primary font-mono max-h-[400px] overflow-y-auto whitespace-pre-wrap">
              {previewContext}
            </pre>
          </div>
        </ModalBody>
        <ModalFooter>
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
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default WorldConfigPage;
