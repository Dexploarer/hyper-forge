/**
 * SelectOrCustom Component
 * Hybrid dropdown that allows selection from options OR custom text input
 */

import React, { useState, useEffect } from "react";
import { Input } from "./Input";

interface SelectOrCustomProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  allowEmpty?: boolean; // Allow "Any / Let AI decide" option
  customPlaceholder?: string;
}

const CUSTOM_VALUE = "__CUSTOM__";
const EMPTY_VALUE = "";

export const SelectOrCustom: React.FC<SelectOrCustomProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select or enter custom...",
  label,
  required = false,
  disabled = false,
  className = "",
  allowEmpty = true,
  customPlaceholder = "Enter custom value...",
}) => {
  // Track if we're in custom mode
  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState("");

  // Initialize state based on value
  useEffect(() => {
    // If value is not in options and not empty, it's a custom value
    if (value && !options.includes(value)) {
      setIsCustom(true);
      setCustomValue(value);
    } else {
      setIsCustom(false);
      setCustomValue("");
    }
  }, [value, options]);

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;

    if (selectedValue === CUSTOM_VALUE) {
      // Switched to custom mode
      setIsCustom(true);
      setCustomValue("");
      onChange(""); // Clear value when switching to custom
    } else {
      // Selected a predefined option
      setIsCustom(false);
      setCustomValue("");
      onChange(selectedValue);
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCustomValue = e.target.value;
    setCustomValue(newCustomValue);
    onChange(newCustomValue);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium text-text-primary">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
        {!required && (
          <span className="text-text-tertiary font-normal text-xs ml-1">
            (Optional)
          </span>
        )}
      </label>

      {/* Dropdown */}
      {!isCustom && (
        <select
          value={value || EMPTY_VALUE}
          onChange={handleDropdownChange}
          disabled={disabled}
          className="w-full px-4 py-2.5 bg-bg-tertiary border border-border-primary/50 rounded-lg text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed [&>option]:bg-bg-tertiary [&>option]:text-text-primary"
        >
          {allowEmpty && (
            <option value={EMPTY_VALUE}>Any / Let AI decide</option>
          )}

          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}

          <option value={CUSTOM_VALUE}>Custom...</option>
        </select>
      )}

      {/* Custom Input */}
      {isCustom && (
        <div className="space-y-2">
          <Input
            value={customValue}
            onChange={handleCustomInputChange}
            placeholder={customPlaceholder}
            disabled={disabled}
            className="w-full"
          />
          <button
            type="button"
            onClick={() => {
              setIsCustom(false);
              setCustomValue("");
              onChange("");
            }}
            disabled={disabled}
            className="text-xs text-primary hover:text-primary/80 disabled:opacity-50"
          >
            ← Back to dropdown
          </button>
        </div>
      )}
    </div>
  );
};
