'use client';

import React, { useState, useRef, useEffect } from 'react';

interface ImageDisplayProps {
  imageData: string;
  mimeType: string;
  trigger: {
    type: string;
    description: string;
  };
  className?: string;
}

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageData: string;
  mimeType: string;
  trigger: {
    type: string;
    description: string;
  };
}

const ImageModal: React.FC<ImageModalProps> = ({ isOpen, onClose, imageData, mimeType, trigger }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        ref={modalRef}
        className="relative max-w-4xl max-h-[90vh] bg-gray-900 rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-gray-800 border-b border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {trigger.type.charAt(0).toUpperCase() + trigger.type.slice(1)} Image
            </h3>
            <p className="text-sm text-gray-300 mt-1">{trigger.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Image */}
        <div className="p-4">
          <img
            src={`data:${mimeType};base64,${imageData}`}
            alt={trigger.description}
            className="max-w-full max-h-[70vh] object-contain rounded"
          />
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <p className="text-sm text-gray-400 text-center">
            Press ESC or click outside to close
          </p>
        </div>
      </div>
    </div>
  );
};

const ImageDisplay: React.FC<ImageDisplayProps> = ({ 
  imageData, 
  mimeType, 
  trigger, 
  className = '' 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageClick = () => {
    setIsModalOpen(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  if (imageError) {
    return (
      <div className={`bg-gray-800 border border-gray-600 rounded p-4 ${className}`}>
        <div className="text-red-400 text-sm">
          ❌ Failed to load image
        </div>
        <div className="text-gray-400 text-xs mt-1">
          {trigger.type}: {trigger.description}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`bg-gray-800 border border-gray-600 rounded p-3 ${className}`}>
        {/* Image Header */}
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm text-gray-300">
            <span className="font-semibold text-blue-400">🎨 {trigger.type.toUpperCase()}</span>
            <span className="text-gray-500 ml-2">Generated Image</span>
          </div>
          <button
            onClick={handleImageClick}
            className="text-xs text-blue-400 hover:text-blue-300 underline"
          >
            Click to expand
          </button>
        </div>

        {/* Image Container */}
        <div className="relative">
          {!imageLoaded && (
            <div className="flex items-center justify-center h-48 bg-gray-700 rounded">
              <div className="text-gray-400 text-sm">Loading image...</div>
            </div>
          )}
          
          <img
            src={`data:${mimeType};base64,${imageData}`}
            alt={trigger.description}
            className={`w-full h-auto max-h-48 object-cover rounded cursor-pointer transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={handleImageClick}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ display: imageLoaded ? 'block' : 'none' }}
          />
        </div>

        {/* Image Description */}
        <div className="mt-2 text-xs text-gray-400">
          {trigger.description}
        </div>
      </div>

      {/* Modal */}
      <ImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageData={imageData}
        mimeType={mimeType}
        trigger={trigger}
      />
    </>
  );
};

export default ImageDisplay;
