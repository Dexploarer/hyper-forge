import React from 'react';
import { X } from 'lucide-react';
import { GlassEffect } from './GlassEffect';

interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  preset?: 'dock' | 'pill' | 'bubble' | 'modal' | 'panel';
}

export const GlassModal: React.FC<GlassModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  preset = 'modal',
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal with Glass Effect */}
      <GlassEffect
        preset={preset}
        className={`relative ${sizeClasses[size]} w-full animate-scale-in`}
        intensity={0.3}
        blur={12}
        saturation={1.2}
        frost={0.08}
      >
        <div className="glass-modal-content rounded-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h2 className="text-xl font-semibold text-text-primary drop-shadow-lg">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-text-primary drop-shadow-md" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 [&>*]:drop-shadow-md">{children}</div>
        </div>
      </GlassEffect>
    </div>
  );
};

export default GlassModal;
