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

## Overview

The repository is a two-package monorepo:

- **`client/`** is a Vite + React 19 + TypeScript single-page app styled with Tailwind CSS. Auth state lives in a React context, and the JWT is stored in the browser and sent as a `Bearer` token on API calls (`axios`).
- **`server/`** is an Express + TypeScript REST API. It uses raw SQL through `pg` (node-postgres) against PostgreSQL. Passwords are hashed with `bcryptjs` and requests are authenticated with JWTs.

## Features

- **Authentication:** register with name, email and password, then log in to get a JWT. The `/api/auth/me` endpoint restores the session.
- **Protected routes:** create, edit and "My Blogs" pages require login (`ProtectedRoute`)
- **Posts CRUD:** create, read, update and delete posts. The server only lets the post's author update or delete it.
- **Public feed with pagination:** `GET /api/posts?page=&limit=` returns posts with author name and the page count. The home page renders page buttons.
- **Post detail page** with author and formatted dates
- **My Blogs dashboard:** list, edit and delete your own posts
- **Dark mode:** a toggle whose choice is saved to `localStorage`
- **Responsive UI** built with Tailwind CSS and Headless UI / Heroicons
- **Database scripts:** `init-db` applies `schema.sql`, and `seed` inserts sample posts
- **Health check:** `GET /health`

## Tech stack

| Layer | Tools |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 6, React Router 6, Tailwind CSS 3, Headless UI, Heroicons, axios |
| Backend | Node.js, Express 4, TypeScript, `pg`, `jsonwebtoken`, `bcryptjs`, `cors`, `dotenv` |
| Database | PostgreSQL (Neon in production) |
| Hosting | Vercel (client), Render (server, `Procfile`) |

## Project structure

```
blog-app/
├── client/
│   ├── src/
│   │   ├── pages/          # Home, Login, Register, PostDetail, CreatePost, EditPost, MyBlogs
│   │   ├── components/     # Navbar, ProtectedRoute
│   │   ├── context/        # AuthContext, ThemeContext (dark mode)
│   │   ├── services/       # axios API client, posts service
│   │   └── config.ts       # API base URL (localhost in dev, Render in prod)
│   └── vite.config.ts
└── server/
    ├── schema.sql          # users + posts tables
    ├── Procfile
    └── src/
        ├── index.ts        # Express app, CORS, routes, /health
        ├── config/database.ts  # pg Pool from DATABASE_URL
        ├── controllers/    # authController, postController
        ├── middleware/auth.ts  # JWT verification
        ├── routes/         # auth.ts, posts.ts (mounted)
        └── scripts/        # initDb.ts, seed.ts
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

Create `server/.env`:

| Variable | Description |
| --- | --- |
| `PORT` | API port (default `4000`) |
| `DATABASE_URL` | PostgreSQL connection string. SSL is enabled on the connection, so use a server that accepts SSL, such as Neon. |
| `JWT_SECRET` | Secret used to sign and verify JWTs |
| `NODE_ENV` | `development` or `production` |

```env
PORT=4000
DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require
JWT_SECRET=<a-long-random-secret>
NODE_ENV=development
```

Create the tables, optionally seed sample data, and start the API:

```bash
npm run init-db     # runs schema.sql
npm run seed        # optional: sample posts
npm run dev         # nodemon + ts-node on http://localhost:4000
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

The API base URL is set in `client/src/config.ts`: `http://localhost:4000/api` in development and the Render URL in production builds. The server's CORS allowlist (`server/src/index.ts`) covers `http://localhost:3000` and the Vercel domain. If Vite serves the client on a different port (the default is `5173`), add that origin or run `npm run dev -- --port 3000`.

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

- **Client (Vercel):** framework preset Vite, root `client`, build `npm run build`, output `dist`.
- **Server (Render):** root `server`, build `npm run build`, start `npm start`. Set `DATABASE_URL`, `JWT_SECRET`, `PORT` and `NODE_ENV`.
- **Database (Neon):** create a project, copy the connection string into `DATABASE_URL`, then run `npm run init-db`.
