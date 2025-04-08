import pool from '../config/database';
import bcryptjs from 'bcryptjs';
import { initializeDatabase } from '../config/database';

const dummyPosts = [
  {
    title: "Getting Started with TypeScript",
    content: `TypeScript is a powerful superset of JavaScript that adds static typing to the language. In this post, we'll explore the basics of TypeScript and why you might want to use it in your next project.

TypeScript offers several benefits:
- Static typing
- Better IDE support
- Enhanced code maintainability
- Reduced runtime errors

Let's dive into some code examples and best practices for using TypeScript in your applications.`,
  },
  {
    title: "The Art of Writing Clean Code",
    content: `Clean code is not just about making your code work; it's about making it work elegantly and efficiently. Here are some principles to follow:

1. Keep functions small and focused
2. Use meaningful variable names
3. Follow the DRY (Don't Repeat Yourself) principle
4. Write self-documenting code
5. Maintain consistent formatting

Remember, code is read more often than it is written. Make it easy for others (and your future self) to understand.`,
  },
  {
    title: "Modern Web Development with React",
    content: `React has revolutionized the way we build web applications. Its component-based architecture and virtual DOM make it an excellent choice for modern web development.

Key concepts in React:
- Components and Props
- State Management
- Hooks
- Context API
- Performance Optimization

We'll explore these concepts and show you how to build scalable applications with React.`,
  },
  {
    title: "Building RESTful APIs with Node.js",
    content: `Node.js is a powerful platform for building scalable backend services. In this guide, we'll walk through creating a RESTful API using Node.js and Express.

Topics covered:
- Setting up Express
- Implementing CRUD operations
- Authentication and Authorization
- Error handling
- API documentation

Follow along as we build a production-ready API from scratch.`,
  },
  {
    title: "Database Design Best Practices",
    content: `A well-designed database is crucial for any application. Here are some best practices to follow:

1. Normalize your data
2. Use appropriate data types
3. Create proper indexes
4. Implement constraints
5. Plan for scalability

We'll discuss these concepts in detail and show real-world examples of good database design.`,
  },
  {
    title: "Introduction to Docker",
    content: `Docker has changed the way we deploy and manage applications. This post introduces Docker concepts and best practices.

Learn about:
- Containers vs VMs
- Dockerfile basics
- Docker Compose
- Container orchestration
- Development workflows

Start your journey into containerization with practical examples and tips.`,
  },
  {
    title: "Mastering Git Version Control",
    content: `Git is essential for modern software development. Here's a comprehensive guide to using Git effectively:

Key topics:
- Branching strategies
- Commit message conventions
- Resolving conflicts
- Git workflows
- Advanced Git commands

Learn how to manage your code like a pro with Git.`,
  },
  {
    title: "Web Security Fundamentals",
    content: `Security should be a top priority in web development. This post covers essential security concepts and common vulnerabilities:

Topics include:
- XSS prevention
- CSRF protection
- SQL injection
- Authentication best practices
- HTTPS and TLS

Protect your applications by understanding and implementing these security measures.`,
  }
];

async function seed() {
  try {
    // Initialize the database and get a pool
    const dbPool = await initializeDatabase();
    
    if (!dbPool) {
      throw new Error('Failed to initialize database pool');
    }
    
    // Create a default user for the dummy posts
    const hashedPassword = await bcryptjs.hash('admin123', 10);
    const userResult = await dbPool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id',
      ['Admin User', 'admin@example.com', hashedPassword]
    );
    const userId = userResult.rows[0].id;

    // Insert dummy posts
    for (const post of dummyPosts) {
      await dbPool.query(
        'INSERT INTO posts (title, content, user_id) VALUES ($1, $2, $3)',
        [post.title, post.content, userId]
      );
    }

    console.log('Seed data inserted successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seed(); 