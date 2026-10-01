/**
 * Upload Service for Gowa Mara
 * Proxies through secure backend to ImgBB
 */

export interface UploadResponse {
  success: boolean;
  data?: {
    url: string;
    display_url: string;
    thumbnailUrl: string;
    delete_url?: string;
    width: number;
    height: number;
    size: number;
    mimeType: string;
  };
  error?: string;
  requiresConfig?: boolean;
  code?: string;
}

export async function uploadImageToServer(
  base64OrDataUrl: string,
  imageName?: string
): Promise<UploadResponse> {
  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64OrDataUrl,
        name: imageName || 'gowamara_' + Date.now(),
      }),
    });

    const result = await res.json();
    return result;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error during upload',
    };
  }
}

export async function checkServerConfig(): Promise<{ hasImgbbKey: boolean; nodeEnv: string }> {
  try {
    const res = await fetch('/api/config-status');
    return await res.json();
  } catch {
    return { hasImgbbKey: false, nodeEnv: 'development' };
  }
}
