# Rababa Games - Examiner Setup

This project includes:
- Public site (React + Vite) from project root
- Admin API server (Express + MongoDB) in Server/
- Admin dashboard (React + Vite) in dashboard/

## Clean Project Structure
- Root main site app: src/, index.html, public/
- Root archived legacy static site: archive/legacy-static/
- Backend API: Server/
- Admin dashboard: dashboard/

Legacy static HTML/CSS/JS/PHP structure was moved into archive/legacy-static/ so the active root stays clean and React-first.

## Access URLs
- Public website: http://localhost:5173
- Dashboard: http://localhost:5174
- API health: http://localhost:5000/api/health

## Admin Credentials (Examiner)
- Email: admin@rababagames.com
- Username: RababaAdmin
- Password: RababaExam@2026

## One-time Setup
1. Install root deps
- npm install

2. Install server deps
- cd Server
- npm install

3. Install dashboard deps
- cd ../dashboard
- npm install

## Initialize / Reset Admin Account
From Server/ run:
- npm run seed

If you need to force-reset the super admin to env credentials,
set FORCE_ADMIN_RESET=true in Server/.env, run npm run seed, then set it back to false.

## Run The Full Project
Open 3 terminals:

1. Start API server
- cd Server
- npm run dev

2. Start public website
- cd ..
- npm run dev:site

3. Start dashboard
- cd dashboard
- npm run dev

## Deploy Frontend (Customer Preview)

### Option A: Vercel (Recommended)
1. Install dependencies and build once locally (optional check)
- npm install
- npm run build

2. Deploy with Vercel CLI
- npm i -g vercel
- vercel --prod

3. Set project root to this folder when prompted:
- Rababa Games/

The root `vercel.json` already includes SPA fallback with filesystem priority,
so React routes work and legacy pages under `/site/*` still load correctly.

### Option B: Netlify
1. Connect this repository/folder in Netlify
2. Build command:
- npm run build
3. Publish directory:
- dist

The root `netlify.toml` is already configured for SPA fallback.

## Environment Notes
Server config is in Server/.env:
- MONGODB_URI points to the Rababa-Games database in your existing cluster.
- FRONTEND_URL and DASHBOARD_URL are used by CORS.
- ADMIN_PASSWORD_HASH is used for secure seeded credentials.
- Contact form submits to /api/contact and is always stored in MongoDB.
- SMTP settings are optional; if configured, each contact submission is also sent to your email inbox.

Dashboard config is in dashboard/.env:
- VITE_API_BASE_URL=http://localhost:5000

## Security Notes (Exam Mode)
- Admin write routes are protected by JWT auth.
- Login route has rate limiting.
- Helmet, mongo sanitize, and HPP are enabled.
- Change JWT_SECRET and admin password before production release.
