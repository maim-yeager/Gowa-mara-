import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, Download, Share2 } from 'lucide-react';

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
  allowDownload?: boolean;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  allowDownload = false
}) => {
  const [scale, setScale] = useState<number>(1);

  if (!isOpen) return null;

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.3, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.3, 0.6));
  const handleReset = () => setScale(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      {/* Controls Header */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-10 pointer-events-auto">
        <h3 className="text-sm font-semibold truncate max-w-xs sm:max-w-md text-slate-200">
          {title || 'Image Preview'}
        </h3>

        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            aria-label="Zoom out"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 transition-all"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomIn}
            aria-label="Zoom in"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 transition-all"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          {allowDownload && (
            <a
              href={imageUrl}
              download
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 transition-all"
            >
              <Download className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-all ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Image container */}
      <div 
        className="max-w-4xl max-h-[85vh] flex items-center justify-center overflow-auto cursor-zoom-in transition-transform duration-200"
        onClick={scale === 1 ? handleZoomIn : handleReset}
      >
        <img
          src={imageUrl}
          alt={title || 'Preview'}
          style={{ transform: `scale(${scale})` }}
          className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl transition-transform duration-200 select-none"
        />
      </div>
    </div>
  );
};
