/**
 * Edit Project Modal
 * Modal form for editing existing projects
 */

import React, { useState, useEffect } from "react";
import { Loader2, Edit3 } from "lucide-react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  Button,
} from "@/components/common";
import { Project, ProjectUpdateData } from "@/services/api/ProjectService";

export interface EditProjectModalProps {
  open: boolean;
  project: Project | null;
  onClose: () => void;
  onUpdate: (id: string, data: ProjectUpdateData) => Promise<void>;
  loading: boolean;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  open,
  project,
  onClose,
  onUpdate,
  loading,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form when project changes
  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || "");
      setErrors({});
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!project) return;

    // Validation
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = "Project name is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit
    await onUpdate(project.id, {
      name: name.trim(),
      description: description.trim() || undefined,
    });

    // Reset form
    setName("");
    setDescription("");
    setErrors({});
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setErrors({});
    onClose();
  };

  if (!project) return null;

  return (
    <Modal open={open} onClose={handleClose} size="md">
      <form onSubmit={handleSubmit}>
        <ModalHeader onClose={handleClose}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                Edit Project
              </h2>
              <p className="text-sm text-text-tertiary">
                Update project details
              </p>
            </div>
          </div>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            {/* Project Name */}
            <div>
              <label
                htmlFor="edit-project-name"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                Project Name <span className="text-red-400">*</span>
              </label>
              <Input
                id="edit-project-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) {
                    setErrors({ ...errors, name: "" });
                  }
                }}
                placeholder="My Game Project"
                className={errors.name ? "border-red-500" : ""}
                disabled={loading}
                autoFocus
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-400">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="edit-project-description"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                Description (Optional)
              </label>
              <Textarea
                id="edit-project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description of your project..."
                rows={4}
                disabled={loading}
              />
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
