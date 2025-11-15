/**
 * 3D Panel Component
 *
 * A panel component designed for 3D viewers that allows simultaneous
 * interaction with both the panel and the 3D scene.
 */

import React from "react";
import { X } from "lucide-react";
import styled from "styled-components";

const PanelContainer = styled.div<{
  $isOpen: boolean;
  $side: "left" | "right";
}>`
  position: absolute;
  ${(props) => (props.$side === "left" ? "left: 0;" : "right: 0;")}
  top: 0;
  bottom: 0;
  width: 280px;
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(10px);
  ${(props) =>
    props.$side === "left"
      ? "border-right: 1px solid rgba(255, 255, 255, 0.1);"
      : "border-left: 1px solid rgba(255, 255, 255, 0.1);"}
  transform: translateX(${(props) => {
    if (props.$side === "left") {
      return props.$isOpen ? "0" : "-100%";
    } else {
      return props.$isOpen ? "0" : "100%";
    }
  }});
  transition: transform 0.3s ease-out;
  display: flex;
  flex-direction: column;
  z-index: 10;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const PanelTitle = styled.h3`
  color: white;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
`;

const PanelContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

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
    <PanelContainer $isOpen={isOpen} $side={side}>
      <PanelHeader>
        <PanelTitle>{title}</PanelTitle>
        <CloseButton onClick={onClose} aria-label="Close panel">
          <X size={20} />
        </CloseButton>
      </PanelHeader>
      <PanelContent>{children}</PanelContent>
    </PanelContainer>
  );
};
