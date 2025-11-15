import React from "react";
import { X, Download } from "lucide-react";
import { Modal } from "../common";
import { Button } from "../common";
import { cn } from "@/styles";

interface ImageEnlargeModalProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  alt: string;
  title?: string;
  onDownload?: () => void;
}

/**
 * Modal for displaying enlarged images with download option
 * Used for NPC portraits and other generated images
 */
export const ImageEnlargeModal: React.FC<ImageEnlargeModalProps> = ({
  open,
  onClose,
  imageUrl,
  alt,
  title,
  onDownload,
}) => {
  return (
    <Modal open={open} onClose={onClose} size="full">
      <div className="relative w-full h-full bg-black/95 flex items-center justify-center p-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-tooltip p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Title */}
        {title && (
          <div className="absolute top-4 left-4 z-tooltip">
            <h3 className="text-lg font-semibold text-white backdrop-blur-sm bg-black/50 px-4 py-2 rounded-lg">
              {title}
            </h3>
          </div>
        )}

        {/* Image */}
        <div className="relative max-w-6xl max-h-[90vh] animate-modal-appear">
          <img
            src={imageUrl}
            alt={alt}
            className="w-full h-full object-contain rounded-lg shadow-2xl"
          />
        </div>

        {/* Download Button */}
        {onDownload && (
          <div className="absolute bottom-4 right-4 z-tooltip">
            <Button
              onClick={onDownload}
              variant="secondary"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        )}

        {/* Click backdrop to close */}
        <div
          className="absolute inset-0 -z-10"
          onClick={onClose}
          aria-hidden="true"
        />
      </div>
    </Modal>
  );
};
