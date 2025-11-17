/**
 * EditModalFooter Component
 * Reusable footer for edit modals with Cancel + Save buttons
 */

import React from "react";
import { Save } from "lucide-react";
import { ModalFooter, Button, LoadingSpinner } from "../common";

export interface EditModalFooterProps {
  /** Callback when Cancel is clicked */
  onClose: () => void;
  /** Callback when Save is clicked */
  onSave: () => void;
  /** Whether the form is currently saving */
  isSaving: boolean;
  /** Whether the form is valid and can be saved */
  isValid: boolean;
  /** Text for the save button (default: "Save Changes") */
  saveText?: string;
  /** Text for the saving state (default: "Saving...") */
  savingText?: string;
}

/**
 * Standardized footer for content edit modals
 * Provides Cancel and Save buttons with proper loading states
 *
 * @example
 * ```tsx
 * <EditModalFooter
 *   onClose={onClose}
 *   onSave={handleSave}
 *   isSaving={isSaving}
 *   isValid={isValid}
 * />
 * ```
 */
export const EditModalFooter: React.FC<EditModalFooterProps> = ({
  onClose,
  onSave,
  isSaving,
  isValid,
  saveText = "Save Changes",
  savingText = "Saving...",
}) => {
  return (
    <ModalFooter>
      <Button variant="secondary" onClick={onClose} disabled={isSaving}>
        Cancel
      </Button>
      <Button onClick={onSave} disabled={isSaving || !isValid}>
        {isSaving ? (
          <>
            <LoadingSpinner size="sm" className="mr-2" />
            {savingText}
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            {saveText}
          </>
        )}
      </Button>
    </ModalFooter>
  );
};
