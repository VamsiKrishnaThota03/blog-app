# Blog Application

A full-stack blog application built with React, Node.js, Express, and PostgreSQL.

## Features

- User authentication (signup/login)
- Create, read, update, and delete blog posts
- Public blog listing with pagination
- Responsive design for desktop and mobile
- Secure API endpoints
- JWT-based authentication

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
   PORT=5000
   DATABASE_URL=postgresql://username:password@localhost:5432/blog_db
   JWT_SECRET=your_jwt_secret
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
   npm start
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