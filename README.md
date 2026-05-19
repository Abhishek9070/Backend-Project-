# MyTube

Short developer guide for the MyTube project (React + Vite frontend, Node/Express + MongoDB backend, Cloudinary for media).

## Quick Summary
- Frontend: React (Vite), React Router, Redux slices for app and auth, API helpers under `frontend/src/api`.
- Backend: Node.js, Express, MongoDB (Mongoose), JWT auth, controllers under `backend/src/controllers`.
- Media: Cloudinary for video/thumbnail storage (direct-to-Cloudinary uploads from frontend).

## Main Features
- Browse and search videos (Home feed)
- Watch a video with comments, likes/dislikes
- Upload videos (direct upload to Cloudinary) with thumbnail and progress
- Edit video metadata (title, description, thumbnail)
- Subscribe/Unsubscribe to channels
- Playlists, history, liked videos, basic dashboard

## Architecture (short)
- Frontend communicates with backend via `/api/v1/*`. Vite dev server proxies `/api/v1` to the backend (see `frontend/vite.config.js`).
- Video media uploads are performed directly from the browser to Cloudinary using an unsigned preset; the frontend then sends metadata (URLs) to the backend for storage.
- Backend stores video records in MongoDB and uses Cloudinary utilities for any server-side media operations (deletes, edits).

## Setup & Run (local)
1. Install dependencies:

```bash
# backend
cd backend
npm install

# frontend
cd ../frontend
npm install
```

2. Environment variables
- Backend: create `backend/.env` with at least:
  - `PORT` (e.g. `8000`)
  - `MONGODB_URL` (MongoDB connection URI)
  - `CLOUDNARY_CLOUD_NAME`, `CLOUDNARY_CLOUD_API_KEY`, `CLOUDNARY_CLOUD_API_SECRET`
  - `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET` (auth secrets)

- Frontend: create `frontend/.env.local` (or `.env`) with:
  - `VITE_API_BASE_URL=/api/v1`
  - `VITE_BACKEND_URL=http://localhost:8000`
  - `VITE_CLOUDINARY_CLOUD_NAME=<your-cloud-name>`
  - `VITE_CLOUDINARY_UPLOAD_PRESET=<your-unsigned-preset>`

3. Start servers (in separate terminals):

```bash
# start backend
cd backend
npm run dev

# start frontend
cd frontend
npm run dev
```

4. Build for production (optional):

```bash
cd frontend
npm run build

cd ../backend
npm run start
```

## Important notes about uploads
- The app uses a direct-to-Cloudinary flow for large videos. You must create an unsigned upload preset in Cloudinary (e.g. `mytube_upload`) and set `VITE_CLOUDINARY_UPLOAD_PRESET` accordingly.
- If you see `Upload preset must be whitelisted for unsigned uploads` or `upload preset not found`: verify preset name and set Signing Mode = `Unsigned` in Cloudinary console.
- Server-side code also contains a passthrough/middleware for legacy uploads, but production flow expects frontend -> Cloudinary -> backend (metadata save).

## Key files and where to start reading (recommended order)
Start with high-level entry points, then dive into controllers and the home controller that drives most UI behavior.

- Backend
  - [backend/src/index.js](backend/src/index.js) — server entry, loads env and starts app
  - [backend/src/app.js](backend/src/app.js) — Express app, middleware, routes, global error handler
  - [backend/src/routes/video.routes.js](backend/src/routes/video.routes.js) — video-related routes (save metadata, edit, delete, watch)
  - [backend/src/controllers/video.controllers.js](backend/src/controllers/video.controllers.js) — video create/save, edit, delete, watch logic
  - [backend/src/utils/cloudinary.js](backend/src/utils/cloudinary.js) — Cloudinary upload helpers (uses upload_large for big files)
  - [backend/src/midllewares/cloudinary.midlewares.js](backend/src/midllewares/cloudinary.midlewares.js) — multer config (used for legacy/thumbnail uploads)
  - [backend/src/models/video.models.js](backend/src/models/video.models.js) — Mongoose schema for Video

- Frontend
  - [frontend/src/main.jsx](frontend/src/main.jsx) — app bootstrap
  - [frontend/src/App.jsx](frontend/src/App.jsx) — top-level wiring, uses `useHomeController`
  - [frontend/src/features/home/useHomeController.js](frontend/src/features/home/useHomeController.js) — central UI/controller logic (feeds, selected video, upload flow, subscriptions)
  - [frontend/src/components/modals/UploadModal.jsx](frontend/src/components/modals/UploadModal.jsx) — upload UI and progress
  - [frontend/src/api/cloudinary.js](frontend/src/api/cloudinary.js) — direct Cloudinary upload helper (XHR progress)
  - [frontend/src/api/videos.js](frontend/src/api/videos.js) — video-related API helpers (now `saveVideoMetadata`)
  - [frontend/src/components/feed/WatchSpotlight.jsx](frontend/src/components/feed/WatchSpotlight.jsx) — video watch UI and actions

## Suggested reading path (detailed, step-by-step)
1. Backend entry and routing: read [backend/src/index.js](backend/src/index.js) then [backend/src/app.js](backend/src/app.js) to understand middleware and routing.
2. Video backend flow: open [backend/src/routes/video.routes.js](backend/src/routes/video.routes.js) and follow to [backend/src/controllers/video.controllers.js](backend/src/controllers/video.controllers.js). Notice the `uploadVideo` handler now expects URLs (metadata-only save).
3. Cloudinary helpers: inspect [backend/src/utils/cloudinary.js](backend/src/utils/cloudinary.js) to see how uploads are handled server-side (upload_large fallback for large files, delete logic).
4. Frontend wiring: inspect [frontend/src/main.jsx](frontend/src/main.jsx) → [frontend/src/App.jsx](frontend/src/App.jsx) → [frontend/src/features/home/useHomeController.js](frontend/src/features/home/useHomeController.js). `useHomeController` orchestrates most interactions — feeds, selected video, upload flow and calls into API helpers.
5. Upload flow specifics: in the frontend, read [frontend/src/components/modals/UploadModal.jsx](frontend/src/components/modals/UploadModal.jsx) and [frontend/src/api/cloudinary.js](frontend/src/api/cloudinary.js). The modal collects files and the cloudinary helper uploads them directly (progress reporting). After receiving `secure_url`, the controller calls `saveVideoMetadata` in [frontend/src/api/videos.js](frontend/src/api/videos.js) to persist metadata.
6. Watch/interaction: check [frontend/src/components/feed/WatchSpotlight.jsx](frontend/src/components/feed/WatchSpotlight.jsx) and `useHomeController`'s comment/like handlers to understand viewer interactions and caching.

## Common debugging tips
- If uploads fail with 400: check Cloudinary preset name and Signed/Unsigned setting.
- If frontend shows 5173 but backend isn't hit: ensure Vite proxy in `frontend/vite.config.js` is configured and the backend is running on `VITE_BACKEND_URL`.
- Check backend console for stack traces (global error handler prints JSON responses). The `uploadVideo` controller includes trace logs for debugging file and Cloudinary responses.
- Large-file uploads: prefer direct-to-Cloudinary; server-side proxying can cause timeouts and disk usage.


