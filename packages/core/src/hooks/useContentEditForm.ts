/**
 * useContentEditForm Hook
 * Generic hook for managing content edit form state, validation, and save operations
 */

import { useState, useEffect } from "react";

export interface UseContentEditFormOptions<TFormData, TUpdateData> {
  /** Initial data to populate the form */
  initialData: any;
  /** Whether the modal is open */
  open: boolean;
  /** Callback to update the content on the server */
  onUpdate: (id: string, data: TUpdateData) => Promise<void>;
  /** Callback when the modal closes */
  onClose: () => void;
  /** Transform form data into the format expected by the update function */
  transformer: (formData: TFormData) => TUpdateData;
  /** Validate form data before saving (return true if valid) */
  validator: (formData: TFormData) => boolean;
  /** Transform initial data into form state */
  initializer: (initialData: any) => TFormData;
}

export interface UseContentEditFormResult<TFormData> {
  /** Current form data */
  formData: TFormData;
  /** Update form data */
  setFormData: React.Dispatch<React.SetStateAction<TFormData>>;
  /** Whether the form is currently saving */
  isSaving: boolean;
  /** Handle save operation */
  handleSave: () => Promise<void>;
  /** Whether the form is valid and can be saved */
  isValid: boolean;
}

/**
 * Generic hook for managing content edit forms
 * Handles initialization, validation, saving, and loading states
 *
 * @example
 * ```tsx
 * const { formData, setFormData, isSaving, handleSave, isValid } = useContentEditForm({
 *   initialData: npc,
 *   open,
 *   onUpdate: updateNPC,
 *   onClose,
 *   validator: (data) => !!data.name.trim(),
 *   transformer: (data) => ({ name: data.name, ... }),
 *   initializer: (npc) => ({ name: npc.name || "", ... })
 * });
 * ```
 */
export function useContentEditForm<TFormData, TUpdateData>({
  initialData,
  open,
  onUpdate,
  onClose,
  transformer,
  validator,
  initializer,
}: UseContentEditFormOptions<
  TFormData,
  TUpdateData
>): UseContentEditFormResult<TFormData> {
  const [formData, setFormData] = useState<TFormData>({} as TFormData);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form data when modal opens
  useEffect(() => {
    if (open && initialData) {
      setFormData(initializer(initialData));
    }
  }, [open, initialData]);

  // Validate form data
  const isValid = validator(formData);

  // Handle save operation
  const handleSave = async () => {
    if (!isValid) {
      return;
    }

    try {
      setIsSaving(true);
      const updates = transformer(formData);
      await onUpdate(initialData.id, updates);
      onClose();
    } catch (error) {
      console.error("Failed to save content:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    formData,
    setFormData,
    isSaving,
    handleSave,
    isValid,
  };
}
