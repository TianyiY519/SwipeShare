# Fordham SwipeShare - Web Preview (Vite)

Fast, modern web preview using Vite instead of Create React App.

## Why Vite?

- **Faster**: Lightning-fast dev server and hot reload
- **No dependency conflicts**: Avoids the ajv/react-scripts issues
- **Modern**: Uses the latest build tools
- **Same features**: Identical UI and functionality

## Quick Start

### 1. Install Dependencies

```bash
cd "d:\Capstone\FordhamSwipeShare\web-preview-vite"
npm install
```

This takes about 30 seconds (much faster than Create React App).

### 2. Make Sure Django is Running

In a separate terminal:

```bash
cd "d:\Capstone\FordhamSwipeShare\backend"
venv\Scripts\activate
python manage.py runserver
```

### 3. Start Vite Dev Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser!

## Features

Same as the original web-preview:

- Login/Registration
- Dashboard with stats
- Real-time API integration
- Mobile-like appearance
- Fordham maroon theme

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Differences from Original

- Uses Vite instead of react-scripts
- Slightly faster hot reload
- No ajv dependency conflicts
- Everything else is identical

## Troubleshooting

### Port already in use

```bash
# Vite will automatically suggest another port
# Or specify one:
PORT=3001 npm run dev
```

### Can't connect to backend

Make sure Django is running on http://localhost:8000

### CORS errors

Already configured in Django `.env`:
```
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

## Tech Stack

- React 18
- TypeScript
- Vite 5
- Axios
- Same Django backend
