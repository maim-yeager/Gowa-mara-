import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { AppHeader } from '../components/layout/AppHeader';
import { ApprovalStatusCard } from '../components/common/ApprovalStatusCard';
import { ImageEditorModal } from '../components/upload/ImageEditorModal';
import { 
  readFileAsDataUrl, 
  loadImage, 
  formatBytes, 
  ProcessedResult, 
  ImageMetadata 
} from '../utils/imageProcessor';
import { uploadImageToServer } from '../services/uploadService';
import { 
  db, 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  increment, 
  serverTimestamp, 
  handleFirestoreError, 
  OperationType 
} from '../services/firebase';
import { 
  Upload, 
  Image as ImageIcon, 
  Sliders, 
  Info, 
  Sparkles, 
  Lock, 
  Globe, 
  Users, 
  Check, 
  AlertCircle,
  Clock
} from 'lucide-react';
import { APP_CONFIG } from '../config/appConfig';

export const UploadPage: React.FC = () => {
  const { currentUser, profile, isApproved } = useAuth();
  const { navigate } = useRouter();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceDataUrl, setSourceDataUrl] = useState<string>('');
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);
  const [processedResult, setProcessedResult] = useState<ProcessedResult | null>(null);
  const [showEditor, setShowEditor] = useState<boolean>(false);

  // Form Fields
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [tagsInput, setTagsInput] = useState<string>('');
  const [category, setCategory] = useState<string>('Photography');
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>('public');
  const [sharingAllowed, setSharingAllowed] = useState<boolean>(false);
  const [downloadAllowed, setDownloadAllowed] = useState<boolean>(true);

  // State
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successPostId, setSuccessPostId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setErrorMsg(null);
    if (!APP_CONFIG.allowedMimeTypes.includes(file.type)) {
      setErrorMsg(`Unsupported format (${file.type}). Allowed formats: JPEG, PNG, WebP, GIF.`);
      return;
    }

    if (file.size > APP_CONFIG.maxUploadSizeBytes) {
      setErrorMsg(`File is too large (${formatBytes(file.size)}). Max allowed is ${formatBytes(APP_CONFIG.maxUploadSizeBytes)}.`);
      return;
    }

    try {
      setSelectedFile(file);
      const dataUrl = await readFileAsDataUrl(file);
      setSourceDataUrl(dataUrl);

      const img = await loadImage(dataUrl);
      const meta: ImageMetadata = {
        fileName: file.name,
        fileSizeBytes: file.size,
        width: img.naturalWidth,
        height: img.naturalHeight,
        mimeType: file.type,
        lastModified: new Date(file.lastModified).toLocaleString(),
        aspectRatio: `${img.naturalWidth}:${img.naturalHeight}`
      };
      setMetadata(meta);

      // Default processed result is the loaded image
      setProcessedResult({
        blob: file,
        dataUrl: dataUrl,
        width: img.naturalWidth,
        height: img.naturalHeight,
        fileSizeBytes: file.size,
        mimeType: file.type
      });
    } catch (err: any) {
      setErrorMsg('Failed to process image file: ' + err.message);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !profile) {
      navigate('/login');
      return;
    }

    if (!isApproved) {
      setErrorMsg('Your account is pending administrator approval. Only approved accounts can publish posts.');
      return;
    }

    if (!processedResult) {
      setErrorMsg('Please select an image first.');
      return;
    }

    if (!title.trim()) {
      setErrorMsg('Please provide a title for your post.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);
    setUploadProgressMsg('Uploading image through secure ImgBB proxy...');

    try {
      // 1. Upload through backend endpoint to ImgBB
      const uploadRes = await uploadImageToServer(
        processedResult.dataUrl,
        title.replace(/[^a-zA-Z0-9_-]/g, '_')
      );

      let finalImageUrl = '';
      let finalThumbnailUrl = '';

      if (uploadRes.success && uploadRes.data) {
        finalImageUrl = uploadRes.data.url;
        finalThumbnailUrl = uploadRes.data.thumbnailUrl;
      } else if (uploadRes.requiresConfig) {
        // If developer has not yet added IMGBB_API_KEY in .env, notify user clearly
        // For development safety, allow user to test or configure
        setErrorMsg(uploadRes.error || 'IMGBB_API_KEY is not configured in .env. Please add it to enable cloud image hosting.');
        setIsUploading(false);
        return;
      } else {
        throw new Error(uploadRes.error || 'Image upload failed. Please try again.');
      }

      setUploadProgressMsg('Saving post to Firestore...');

      // Parse tags
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ''))
        .filter((t) => t.length > 0)
        .slice(0, 10);

      // 2. Create post document in Firestore
      const newPostData = {
        ownerId: currentUser.uid,
        ownerUsername: profile.username,
        ownerAvatar: profile.photoUrl || '',
        title: title.trim().slice(0, 200),
        description: description.trim().slice(0, 2000),
        tags: tags,
        category: category,
        imageUrl: finalImageUrl,
        thumbnailUrl: finalThumbnailUrl || finalImageUrl,
        width: processedResult.width,
        height: processedResult.height,
        fileSize: processedResult.fileSizeBytes,
        mimeType: processedResult.mimeType,
        visibility: visibility,
        sharingAllowed: sharingAllowed,
        downloadAllowed: downloadAllowed,
        status: 'active',
        likeCount: 0,
        commentCount: 0,
        viewCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'posts'), newPostData);
      
      // Increment user's postCount
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          postCount: increment(1)
        });
      } catch (err) {
        console.warn("User postCount increment non-critical error:", err);
      }

      setSuccessPostId(docRef.id);
      setTimeout(() => {
        navigate(`/post/${docRef.id}`);
      }, 1200);

    } catch (err: any) {
      console.error("Publish error:", err);
      setErrorMsg(err.message || 'Image upload failed. Please try again.');
      handleFirestoreError(err, OperationType.CREATE, 'posts');
    } finally {
      setIsUploading(false);
    }
  };

  // If user is not logged in
  if (!currentUser) {
    return (
      <div className="min-h-screen pb-20">
        <AppHeader title="Create Post" />
        <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Authentication Required</h2>
          <p className="text-xs text-slate-400">
            Please log in or register to publish content to Gowa Mara.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg"
          >
            Sign In / Register
          </button>
        </div>
      </div>
    );
  }

  // If user is not yet approved
  if (!isApproved) {
    return (
      <div className="min-h-screen pb-20">
        <AppHeader title="Publishing Privileges" />
        <div className="max-w-xl mx-auto px-4 pt-8 space-y-6">
          <ApprovalStatusCard />

          <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-300">
                <Info className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Why is my account pending?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Gowa Mara enforces a strict quality and community moderation standard: registration does not automatically grant public publishing permissions. Only accounts approved by an administrator can upload images.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your registration request has been submitted to the Admin Approval Center. Once approved, this Upload interface will automatically unlock!
            </p>
            <button
              onClick={() => navigate('/home')}
              className="w-full py-2.5 rounded-2xl text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 transition-colors"
            >
              Return to Home Feed
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 md:pb-12">
      <AppHeader title="Create Image Post" />

      <main className="max-w-2xl mx-auto px-4 pt-4 sm:pt-6 space-y-6">
        <form onSubmit={handlePublish} className="space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Notice</p>
                <p className="mt-0.5 opacity-90">{errorMsg}</p>
              </div>
            </div>
          )}

          {successPostId && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
              <Check className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-bold">Post Published Successfully!</p>
                <p className="mt-0.5 opacity-90">Redirecting to your post...</p>
              </div>
            </div>
          )}

          {/* Image Selection Area */}
          <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-purple-400" />
              <span>Select & Optimize Image</span>
            </h3>

            {processedResult ? (
              <div className="space-y-3">
                <div className="relative aspect-[16/10] bg-slate-950 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center group">
                  <img
                    src={processedResult.dataUrl}
                    alt="Ready to upload"
                    className="max-h-full max-w-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowEditor(true)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-lg flex items-center gap-1.5"
                    >
                      <Sliders className="w-4 h-4" />
                      <span>Launch Studio</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-200 bg-white/20 hover:bg-white/30 backdrop-blur-md"
                    >
                      Change File
                    </button>
                  </div>
                </div>

                {/* Real File & Canvas Metadata Inspector */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono bg-slate-950/60 p-3 rounded-2xl border border-white/5 text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[10px]">ORIGINAL SIZE</span>
                    <span>{formatBytes(metadata?.fileSizeBytes || 0)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">OPTIMIZED SIZE</span>
                    <span className="text-emerald-400 font-bold">{formatBytes(processedResult.fileSizeBytes)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">DIMENSIONS</span>
                    <span>{processedResult.width}×{processedResult.height}px</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">FORMAT</span>
                    <span className="text-purple-300">{processedResult.mimeType.replace('image/', '')}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setShowEditor(true)}
                    className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1.5"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Open Canvas Image Studio (Crop, Rotate, Compress)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/15 hover:border-purple-500/50 rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-white/5 space-y-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Click or tap to choose an image</p>
                  <p className="text-xs text-slate-400 mt-1">JPEG, PNG, WebP or GIF up to 10MB</p>
                </div>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />
          </div>

          {/* Post Information Form */}
          <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-4">
            <h3 className="font-bold text-sm text-white">Post Information</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Post Title *
              </label>
              <input
                type="text"
                placeholder="Give your image an inspiring title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                required
                className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Description
              </label>
              <textarea
                placeholder="Share the story, camera settings, context or techniques behind this image..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={2000}
                className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Photography">Photography</option>
                  <option value="Digital Art">Digital Art</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="UI/UX Design">UI/UX Design</option>
                  <option value="Wallpapers">Wallpapers</option>
                  <option value="Anime">Anime</option>
                  <option value="Nature">Nature</option>
                  <option value="Technology">Technology</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="art, cyberpunk, dark, aesthetic"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Visibility & Permissions */}
            <div className="pt-2 border-t border-white/5 space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Visibility & Sharing Permissions
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'public', label: 'Public', icon: Globe },
                  { id: 'friends', label: 'Friends', icon: Users },
                  { id: 'private', label: 'Private', icon: Lock },
                ].map((v) => {
                  const Icon = v.icon;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVisibility(v.id as any)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        visibility === v.id
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{v.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Public Sharing Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                <div>
                  <p className="text-xs font-semibold text-white">Enable Public Share URL</p>
                  <p className="text-[11px] text-slate-400">
                    Allows sharing link externally via /p/:postId when public
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="sharingAllowed"
                  checked={sharingAllowed}
                  onChange={(e) => setSharingAllowed(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-white/10"
                />
              </div>

              {/* Download Permission Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                <div>
                  <p className="text-xs font-semibold text-white">Allow Post Downloads</p>
                  <p className="text-[11px] text-slate-400">
                    Permits community members to download this high-resolution photo
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="downloadAllowed"
                  checked={downloadAllowed}
                  onChange={(e) => setDownloadAllowed(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-white/10"
                />
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isUploading || !processedResult || !title.trim()}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 hover:opacity-95 disabled:opacity-50 transition-all shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>{uploadProgressMsg || 'Publishing...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Publish to Gowa Mara</span>
              </>
            )}
          </button>
        </form>
      </main>

      {/* Canvas Image Editor Modal */}
      {showEditor && sourceDataUrl && metadata && (
        <ImageEditorModal
          isOpen={showEditor}
          onClose={() => setShowEditor(false)}
          sourceDataUrl={sourceDataUrl}
          originalFileName={metadata.fileName}
          originalSizeBytes={metadata.fileSizeBytes}
          onSaveProcessed={(res) => setProcessedResult(res)}
        />
      )}
    </div>
  );
};
