import { CheckCircle, AlertCircle } from "lucide-react";
import React from "react";

interface ReviewStepProps {
  data: any;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({ data }) => {
  const isValid = data.name && data.description && data.genre;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border-primary">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${isValid ? "bg-green-500/10" : "bg-yellow-500/10"}`}
        >
          {isValid ? (
            <CheckCircle className="w-6 h-6 text-green-500" />
          ) : (
            <AlertCircle className="w-6 h-6 text-yellow-500" />
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">Review & Save</h2>
          <p className="text-sm text-text-secondary">
            Review your configuration before saving
          </p>
        </div>
      </div>

      {/* Configuration Summary */}
      <div className="space-y-4">
        <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Basic Information
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Name:</span>
              <span className="text-text-primary font-medium">
                {data.name || <span className="text-red-400">Not set</span>}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Genre:</span>
              <span className="text-text-primary font-medium">
                {data.genre || <span className="text-red-400">Not set</span>}
              </span>
            </div>
            {data.tags && data.tags.length > 0 && (
              <div className="flex justify-between">
                <span className="text-text-secondary">Tags:</span>
                <span className="text-text-primary font-medium">
                  {data.tags.join(", ")}
                </span>
              </div>
            )}
            {data.isTemplate && (
              <div className="flex justify-between">
                <span className="text-text-secondary">Template:</span>
                <span className="text-green-400 font-medium">Yes</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-bg-secondary border border-border-primary rounded-lg">
          <h3 className="text-sm font-semibold text-text-primary mb-2">
            Description
          </h3>
          <p className="text-sm text-text-secondary">
            {data.description || <span className="text-red-400">Not set</span>}
          </p>
        </div>

        {!isValid && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-sm text-yellow-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Please complete all required fields before saving
            </p>
          </div>
        )}

        {isValid && (
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-sm text-green-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Configuration is ready to save
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
