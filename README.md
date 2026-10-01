# Gowa Mara - Production-Ready Social Image Platform
**Developed by Maim**
*Cybersecurity Enthusiast | Web & App Developer | UI/UX Designer | Software Engineering*

---

## 🌟 Overview

**Gowa Mara** is an image-first social community and hosting platform built with React 19, Tailwind CSS, real Firebase Authentication & Firestore, and ImgBB cloud storage integration.

---

## 🚀 Vercel Deployment Architecture

The application is structured for instant one-click deployment on **Vercel** with full SPA client-side routing and Vercel Serverless Functions.

```
User Browser
     │
     ▼
Vercel Frontend (Vite SPA + Tailwind)
     │
     ├──────────────► Firebase Authentication (Google & Email/Password)
     │
     ├──────────────► Cloud Firestore (Zero-Trust ABAC Security Rules)
     │
     └──────────────► Vercel Serverless Function (`/api/upload`)
                            │ (Private IMGBB_API_KEY)
                            ▼
                         ImgBB Cloud Image Storage
```

### 1. Import Repository into Vercel
1. Push your repository to GitHub.
2. Log in to [Vercel](https://vercel.com/) and click **Add New... > Project**.
3. Select your repository.
4. Framework Preset: **Vite**.
5. Build Command: `npm run build` (default).
6. Output Directory: `dist` (default).

### 2. Configure Environment Variables on Vercel
In your Vercel Project Settings under **Environment Variables**, configure:

| Variable Name | Environment | Description |
|---|---|---|
| `IMGBB_API_KEY` | Production, Preview, Development | Your private ImgBB API key from [api.imgbb.com](https://api.imgbb.com/) |
| `APP_URL` | Production, Preview | The canonical URL of your deployment (e.g. `https://gowa-mara.vercel.app`) |

*Security Guarantee:* The `IMGBB_API_KEY` remains strictly inside Vercel's serverless runtime and is never sent to the browser or bundled into frontend JavaScript.

### 3. SPA Routing Configuration (`vercel.json`)
The project includes `vercel.json` which routes all client paths (`/home`, `/explore`, `/profile`, `/chat`, `/search`, `/p/:postId`, `/admin/*`) to `/index.html` while preserving API routes:
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/api/upload", "destination": "/api/upload.js" },
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 4. Firebase Authorized Domains
To enable Google Sign-In and email authentication on Vercel:
1. Open [Firebase Console](https://console.firebase.google.com/).
2. Navigate to **Authentication > Settings > Authorized domains**.
3. Add your Vercel domains:
   - `<your-project-name>.vercel.app`
   - Your custom domain (e.g., `gowamara.com`)

---

## 🎨 Gowa Mara Brand System

- **Primary Logo**: A custom circular geometric **G** symbol featuring an inner atmospheric glow, glass ring, and inner core highlight.
- **Wordmark**: Clean, modern typography combining the **G** symbol with **owa Mara** for high readability across all screen resolutions.
- **Mobile Header**: `[ ◉ Gowa Mara ]` on the left, and `[ 🔍 Search ] [ 🔔 Notifications ] [ Avatar ]` on the right.
- **Avatar Profile**: Tapping the top header avatar smoothly navigates directly to `/profile`.

---

## 👤 Profile & Avatar Studio

1. **Avatar Upload**: Users can upload their own profile picture (`/profile` -> Edit Profile -> Studio).
2. **Interactive Canvas Studio**: Real-time zoom, 90° rotation, center cropping, and JPEG optimization at 400×400px.
3. **Storage Pipeline**: The avatar is uploaded through `/api/upload` to ImgBB and saved to Firestore under `photoUrl`/`avatarUrl`.
4. **App-wide Sync**: The avatar automatically appears in feed posts, comments, chat messages, friends list, search results, and top header.

---

## 🔒 Publishing Authorization & Security Rules

- **Pending Gate**: Registration starts an account in `status: "pending"`. Only approved creators can publish posts.
- **Admin Approval Center**: Administrators approve, reject, suspend, or block accounts at `/admin/approvals`.
- **Public Share Restrictions**: Posts cannot be shared externally via `/p/:postId` unless explicitly marked `sharingAllowed: true` and `visibility: "public"`.
- **Download Control**: Posts feature a `downloadAllowed` permission toggle. When enabled, viewers can download high-resolution photos with real filename formatting.

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run dev

# Run TypeScript checks
npm run lint

# Build for production
npm run build
```

---

## 📜 Developer Profile & Configuration

Developer settings and the admin picture URL are defined in `src/config/appConfig.ts`:
- **Developer Name**: Maim
- **Bio**: Cybersecurity Enthusiast | Web & App Developer | UI/UX Designer | Software Engineering
- **Admin Picture**: Set via `adminPicUrl`
- **Contact**: WhatsApp & Gmail channels
