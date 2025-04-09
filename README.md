# Blog Application

A full-stack blog application built with React, Node.js, Express, and PostgreSQL.

## Features

- **User Authentication**
  - Secure registration and login with email and password
  - JWT-based authentication for protected routes
  - Persistent login state with token storage
  - Protected routes for authenticated users only

- **Blog Management**
  - Create, read, update, and delete blog posts
  - Rich text editing for post content
  - Author attribution for each post
  - Timestamp tracking for post creation and updates

- **User Experience**
  - Responsive design that works on desktop and mobile devices
  - Dark mode support for better viewing in low-light conditions
  - Loading indicators for asynchronous operations
  - Error handling with user-friendly messages

- **Content Display**
  - Public blog listing with pagination
  - Detailed post view with full content
  - Author information display
  - Formatted date display

- **User Dashboard**
  - Personal blog management interface
  - View and manage your own posts
  - Edit and delete your own content
  - Create new posts from your dashboard

- **Security**
  - Secure API endpoints with authentication middleware
  - Password hashing for user accounts
  - Protected routes for sensitive operations
  - Input validation and sanitization

## Tech Stack

- Frontend: React with TypeScript
- Backend: Node.js with Express and TypeScript
- Database: PostgreSQL
- Authentication: JWT
- Styling: Tailwind CSS

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- npm or yarn

## Project Structure

```
blog/
├── client/             # Frontend React application
├── server/             # Backend Node.js application
├── .gitignore
└── README.md
```

## Setup Instructions

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the server directory with the following variables:
   ```
   PORT=4000
   JWT_SECRET=your_jwt_secret
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=blog_db
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

This application is deployed and accessible at: [https://blog-app-seven-ruddy.vercel.app/](https://blog-app-seven-ruddy.vercel.app/)

### Frontend Deployment (Vercel)

1. Create a Vercel account at [vercel.com](https://vercel.com)
2. Connect your GitHub repository to Vercel
3. Configure the build settings:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add environment variables:
   - `VITE_API_URL`: Your backend API URL (e.g., `https://blog-api-rer9.onrender.com/api`)
5. Deploy the application

### Backend Deployment (Render)

1. Create a Render account at [render.com](https://render.com)
2. Connect your GitHub repository to Render
3. Create a new Web Service
4. Configure the build settings:
   - Build Command: `npm run build`
   - Start Command: `npm start`
5. Add environment variables:
   - `PORT`: 4000
   - `JWT_SECRET`: Your JWT secret
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NODE_ENV`: production
6. Deploy the service

### Database Deployment (Neon)

1. Create a Neon account at [neon.tech](https://neon.tech)
2. Create a new project
3. Get your connection string from the dashboard
4. Update your backend's `DATABASE_URL` environment variable with the Neon connection string
5. Initialize the database schema using the provided script:
   ```bash
   npm run init-db
   ```

## API Endpoints

### Authentication
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login user
- GET /api/auth/me - Get current user

### Blog Posts
- GET /api/posts - Get all posts (with pagination)
- GET /api/posts/:id - Get a single post
- POST /api/posts - Create a new post
- PUT /api/posts/:id - Update a post
- DELETE /api/posts/:id - Delete a post

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request