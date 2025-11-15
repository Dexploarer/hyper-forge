/**
 * 3D Panel Component
 *
 * A panel component designed for 3D viewers that allows simultaneous
 * interaction with both the panel and the 3D scene.
 */

import React from "react";
import { X } from "lucide-react";

interface ThreeDPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  side?: "left" | "right";
}

export const ThreeDPanel: React.FC<ThreeDPanelProps> = ({
  isOpen,
  onClose,
  title,
  children,
  side = "left",
}) => {
  return (
    <div
      className={`absolute top-0 bottom-0 w-[280px] bg-bg-secondary/95 backdrop-blur-md flex flex-col z-10 transition-transform duration-300 ease-out ${
        side === "left"
          ? `left-0 border-r border-border-primary ${isOpen ? "translate-x-0" : "-translate-x-full"}`
          : `right-0 border-l border-border-primary ${isOpen ? "translate-x-0" : "translate-x-full"}`
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-border-primary">
        <h3 className="text-text-primary text-base font-semibold m-0">
          {title}
        </h3>
        <button
          onClick={onClose}
          className="bg-transparent border-none text-text-secondary cursor-pointer p-1 flex items-center justify-center rounded transition-all hover:bg-white/10 hover:text-text-primary"
          aria-label="Close panel"
        >
          <X size={20} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-black/20 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb:hover]:bg-white/30">
        {children}
      </div>
    </div>
  );
};
