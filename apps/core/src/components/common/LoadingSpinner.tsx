import { Loader2 } from "lucide-react";
import React from "react";
import { cn } from "@/styles";

export interface LoadingSpinnerProps {
  size?: "xs" | "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

const sizeClasses = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-8 h-8",
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  text,
  className,
}) => {
  const spinner = (
    <Loader2 className={cn(sizeClasses[size], "animate-spin", className)} />
  );

  if (text) {
    return (
      <div className="flex items-center gap-2">
        {spinner}
        <span className="text-sm text-text-secondary">{text}</span>
      </div>
    );
  }

  return spinner;
};
