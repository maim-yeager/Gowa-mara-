/**
 * Image processing utilities using browser Canvas API
 * Real byte and dimension processing without mock values
 */

export interface ProcessImageOptions {
  imageElement: HTMLImageElement;
  crop?: { x: number; y: number; width: number; height: number };
  rotationDeg: number; // 0, 90, 180, 270
  flipH: boolean;
  flipV: boolean;
  targetWidth?: number;
  targetHeight?: number;
  quality: number; // 0.1 to 1.0
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface ProcessedResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  fileSizeBytes: number;
  mimeType: string;
}

export interface ImageMetadata {
  fileName: string;
  fileSizeBytes: number;
  width: number;
  height: number;
  mimeType: string;
  lastModified?: string;
  aspectRatio: string;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function processCanvasImage(options: ProcessImageOptions): Promise<ProcessedResult> {
  const {
    imageElement,
    crop,
    rotationDeg,
    flipH,
    flipV,
    targetWidth,
    targetHeight,
    quality,
    mimeType
  } = options;

  // 1. Determine base source bounds
  const srcX = crop ? crop.x : 0;
  const srcY = crop ? crop.y : 0;
  const srcW = crop ? crop.width : imageElement.naturalWidth;
  const srcH = crop ? crop.height : imageElement.naturalHeight;

  // 2. Final canvas dimensions considering rotation
  const is90or270 = Math.abs(rotationDeg % 180) === 90;
  let finalW = is90or270 ? srcH : srcW;
  let finalH = is90or270 ? srcW : srcH;

  if (targetWidth && targetHeight) {
    finalW = targetWidth;
    finalH = targetHeight;
  } else if (targetWidth) {
    const ratio = finalH / finalW;
    finalW = targetWidth;
    finalH = Math.round(targetWidth * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, finalW);
  canvas.height = Math.max(1, finalH);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context is not supported');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Move origin to center of destination
  ctx.translate(canvas.width / 2, canvas.height / 2);

  // Apply rotation
  ctx.rotate((rotationDeg * Math.PI) / 180);

  // Apply flips
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

  // Draw image
  const drawW = is90or270 ? canvas.height : canvas.width;
  const drawH = is90or270 ? canvas.width : canvas.height;

  ctx.drawImage(
    imageElement,
    srcX,
    srcY,
    srcW,
    srcH,
    -drawW / 2,
    -drawH / 2,
    drawW,
    drawH
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          return reject(new Error('Canvas toBlob conversion failed'));
        }
        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve({
          blob,
          dataUrl,
          width: canvas.width,
          height: canvas.height,
          fileSizeBytes: blob.size,
          mimeType
        });
      },
      mimeType,
      quality
    );
  });
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
