import React, { useState, useEffect, useRef } from 'react';
import { 
  processCanvasImage, 
  loadImage, 
  formatBytes, 
  ProcessedResult 
} from '../../utils/imageProcessor';
import { 
  X, 
  RotateCw, 
  FlipHorizontal, 
  FlipVertical, 
  Maximize2, 
  Check, 
  Sliders, 
  Crop,
  Layers,
  Sparkles
} from 'lucide-react';

interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceDataUrl: string;
  originalFileName: string;
  originalSizeBytes: number;
  onSaveProcessed: (result: ProcessedResult) => void;
}

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  isOpen,
  onClose,
  sourceDataUrl,
  originalFileName,
  originalSizeBytes,
  onSaveProcessed
}) => {
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [rotationDeg, setRotationDeg] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [quality, setQuality] = useState<number>(0.85);
  const [mimeType, setMimeType] = useState<'image/jpeg' | 'image/webp' | 'image/png'>('image/webp');
  const [targetWidth, setTargetWidth] = useState<number>(0);
  const [targetHeight, setTargetHeight] = useState<number>(0);
  const [aspectRatioLocked, setAspectRatioLocked] = useState<boolean>(true);
  
  // Real processed live output
  const [processedResult, setProcessedResult] = useState<ProcessedResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'transform' | 'resize' | 'compress'>('transform');

  // Load image element
  useEffect(() => {
    if (!sourceDataUrl) return;
    let active = true;
    loadImage(sourceDataUrl).then((img) => {
      if (active) {
        setImageEl(img);
        setTargetWidth(img.naturalWidth);
        setTargetHeight(img.naturalHeight);
      }
    }).catch(console.error);

    return () => { active = false; };
  }, [sourceDataUrl]);

  // Run canvas processing whenever settings change
  useEffect(() => {
    if (!imageEl) return;
    let active = true;
    setIsProcessing(true);

    const timer = setTimeout(async () => {
      try {
        const result = await processCanvasImage({
          imageElement: imageEl,
          rotationDeg,
          flipH,
          flipV,
          targetWidth: targetWidth || undefined,
          targetHeight: targetHeight || undefined,
          quality,
          mimeType
        });
        if (active) {
          setProcessedResult(result);
        }
      } catch (err) {
        console.error("Canvas processing error:", err);
      } finally {
        if (active) setIsProcessing(false);
      }
    }, 120);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [imageEl, rotationDeg, flipH, flipV, targetWidth, targetHeight, quality, mimeType]);

  if (!isOpen) return null;

  const handleRotate = () => {
    setRotationDeg((prev) => (prev + 90) % 360);
  };

  const handleWidthChange = (newW: number) => {
    setTargetWidth(newW);
    if (aspectRatioLocked && imageEl) {
      const isRotated = Math.abs(rotationDeg % 180) === 90;
      const naturalW = isRotated ? imageEl.naturalHeight : imageEl.naturalWidth;
      const naturalH = isRotated ? imageEl.naturalWidth : imageEl.naturalHeight;
      const ratio = naturalH / naturalW;
      setTargetHeight(Math.round(newW * ratio));
    }
  };

  const handleSave = () => {
    if (processedResult) {
      onSaveProcessed(processedResult);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-2 sm:p-4 animate-fade-in">
      <div className="glass-card w-full max-w-4xl h-[92vh] max-h-[850px] rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-purple-400" />
            <h2 className="font-bold text-sm sm:text-base text-white">Canvas Image Studio</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={!processedResult || isProcessing}
              className="px-4 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 transition-all flex items-center gap-1.5 shadow-md shadow-purple-600/30 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Apply Changes</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-full bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area: Canvas Preview + Controls Sidebar */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Real Preview Canvas */}
          <div className="flex-1 p-4 flex items-center justify-center bg-[#05070e] relative overflow-hidden">
            {processedResult ? (
              <img
                src={processedResult.dataUrl}
                alt="Processed Live Preview"
                className="max-h-[50vh] md:max-h-[70vh] max-w-full object-contain rounded-xl shadow-2xl transition-all"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-500 text-xs">
                <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                <span>Processing Canvas...</span>
              </div>
            )}

            {isProcessing && (
              <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] text-purple-300 font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                <span>Recalculating...</span>
              </div>
            )}
          </div>

          {/* Controls Panel */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-white/10 bg-slate-900/80 p-4 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              {/* Tab Selector */}
              <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-2xl">
                <button
                  onClick={() => setActiveTab('transform')}
                  className={`py-1.5 text-xs font-semibold rounded-xl transition-all ${
                    activeTab === 'transform' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Transform
                </button>
                <button
                  onClick={() => setActiveTab('resize')}
                  className={`py-1.5 text-xs font-semibold rounded-xl transition-all ${
                    activeTab === 'resize' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Resize
                </button>
                <button
                  onClick={() => setActiveTab('compress')}
                  className={`py-1.5 text-xs font-semibold rounded-xl transition-all ${
                    activeTab === 'compress' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Optimize
                </button>
              </div>

              {/* Tab 1: Transform */}
              {activeTab === 'transform' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={handleRotate}
                      className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all"
                    >
                      <RotateCw className="w-5 h-5 mb-1 text-purple-400" />
                      <span className="text-[11px] font-medium">Rotate 90°</span>
                      <span className="text-[10px] text-slate-500">{rotationDeg}°</span>
                    </button>

                    <button
                      onClick={() => setFlipH(!flipH)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all ${
                        flipH ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-white/5 hover:bg-white/10 text-slate-300'
                      }`}
                    >
                      <FlipHorizontal className="w-5 h-5 mb-1" />
                      <span className="text-[11px] font-medium">Flip H</span>
                      <span className="text-[10px] text-slate-500">{flipH ? 'On' : 'Off'}</span>
                    </button>

                    <button
                      onClick={() => setFlipV(!flipV)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all ${
                        flipV ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-white/5 hover:bg-white/10 text-slate-300'
                      }`}
                    >
                      <FlipVertical className="w-5 h-5 mb-1" />
                      <span className="text-[11px] font-medium">Flip V</span>
                      <span className="text-[10px] text-slate-500">{flipV ? 'On' : 'Off'}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setRotationDeg(0);
                      setFlipH(false);
                      setFlipV(false);
                    }}
                    className="w-full py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    Reset Transforms
                  </button>
                </div>
              )}

              {/* Tab 2: Resize */}
              {activeTab === 'resize' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Width (px)
                    </label>
                    <input
                      type="number"
                      min={100}
                      max={4000}
                      value={targetWidth}
                      onChange={(e) => handleWidthChange(parseInt(e.target.value) || 100)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Height (px)
                    </label>
                    <input
                      type="number"
                      min={100}
                      max={4000}
                      value={targetHeight}
                      onChange={(e) => setTargetHeight(parseInt(e.target.value) || 100)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-xs text-white"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="aspectLock"
                      checked={aspectRatioLocked}
                      onChange={(e) => setAspectRatioLocked(e.target.checked)}
                      className="rounded bg-slate-800 text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="aspectLock" className="text-xs text-slate-300 cursor-pointer">
                      Lock aspect ratio
                    </label>
                  </div>
                </div>
              )}

              {/* Tab 3: Compression & Format */}
              {activeTab === 'compress' && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                      <span>Quality / Compression</span>
                      <span className="text-purple-400">{Math.round(quality * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={quality}
                      onChange={(e) => setQuality(parseFloat(e.target.value))}
                      className="w-full accent-purple-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                      <span>Smaller File</span>
                      <span>High Fidelity</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Export Format
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['image/webp', 'image/jpeg', 'image/png'] as const).map((fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => setMimeType(fmt)}
                          className={`py-2 rounded-xl text-xs font-semibold uppercase transition-all ${
                            mimeType === fmt
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'bg-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          {fmt.replace('image/', '')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Live Real Metadata Inspector */}
            <div className="pt-4 border-t border-white/10 space-y-2">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Live Byte & Dimension Inspector
              </h4>
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-white/5 text-[11px] space-y-1 font-mono text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Original Size:</span>
                  <span>{formatBytes(originalSizeBytes)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Processed Size:</span>
                  <span className="text-emerald-400 font-bold">
                    {processedResult ? formatBytes(processedResult.fileSizeBytes) : '...'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dimensions:</span>
                  <span>
                    {processedResult ? `${processedResult.width} × ${processedResult.height}px` : '...'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">MIME Format:</span>
                  <span className="text-purple-300">{mimeType}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
