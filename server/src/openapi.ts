/**
 * Hand-maintained OpenAPI 3.0 description of the public API surface.
 *
 * Kept in TypeScript (rather than a YAML file) so the route list is covered by
 * `tsc` and so the contract test in `test/openapi.test.js` can assert that every
 * Express route is documented here.
 */
export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Blog App API',
    version: '1.0.0',
    description:
      'REST API for the blog platform. Reads of the public feed are anonymous; ' +
      'creating, editing and deleting posts requires a bearer token and is ' +
      'restricted to the post author.',
    license: { name: 'MIT', url: 'https://opensource.org/licenses/MIT' },
  },
  servers: [
    { url: 'https://blog-api-rer9.onrender.com', description: 'production' },
    { url: 'http://localhost:4000', description: 'local development' },
  ],
  tags: [
    { name: 'auth', description: 'Registration, login and the current user' },
    { name: 'posts', description: 'Blog post feed and authoring' },
    { name: 'ops', description: 'Health and readiness probes' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: { message: { type: 'string' } },
        required: ['message'],
      },
      AuthResponse: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          token: { type: 'string', description: 'JWT, valid for 1 day' },
        },
        required: ['id', 'name', 'email', 'token'],
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
        },
        required: ['id'],
      },
      Post: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          title: { type: 'string', maxLength: 255 },
          content: { type: 'string', maxLength: 50000 },
          user_id: { type: 'integer' },
          author_name: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'title', 'content'],
      },
      PostInput: {
        type: 'object',
        properties: {
          title: { type: 'string', maxLength: 255 },
          content: { type: 'string', maxLength: 50000 },
        },
        required: ['title', 'content'],
      },
      PostPage: {
        type: 'object',
        properties: {
          posts: { type: 'array', items: { $ref: '#/components/schemas/Post' } },
          currentPage: { type: 'integer' },
          totalPages: { type: 'integer' },
          totalPosts: { type: 'integer' },
        },
        required: ['posts', 'currentPage', 'totalPages', 'totalPosts'],
      },
    },
    responses: {
      Unauthorized: {
        description: 'Missing or invalid bearer token',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      BadRequest: {
        description: 'Validation failed',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      NotFound: {
        description: 'Post does not exist, or is not owned by the caller',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      TooManyRequests: {
        description: 'Rate limit exceeded',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['ops'],
        summary: 'Liveness probe',
        description: 'Returns 200 as soon as the process is accepting connections.',
        responses: {
          200: {
            description: 'Process is alive',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { status: { type: 'string', example: 'ok' } },
                },
              },
            },
          },
        },
      },
    },
    '/health/ready': {
      get: {
        tags: ['ops'],
        summary: 'Readiness probe',
        description: 'Returns 200 only when the database answers a trivial query.',
        responses: {
          200: { description: 'Database reachable' },
          503: { description: 'Database unreachable' },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['auth'],
        summary: 'Create an account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', maxLength: 255 },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6, maxLength: 72 },
                },
                required: ['name', 'email', 'password'],
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Account created',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          429: { $ref: '#/components/responses/TooManyRequests' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['auth'],
        summary: 'Exchange credentials for a JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
                required: ['email', 'password'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Authenticated',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } },
            },
          },
          400: {
            description: 'Invalid credentials (deliberately not distinguished from a bad body)',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          429: { $ref: '#/components/responses/TooManyRequests' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['auth'],
        summary: 'The authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Current user',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/posts': {
      get: {
        tags: ['posts'],
        summary: 'Public, paginated post feed',
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
          },
        ],
        responses: {
          200: {
            description: 'A page of posts, newest first',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PostPage' } } },
          },
        },
      },
      post: {
        tags: ['posts'],
        summary: 'Publish a post',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/PostInput' } },
          },
        },
        responses: {
          201: {
            description: 'Post created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Post' } } },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          429: { $ref: '#/components/responses/TooManyRequests' },
        },
      },
    },
    '/api/posts/{id}': {
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } },
      ],
      get: {
        tags: ['posts'],
        summary: 'Read a single post',
        responses: {
          200: {
            description: 'The post',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Post' } } },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['posts'],
        summary: 'Edit a post you authored',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/PostInput' } },
          },
        },
        responses: {
          200: {
            description: 'Updated post',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Post' } } },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['posts'],
        summary: 'Delete a post you authored',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Deleted',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/posts/user/me': {
      get: {
        tags: ['posts'],
        summary: "The authenticated user's own posts",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Posts authored by the caller, newest first',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Post' } },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
  },
} as const;

export default openApiDocument;
