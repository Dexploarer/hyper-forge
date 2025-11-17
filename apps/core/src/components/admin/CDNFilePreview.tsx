/**
 * CDN File Preview
 * Modal for previewing different file types
 */

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Modal, ModalHeader, ModalBody } from "@/components/common";
import type { CDNFile } from "@/types/cdn";

interface CDNFilePreviewProps {
  file: CDNFile;
  onClose: () => void;
}

const ImagePreview: React.FC<{ path: string; name: string }> = ({
  path,
  name,
}) => {
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  return (
    <div className="flex flex-col items-center">
      <img
        src={`/${path}`}
        alt={name}
        className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
        onLoad={(e) => {
          const img = e.target as HTMLImageElement;
          setDimensions({
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
        }}
      />
      {dimensions && (
        <div className="mt-4 text-sm text-text-tertiary">
          <div>
            Dimensions: {dimensions.width} x {dimensions.height}px
          </div>
          <div>
            Aspect Ratio: {(dimensions.width / dimensions.height).toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
};

const JSONPreview: React.FC<{ path: string }> = ({ path }) => {
  const [jsonData, setJsonData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/${path}`)
      .then((res) => res.json())
      .then((data) => setJsonData(data))
      .catch((err) => setError(err.message));
  }, [path]);

  if (error) {
    return <div className="text-red-400">Error loading JSON: {error}</div>;
  }

  if (!jsonData) {
    return <div className="text-text-tertiary">Loading...</div>;
  }

  return (
    <pre className="bg-bg-tertiary rounded-lg p-4 overflow-auto max-h-[70vh] text-sm text-text-primary">
      <code>{JSON.stringify(jsonData, null, 2)}</code>
    </pre>
  );
};

const AudioPreview: React.FC<{ path: string; name: string }> = ({
  path,
  name,
}) => {
  return (
    <div className="w-full">
      <audio controls className="w-full">
        <source src={`/${path}`} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
      <div className="mt-4 text-sm text-text-tertiary">
        <div>File: {name}</div>
      </div>
    </div>
  );
};

const VideoPreview: React.FC<{ path: string; name: string }> = ({
  path,
  name,
}) => {
  return (
    <div className="w-full">
      <video controls className="w-full max-h-[70vh] rounded-lg">
        <source src={`/${path}`} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="mt-4 text-sm text-text-tertiary">
        <div>File: {name}</div>
      </div>
    </div>
  );
};

const GLBPreview: React.FC<{ path: string; name: string }> = ({
  path,
  name,
}) => {
  // For simplicity, we'll just show a message to use the 3D viewer
  // In a full implementation, you would integrate Three.js here
  return (
    <div className="text-center py-12">
      <div className="text-text-primary mb-2">3D Model Preview</div>
      <div className="text-sm text-text-tertiary mb-4">File: {name}</div>
      <a
        href={`/${path}`}
        download
        className="inline-block px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white transition-colors"
      >
        Download Model
      </a>
    </div>
  );
};

const UnsupportedPreview: React.FC<{ file: CDNFile }> = ({ file }) => {
  return (
    <div className="text-center py-12">
      <div className="text-text-primary mb-2">Preview not available</div>
      <div className="text-sm text-text-tertiary mb-4">
        File type {file.type} cannot be previewed
      </div>
      <a
        href={`/${file.path}`}
        download
        className="inline-block px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white transition-colors"
      >
        Download File
      </a>
    </div>
  );
};

export const CDNFilePreview: React.FC<CDNFilePreviewProps> = ({
  file,
  onClose,
}) => {
  const renderPreview = () => {
    const type = file.type.toLowerCase();

    if ([".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(type)) {
      return <ImagePreview path={file.path} name={file.name} />;
    }

    if (type === ".json") {
      return <JSONPreview path={file.path} />;
    }

    if (type === ".mp3") {
      return <AudioPreview path={file.path} name={file.name} />;
    }

    if (type === ".mp4") {
      return <VideoPreview path={file.path} name={file.name} />;
    }

    if (type === ".glb") {
      return <GLBPreview path={file.path} name={file.name} />;
    }

    return <UnsupportedPreview file={file} />;
  };

  return (
    <Modal open={true} onClose={onClose} className="max-w-6xl w-full">
      <ModalHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-text-primary">{file.name}</h3>
            <p className="text-sm text-text-tertiary mt-1">{file.path}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
          >
            <X className="w-6 h-6 text-text-secondary" />
          </button>
        </div>
      </ModalHeader>
      <ModalBody>{renderPreview()}</ModalBody>
    </Modal>
  );
};
