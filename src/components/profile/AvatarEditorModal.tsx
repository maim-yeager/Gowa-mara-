import React, { useState, useEffect, useRef } from 'react';
import { 
  readFileAsDataUrl, 
  loadImage, 
  processCanvasImage, 
  ProcessedResult,
  formatBytes 
} from '../../utils/imageProcessor';
import { uploadImageToServer } from '../../services/uploadService';
import { 
  X, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Check, 
  Upload, 
  AlertCircle,
  Camera,
  Sparkles
} from 'lucide-react';

interface AvatarEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAvatarSaved: (newAvatarUrl: string) => Promise<void>;
}

export const AvatarEditorModal: React.FC<AvatarEditorModalProps> = ({
  isOpen,
  onClose,
  onAvatarSaved
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceDataUrl, setSourceDataUrl] = useState<string>('');
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [rotationDeg, setRotationDeg] = useState<number>(0);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [processedResult, setProcessedResult] = useState<ProcessedResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!sourceDataUrl) return;
    let active = true;
    loadImage(sourceDataUrl).then((img) => {
      if (active) setImageEl(img);
    }).catch(console.error);
    return () => { active = false; };
  }, [sourceDataUrl]);

  // Real Canvas 1:1 circular/square avatar generator
  useEffect(() => {
    if (!imageEl) return;
    let active = true;
    setIsProcessing(true);

    const timer = setTimeout(async () => {
      try {
        const isRotated = Math.abs(rotationDeg % 180) === 90;
        const w = isRotated ? imageEl.naturalHeight : imageEl.naturalWidth;
        const h = isRotated ? imageEl.naturalWidth : imageEl.naturalHeight;
        const squareSize = Math.min(w, h);

        const canvas = document.createElement('canvas');
        canvas.width = 400; // Optimal avatar resolution
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.translate(200, 200);
        ctx.rotate((rotationDeg * Math.PI) / 180);
        ctx.scale(zoomScale, zoomScale);

        // Center crop
        const drawW = isRotated ? (400 * imageEl.naturalHeight) / squareSize : (400 * imageEl.naturalWidth) / squareSize;
        const drawH = isRotated ? (400 * imageEl.naturalWidth) / squareSize : (400 * imageEl.naturalHeight) / squareSize;

        ctx.drawImage(
          imageEl,
          -drawW / 2,
          -drawH / 2,
          drawW,
          drawH
        );

        canvas.toBlob((blob) => {
          if (!blob || !active) return;
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          setProcessedResult({
            blob,
            dataUrl,
            width: 400,
            height: 400,
            fileSizeBytes: blob.size,
            mimeType: 'image/jpeg'
          });
          setIsProcessing(false);
        }, 'image/jpeg', 0.9);

      } catch (err) {
        console.error("Avatar process error:", err);
        if (active) setIsProcessing(false);
      }
    }, 100);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [imageEl, rotationDeg, zoomScale]);

  if (!isOpen) return null;

  const handleFileChange = async (file: File) => {
    setErrorMsg(null);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMsg('Please select a JPG, PNG or WebP image.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('Image file size must be under 8MB.');
      return;
    }
    try {
      setSelectedFile(file);
      const url = await readFileAsDataUrl(file);
      setSourceDataUrl(url);
      setRotationDeg(0);
      setZoomScale(1);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to read image');
    }
  };

  const handleUploadAndSave = async () => {
    if (!processedResult) return;
    setIsUploading(true);
    setErrorMsg(null);
    setUploadStatus('Uploading avatar to ImgBB...');

    try {
      const uploadRes = await uploadImageToServer(processedResult.dataUrl, 'avatar_' + Date.now());
      if (uploadRes.success && uploadRes.data) {
        setUploadStatus('Updating user profile...');
        await onAvatarSaved(uploadRes.data.url);
        onClose();
      } else if (uploadRes.requiresConfig) {
        // Fallback for development if IMGBB_API_KEY is not set yet
        setUploadStatus('Using local preview avatar...');
        await onAvatarSaved(processedResult.dataUrl);
        onClose();
      } else {
        throw new Error(uploadRes.error || 'Failed to upload avatar image');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Avatar save failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="glass-card w-full max-w-md rounded-3xl border border-white/10 shadow-2xl p-5 sm:p-6 space-y-5 relative">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-base text-white">Profile Picture Studio</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Avatar Interactive Canvas Preview */}
        {processedResult ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center p-4 bg-slate-950/60 rounded-2xl border border-white/5 relative">
              {/* Circular Avatar Guide Mask */}
              <div className="w-44 h-44 rounded-full overflow-hidden border-2 border-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.35)] relative">
                <img
                  src={processedResult.dataUrl}
                  alt="Avatar Preview"
                  className="w-full h-full object-cover select-none"
                />
              </div>

              <span className="text-[10px] text-slate-400 mt-2 font-mono">
                Final: 400×400px ({formatBytes(processedResult.fileSizeBytes)})
              </span>
            </div>

            {/* Controls: Rotate & Zoom */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <ZoomIn className="w-3.5 h-3.5 text-purple-400" />
                  <span>Zoom / Scale</span>
                </span>
                <span className="font-mono text-purple-300">{Math.round(zoomScale * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="2.5"
                step="0.05"
                value={zoomScale}
                onChange={(e) => setZoomScale(parseFloat(e.target.value))}
                className="w-full accent-purple-500"
              />

              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setRotationDeg((prev) => (prev + 90) % 360)}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-white/5 transition-all"
                >
                  <RotateCw className="w-3.5 h-3.5 text-purple-400" />
                  <span>Rotate 90°</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium"
                >
                  Change Image
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/15 hover:border-purple-500/50 rounded-2xl p-8 text-center cursor-pointer hover:bg-white/5 transition-all space-y-3"
          >
            <div className="w-14 h-14 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mx-auto">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Choose a profile photo</p>
              <p className="text-xs text-slate-400 mt-0.5">JPG, PNG or WebP</p>
            </div>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
          }}
        />

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!processedResult || isUploading || isProcessing}
            onClick={handleUploadAndSave}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 shadow-lg shadow-purple-600/30 flex items-center gap-1.5 disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>{uploadStatus || 'Saving...'}</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Profile Picture</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
