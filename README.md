# Team Task Manager

Full-stack team task manager: **React + Vite + Tailwind** frontend, **Express + MongoDB (Mongoose)** backend, **JWT + bcrypt** authentication, **admin** and **member** roles.

## Repository layout

- [backend/](backend/) — REST API (`/api/...`)
- [frontend/](frontend/) — SPA

## Local development

### Prerequisites

- Node.js 20+
- MongoDB Atlas URI (or local MongoDB)

### Backend

1. Copy [backend/.env.example](backend/.env.example) to `backend/.env` and set:

   - `MONGODB_URI` — MongoDB connection string  
   - `JWT_SECRET` — long random string  
   - `PORT` — optional, default `5000`  
   - `FRONTEND_URL` — e.g. `http://localhost:5173`

2. Install and run:

```bash
cd backend
npm install
npm run seed
npm run dev
```

`npm run seed` creates demo users (skipped if they already exist):

| Role   | Email             | Password   |
|--------|-------------------|------------|
| Admin  | admin@example.com | admin123   |
| Member | member@example.com| member123  |

Override with `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_MEMBER_EMAIL`, `SEED_MEMBER_PASSWORD` in `.env` if needed.

### Frontend

1. Copy [frontend/.env.example](frontend/.env.example) to `frontend/.env` and set `VITE_API_URL` to your API base (no trailing slash), e.g. `http://localhost:5000`.

2. Install and run:

```bash
cd frontend
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## API overview

| Area        | Method | Path                         | Notes                                      |
|------------|--------|------------------------------|--------------------------------------------|
| Auth       | POST   | `/api/auth/signup`           | First user may request `role: "admin"` once |
| Auth       | POST   | `/api/auth/login`            |                                            |
| Auth       | GET    | `/api/auth/me`               | Bearer JWT                                 |
| Projects   | *      | `/api/projects`              | Create/update/delete: admin only           |
| Projects   | POST   | `/api/projects/:id/members`  | Body: `{ email, action: "add"\|"remove" }` |
| Tasks      | *      | `/api/tasks`                 | Create/delete: admin; members see/update own |
| Dashboard  | GET    | `/api/dashboard/summary`     | Role-scoped counts + overdue               |

Health check: `GET /api/health`

## Deployment

### MongoDB Atlas

Create a cluster, database user, and set **Network Access** to allow your host (e.g. `0.0.0.0/0` for Render).

### Backend (Render)

- **Root directory:** `backend`  
- **Build command:** `npm install`  
- **Start command:** `npm start`  
- **Environment:** `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV=production`, `FRONTEND_URL` (your Vercel site URL)

### Frontend (Vercel)

- **Root directory:** `frontend`  
- **Build command:** `npm run build`  
- **Output:** `dist`  
- **Environment:** `VITE_API_URL` = your Render API origin (e.g. `https://your-api.onrender.com`)

After deployment, replace placeholder links below with your live URLs.

## Live links (fill in after deploy)

- **Frontend:** `https://YOUR_VERCEL_APP.vercel.app`
- **Backend API:** `https://YOUR_SERVICE.onrender.com`

## Screenshots

Add PNG/JPEG screenshots of login, admin dashboard, and member task flow under [screenshots/](screenshots/) for your submission.

## Role behavior

- **Admin:** create projects, manage members, create/update/delete tasks in owned projects, dashboard across those projects.  
- **Member:** view projects they belong to, view tasks assigned to them, update **status only** on assigned tasks.

## Submission checklist

- [ ] GitHub repository  
- [ ] Live frontend (Vercel)  
- [ ] Live backend (Render)  
- [ ] This README updated with links and screenshots  
- [ ] Demo admin and member credentials documented (see seed table above)  
- [ ] Atlas connected and RBAC verified  
