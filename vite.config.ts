import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import dotenv from 'dotenv';
import {defineConfig, Plugin} from 'vite';

dotenv.config();

function backendApiPlugin(): Plugin {
  return {
    name: 'gowamara-backend-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/upload' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const { image, name } = data;
              if (!image) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, error: 'No image data provided' }));
              }

              const imgbbApiKey = process.env.IMGBB_API_KEY;
              if (!imgbbApiKey) {
                // If IMGBB_API_KEY is not set in environment, check if client provided an authorized custom key or notify configuration required
                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({
                  success: false,
                  requiresConfig: true,
                  error: 'IMGBB_API_KEY is not configured in .env. Please set IMGBB_API_KEY to enable live cloud hosting via ImgBB.',
                  code: 'MISSING_IMGBB_KEY'
                }));
              }

              // Extract base64 without prefix if present
              const cleanBase64 = image.includes('base64,') ? image.split('base64,')[1] : image;

              // Send to ImgBB
              const formBody = new URLSearchParams();
              formBody.append('image', cleanBase64);
              if (name) formBody.append('name', name);

              const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
                method: 'POST',
                body: formBody,
              });

              const result = await response.json();
              if (result && result.success) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({
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
                }));
              } else {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({
                  success: false,
                  error: result?.error?.message || 'ImgBB upload failed'
                }));
              }
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ success: false, error: err.message || 'Server upload error' }));
            }
          });
          return;
        }

        // Endpoint to check environment configuration status
        if (req.url === '/api/config-status' && req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            hasImgbbKey: !!process.env.IMGBB_API_KEY,
            nodeEnv: process.env.NODE_ENV || 'development'
          }));
        }

        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), backendApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

