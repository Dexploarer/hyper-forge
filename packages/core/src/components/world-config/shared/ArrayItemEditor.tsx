import { X, Save } from "lucide-react";
import React, { useState, useEffect } from "react";

import {
  Button,
  Input,
  Textarea,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/common";

interface Field {
  name: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "select"
    | "number"
    | "checkbox"
    | "tags"
    | "list";
  placeholder?: string;
  options?: string[] | { value: string; label: string }[];
  maxLength?: number;
  min?: number;
  max?: number;
  required?: boolean;
}

interface ArrayItemEditorProps<T> {
  open: boolean;
  onClose: () => void;
  onSave: (item: T) => void | boolean;
  item: T | null;
  fields: Field[];
  title: string;
  description?: string;
}

export function ArrayItemEditor<T extends Record<string, any>>({
  open,
  onClose,
  onSave,
  item,
  fields,
  title,
  description,
}: ArrayItemEditorProps<T>) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when item changes
  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      // Initialize with defaults
      const defaults: Record<string, any> = {};
      fields.forEach((field) => {
        if (field.type === "checkbox") {
          defaults[field.name] = true;
        } else if (field.type === "tags" || field.type === "list") {
          defaults[field.name] = [];
        } else if (field.type === "number") {
          defaults[field.name] = field.min || 0;
        } else {
          defaults[field.name] = "";
        }
      });
      setFormData(defaults);
    }
    setErrors({});
  }, [item, fields, open]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach((field) => {
      if (field.required) {
        const value = formData[field.name];
        if (value === undefined || value === null || value === "") {
          newErrors[field.name] = `${field.label} is required`;
        } else if (Array.isArray(value) && value.length === 0) {
          newErrors[field.name] = `${field.label} must have at least one item`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    // Generate ID if creating new item
    const savedItem = {
      ...formData,
      id:
        formData.id ||
        `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: formData.createdAt || new Date().toISOString(),
    } as unknown as T;

    const result = onSave(savedItem);
    // Only close if onSave returns true or undefined (backward compatible)
    // Return false to keep modal open (e.g., for validation errors)
    if (result !== false) {
      onClose();
    }
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    // Clear error for this field
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const renderField = (field: Field) => {
    const value = formData[field.name];
    const error = errors[field.name];

    switch (field.type) {
      case "text":
        return (
          <div key={field.name} className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <Input
              value={value || ""}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              maxLength={field.maxLength}
              className="w-full"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            {field.maxLength && (
              <p className="text-xs text-text-tertiary text-right">
                {(value || "").length} / {field.maxLength}
              </p>
            )}
          </div>
        );

      case "textarea":
        return (
          <div key={field.name} className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <Textarea
              value={value || ""}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              maxLength={field.maxLength}
              className="w-full min-h-[100px]"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            {field.maxLength && (
              <p className="text-xs text-text-tertiary text-right">
                {(value || "").length} / {field.maxLength}
              </p>
            )}
          </div>
        );

      case "select":
        return (
          <div key={field.name} className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <select
              value={value || ""}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className="w-full px-4 py-2.5 bg-bg-tertiary border border-border-primary/50 rounded-lg text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 [&>option]:bg-bg-tertiary [&>option]:text-text-primary"
            >
              <option value="">Select {field.label}</option>
              {field.options?.map((opt) =>
                typeof opt === "string" ? (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ) : (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ),
              )}
            </select>
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>
        );

      case "number":
        return (
          <div key={field.name} className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <Input
              type="number"
              value={value || 0}
              onChange={(e) =>
                handleFieldChange(field.name, parseInt(e.target.value) || 0)
              }
              min={field.min}
              max={field.max}
              className="w-full"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>
        );

      case "checkbox":
        return (
          <div key={field.name} className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleFieldChange(field.name, e.target.checked)}
              className="w-4 h-4 text-primary bg-bg-tertiary border-border-primary rounded focus:ring-primary focus:ring-2"
            />
            <label className="text-sm font-medium text-text-primary">
              {field.label}
            </label>
          </div>
        );

      case "tags":
      case "list":
        return (
          <div key={field.name} className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {(value || []).map((tag: string, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={tag}
                    onChange={(e) => {
                      const newTags = [...(value || [])];
                      newTags[index] = e.target.value;
                      handleFieldChange(field.name, newTags);
                    }}
                    placeholder={`${field.label} ${index + 1}`}
                    className="flex-1"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const newTags = (value || []).filter(
                        (_: any, i: number) => i !== index,
                      );
                      handleFieldChange(field.name, newTags);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  handleFieldChange(field.name, [...(value || []), ""]);
                }}
              >
                Add {field.label.slice(0, -1)}
              </Button>
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <ModalHeader>{item ? `Edit ${title}` : `Add ${title}`}</ModalHeader>
      <ModalBody>
        {description && (
          <p className="text-sm text-text-secondary mb-4">{description}</p>
        )}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {fields.map(renderField)}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          {item ? "Save Changes" : `Add ${title}`}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
