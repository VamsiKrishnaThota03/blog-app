# Blog App

A full-stack blogging platform with JWT authentication, post CRUD, pagination and dark mode. It uses React + TypeScript + Tailwind on the frontend and Express + TypeScript + PostgreSQL on the backend.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)

## Live demo

**https://blog-app-seven-ruddy.vercel.app**

The frontend runs on Vercel, the API on Render (`https://blog-api-rer9.onrender.com/api`) and the database on Neon PostgreSQL.

| Home feed | My Blogs (dark mode) | Mobile menu |
| --- | --- | --- |
| ![Home feed](docs/screenshots/home.png) | ![My Blogs in dark mode](docs/screenshots/my-blogs-dark.png) | ![Mobile navigation](docs/screenshots/mobile-menu.png) |

## Overview

The repository is a two-package monorepo:

- **`client/`** is a Vite + React 19 + TypeScript single-page app styled with Tailwind CSS. Auth state lives in a React context, and the JWT is stored in the browser and sent as a `Bearer` token on API calls (`axios`).
- **`server/`** is an Express + TypeScript REST API. It uses raw SQL through `pg` (node-postgres) against PostgreSQL. Passwords are hashed with `bcryptjs` and requests are authenticated with JWTs.

## Features

- **Authentication:** register with name, email and password, then log in to get a JWT. The `/api/auth/me` endpoint restores the session.
- **Protected routes:** create, edit and "My Blogs" pages require login (`ProtectedRoute`)
- **Posts CRUD:** create, read, update and delete posts. The server only lets the post's author update or delete it.
- **Public feed with pagination:** `GET /api/posts?page=&limit=` returns posts with author name and the page count. The home page renders page buttons.
- **Post detail page** with author, date and reading time; Edit/Delete only shown to the author
- **My Blogs dashboard:** list and edit your own posts
- **Dark mode:** follows the system preference until you toggle it; the choice is saved to `localStorage`
- **Responsive UI** built with Tailwind CSS: collapsible mobile menu, loading, empty and error states, 404 page
- **Server-side validation:** required fields, length limits, email format, numeric IDs and a capped page size
- **Database scripts:** `init-db` applies `schema.sql`, and `seed` inserts sample posts
- **Health check:** `GET /health`

## Tech stack

| Layer | Tools |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 6, React Router 6, Tailwind CSS 3, axios |
| Backend | Node.js, Express 4, TypeScript, `pg`, `jsonwebtoken`, `bcryptjs`, `cors`, `dotenv` |
| Database | PostgreSQL (Neon in production) |
| Hosting | Vercel (client), Render (server, `Procfile`) |

## Project structure

```
blog-app/
├── client/
│   ├── src/
│   │   ├── pages/          # Home, Login, Register, PostDetail, CreatePost, EditPost, MyBlogs
│   │   ├── components/     # Navbar, PostCard, PostForm, AuthCard, Alert, Spinner, ProtectedRoute
│   │   ├── context/        # AuthContext, ThemeContext (dark mode)
│   │   ├── services/       # axios API client
│   │   ├── utils/          # date formatting, API error messages
│   │   └── config.ts       # API base URL (VITE_API_URL, /api proxy in dev, Render in prod)
│   ├── vercel.json         # SPA rewrites so deep links work
│   └── vite.config.ts      # dev server on :3000, proxies /api to :4000
└── server/
    ├── schema.sql          # users + posts tables
    ├── Procfile
    └── src/
        ├── index.ts        # Express app, CORS, routes, /health
        ├── config/env.ts       # required env vars (fails fast), CORS origins
        ├── config/database.ts  # pg Pool from DATABASE_URL, TLS settings
        ├── controllers/    # authController, postController
        ├── middleware/auth.ts  # JWT verification
        ├── routes/         # auth.ts, posts.ts
        ├── utils/          # db pool accessor, input validation
        └── scripts/        # initDb.ts, seed.ts
    └── test/               # node:test unit tests (run against dist/)
```

## Getting started

### Prerequisites

- Node.js 18+ and npm
- A PostgreSQL database (local or a hosted provider such as Neon)

### 1. Backend

```bash
cd server
npm install
```

Copy `server/.env.example` to `server/.env` and fill it in. The server refuses to start if `DATABASE_URL` or `JWT_SECRET` is missing; there are no built-in fallback secrets.

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Long random string used to sign JWTs (`openssl rand -hex 32`) |
| `PORT` | No | API port (default `4000`) |
| `CORS_ORIGINS` | No | Comma-separated allowed origins (default: the Vercel domain, `http://localhost:3000`, `http://localhost:5173`) |
| `DB_SSL` | No | Unset: TLS with certificate verification (no TLS for `localhost`). `no-verify`: TLS without verification. `disable`: no TLS. |
| `SEED_USER_EMAIL` | No | Demo account email for `npm run seed` (default `demo@example.com`) |
| `SEED_USER_PASSWORD` | For `seed` | Demo account password; the seed script will not run without it |

Create the tables, optionally seed sample data, and start the API:

```bash
npm run init-db     # applies schema.sql (idempotent)
SEED_USER_PASSWORD=<choose-one> npm run seed   # optional: demo user + sample posts
npm run dev         # nodemon + ts-node on http://localhost:4000
npm test            # compiles and runs the unit tests
```

Production build:

```bash
npm run build       # npm install && tsc -> dist/
npm start           # node dist/index.js
```

### 2. Frontend

```bash
cd client
npm install
npm run dev         # Vite dev server
```

The dev server runs on `http://localhost:3000` and proxies `/api` to `http://localhost:4000` (override with `API_PROXY_TARGET`). Production builds call the Render URL unless `VITE_API_URL` is set at build time (see `client/.env.example`).

| Command (client) | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build into `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

## API

Base path: `/api`. Protected routes need `Authorization: Bearer <token>`.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | - | Register (`name`, `email`, `password`) and return a token and user |
| POST | `/api/auth/login` | - | Log in and return a token and user |
| GET | `/api/auth/me` | Yes | Current user |
| GET | `/api/posts?page=&limit=` | - | Paginated list of posts with author names |
| GET | `/api/posts/:id` | - | Single post |
| POST | `/api/posts` | Yes | Create a post (`title`, `content`) |
| PUT | `/api/posts/:id` | Yes (author) | Update your own post |
| DELETE | `/api/posts/:id` | Yes (author) | Delete your own post |
| GET | `/api/posts/user/me` | Yes | Posts by the current user |
| GET | `/health` | - | Health check |

## Deployment notes

- **Client (Vercel):** framework preset Vite, root `client`, build `npm run build`, output `dist`. `client/vercel.json` rewrites all paths to `index.html` so refreshing `/post/:id` works. Optionally set `VITE_API_URL`.
- **Server (Render):** root `server`, build `npm run build`, start `npm start`. Set `DATABASE_URL` and `JWT_SECRET` (and optionally `CORS_ORIGINS`, `DB_SSL`). The committed `server/.env.production` was removed from the repo, so these must be set in the Render dashboard.
- **Database (Neon):** create a project, copy the connection string into `DATABASE_URL`, then run `npm run init-db`.

## Known limitations

- Post content is plain text (paragraphs split on new lines); there is no rich text or Markdown rendering.
- The JWT is kept in `localStorage`, so an XSS bug would expose it. React escapes rendered content, which keeps the risk low.
- There is no rate limiting on the login and register endpoints.
- Server tests cover validation and configuration helpers only; the routes were smoke-tested against an in-memory Postgres, not a CI database.
