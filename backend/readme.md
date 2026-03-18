# Project

Full-stack VideoTube project with:

- Node.js + Express backend in `src/`
- React (JavaScript) frontend in `frontend/`

## Backend

### Install

```bash
npm install
```

### Run

```bash
npm run dev
```

Backend runs on `http://localhost:8000`.

### API Base

`/api/v1`

Core modules wired:

- users
- videos
- comments
- likes
- playlists
- subscriptions
- tweets
- dashboard

## Frontend (React + JS)

Frontend code is in `frontend/`.

### Install

```bash
cd frontend
npm install
```

### Environment

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### Run

```bash
cd frontend
npm run dev
```

or from project root:

```bash
npm run frontend:dev
```

Frontend runs on `http://localhost:5173`.

## CORS

Set backend `.env` variable:

```env
CORS_ORIGIN=http://localhost:5173
```

You can also pass multiple origins (comma-separated):

```env
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
```
