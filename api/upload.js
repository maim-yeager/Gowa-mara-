/**
 * Vercel Serverless Function: ImgBB Secure Upload Proxy
 * Endpoint: /api/upload
 */

export default async function handler(req, res) {
  // Set CORS headers if needed
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    // Config status check
    return res.status(200).json({
      hasImgbbKey: !!process.env.IMGBB_API_KEY,
      nodeEnv: process.env.NODE_ENV || 'production'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { image, name } = req.body || {};
    if (!image) {
      return res.status(400).json({ success: false, error: 'No image data provided' });
    }

    const imgbbApiKey = process.env.IMGBB_API_KEY;
    if (!imgbbApiKey) {
      return res.status(200).json({
        success: false,
        requiresConfig: true,
        error: 'IMGBB_API_KEY is not configured in Vercel Environment Variables. Please set IMGBB_API_KEY to enable live cloud hosting via ImgBB.',
        code: 'MISSING_IMGBB_KEY'
      });
    }

    // Strip base64 metadata prefix if present
    const cleanBase64 = image.includes('base64,') ? image.split('base64,')[1] : image;

    const formBody = new URLSearchParams();
    formBody.append('image', cleanBase64);
    if (name) formBody.append('name', name);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
      method: 'POST',
      body: formBody,
    });

    const result = await response.json();
    if (result && result.success) {
      return res.status(200).json({
        success: true,
        data: {
          url: result.data.url,
          display_url: result.data.display_url,
          thumbnailUrl: result.data.thumb?.url || result.data.display_url,
          delete_url: result.data.delete_url,
          width: result.data.width,
          height: result.data.height,
          size: result.data.size,
          mimeType: result.data.image?.mime || 'image/jpeg'
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result?.error?.message || 'ImgBB upload failed'
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Serverless upload execution error'
    });
  }
}
