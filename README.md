# 📝 Blog API

A RESTful API for a personal blogging platform with full CRUD operations, search, and JWT authentication.

Built with **TypeScript 5**, **Express 5**, **SQLite** via **TypeORM**, validated by **Zod** — managed by **pnpm**.

---

## Table of Contents

- [📝 Blog API](#-blog-api)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Project Structure](#project-structure)
  - [Requirements](#requirements)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [API Reference](#api-reference)
    - [Register](#register)
    - [Login](#login)
    - [Refresh Token](#refresh-token)
    - [Logout](#logout)
    - [Get Current User](#get-current-user)
    - [Get All Posts](#get-all-posts)
    - [Get Post by ID](#get-post-by-id)
    - [Create Post](#create-post)
    - [Update Post](#update-post)
    - [Delete Post](#delete-post)
  - [Data Model](#data-model)
  - [Architecture \& Design](#architecture--design)
  - [TypeScript Design](#typescript-design)
    - [Generic Base Classes](#generic-base-classes)
    - [Generic Interfaces](#generic-interfaces)
    - [Interface vs Abstract Class](#interface-vs-abstract-class)
    - [`createApp(routes: RouteConfig[])` factory](#createapproutes-routeconfig-factory)
  - [Authentication](#authentication)
    - [Token types](#token-types)
    - [How it works](#how-it-works)
    - [`src/types/express.d.ts` — global type augmentation](#srctypesexpressdts--global-type-augmentation)
    - [`src/configs/passport.ts`](#srcconfigspassportts)
  - [Role-based Authorization](#role-based-authorization)
    - [Roles](#roles)
    - [How it works](#how-it-works-1)
    - [`src/middlewares/authorize.ts`](#srcmiddlewaresauthorizets)
    - [Promoting a user to admin](#promoting-a-user-to-admin)
    - [`src/constants/role.ts`](#srcconstantsrolets)
  - [Rate Limiting](#rate-limiting)
  - [Idempotency](#idempotency)
    - [How it works](#how-it-works-2)
    - [Usage](#usage)
    - [Rules](#rules)
    - [Cleanup](#cleanup)
  - [Error Handling](#error-handling)
  - [Code Quality](#code-quality)
  - [Commit Convention](#commit-convention)

---

## Features

| Endpoint                | Method   | Auth      | Role    | Description                              |
| ----------------------- | -------- | --------- | ------- | ---------------------------------------- |
| `/api/v1/auth/register` | `POST`   | —         | —       | Register a new user                      |
| `/api/v1/auth/login`    | `POST`   | —         | —       | Login and receive tokens                 |
| `/api/v1/auth/refresh`  | `POST`   | —         | —       | Get a new access token                   |
| `/api/v1/auth/logout`   | `POST`   | ✅ Bearer | any     | Logout and invalidate refresh token      |
| `/api/v1/users/me`      | `GET`    | ✅ Bearer | any     | Get current authenticated user profile   |
| `/api/v1/posts`         | `GET`    | ✅ Bearer | any     | Get all posts (supports `?term=` search) |
| `/api/v1/posts/:id`     | `GET`    | ✅ Bearer | any     | Get a single post by ID                  |
| `/api/v1/posts`         | `POST`   | ✅ Bearer | `admin` | Create a new post (supports idempotency) |
| `/api/v1/posts/:id`     | `PUT`    | ✅ Bearer | `admin` | Update an existing post                  |
| `/api/v1/posts/:id`     | `DELETE` | ✅ Bearer | `admin` | Delete a post                            |

---

## Project Structure

```text
blog-api/
├── src/
│   ├── configs/
│   │   └── passport.ts         # Passport JwtStrategy configuration
│   ├── constants/
│   │   ├── idempotency.ts      # TTL, header name, UUID regex constants
│   │   ├── jwt.ts              # Token secrets and expiry constants
│   │   ├── messages.ts         # Shared error/success message strings
│   │   ├── user.ts             # Role const object: admin | user
│   │   ├── route.ts            # Base route path constants (API_PREFIX)
│   │   └── status-code.ts      # HTTP status code constants
│   ├── controllers/
│   │   ├── auth.ts             # AuthController — register, login, refresh, logout
│   │   ├── post.ts             # PostController — HTTP in/out only
│   │   └── user.ts             # UserController — getMe
│   ├── database/
│   │   └── connection.ts       # TypeORM DataSource init & close
│   ├── entity/
│   │   ├── idempotency.ts      # IdempotencyKeyEntity — TypeORM entity
│   │   ├── post.ts             # PostEntity — TypeORM entity
│   │   └── user.ts             # UserEntity — TypeORM entity (includes role)
│   ├── middlewares/
│   │   ├── auth.ts             # authMiddleware — passport.authenticate('jwt'), authorize(...roles) — role-based access control
│   │   ├── error-handler.ts    # Global error handler + 404 handler
│   │   ├── idempotency.ts      # Idempotency middleware + purgeExpiredKeys
│   │   ├── rate-limit.ts       # globalLimiter + writeLimiter
│   │   └── request-logger.ts   # Per-request logging (method, URL, status, ms)
│   ├── migration/              # TypeORM migration files (production)
│   ├── repositories/
│   │   ├── base.ts             # Abstract BaseRepository<E, T, C, U>
│   │   ├── post.ts             # PostRepository — wraps TypeORM Repository<PostEntity>
│   │   └── user.ts             # UserRepository — wraps TypeORM Repository<UserEntity>
│   ├── routes/
│   │   ├── auth.ts             # createAuthRoutes(controller) factory
│   │   ├── post.ts             # createPostRoutes(controller, idempotencyRepo) factory
│   │   └── user.ts             # createUserRoutes(controller) factory
│   ├── schemas/
│   │   ├── auth.ts             # Zod schemas: registerSchema, loginSchema, refreshTokenSchema
│   │   └── post.ts             # Zod schemas: createPostSchema, updatePostSchema
│   ├── services/
│   │   ├── auth.ts             # AuthService — register, login, refresh, logout logic
│   │   ├── base.ts             # Abstract BaseService<T, C, U>
│   │   ├── post.ts             # PostService — business logic for posts
│   │   └── user.ts             # UserService — getMe
│   ├── types/
│   │   ├── api.ts              # ApiSuccessResponse, ApiErrorResponse, ApiResponse<T>
│   │   ├── auth.ts             # JwtPayload (with role), User, IUserRepository
│   │   ├── common.ts           # IRepository<T,C,U>, IService<T,C,U> generics (async)
│   │   ├── express.d.ts        # Global Express.User augmentation (req.user typing)
│   │   └── post.ts             # Post, IPostRepository, IPostService
│   ├── utils/
│   │   ├── app-error.ts        # AppError class with static factory methods
│   │   ├── jwt.ts              # generateAccessToken, generateRefreshToken, verify helpers
│   │   ├── response.ts         # sendSuccess / sendError helpers
│   │   └── zod.ts              # Zod error → field error map converter
│   ├── app.ts                  # Express app factory: createApp(routes)
│   └── server.ts               # Composition root — wires all dependencies
├── data/
│   └── blog.db                 # Auto-created SQLite file (gitignored)
├── dist/                       # Compiled output (generated by pnpm build)
├── .editorconfig
├── .env
├── .env.example
├── .gitignore
├── .husky/
│   ├── pre-commit              # Runs lint + format check
│   └── commit-msg              # Runs commitlint
├── .prettierrc
├── commitlint.config.js
├── eslint.config.js
├── nodemon.json
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── README.md
└── tsconfig.json
```

---

## Requirements

| Tool       | Version               |
| ---------- | --------------------- |
| Node.js    | ≥ 20.0.0              |
| pnpm       | ≥ 8.0.0               |
| TypeScript | ≥ 5.9 (devDependency) |

---

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd nodejs-training

# Checkout to blogging-platform-api branch
git checkout blogging-platform-api

# Install dependencies
pnpm install

# Copy environment config
cp .env.example .env

# Start development server (hot reload)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

> `data/blog.db` is created automatically on first run. TypeORM `synchronize: true` creates all tables from entities in development.

---

## Environment Variables

| Variable             | Default          | Description                                 |
| -------------------- | ---------------- | ------------------------------------------- |
| `PORT`               | `3000`           | Server port                                 |
| `NODE_ENV`           | `development`    | Environment (`development` \| `production`) |
| `DB_PATH`            | `./data/blog.db` | Path to the SQLite database file            |
| `JWT_ACCESS_SECRET`  | `access_secret`  | Secret key for signing access tokens        |
| `JWT_REFRESH_SECRET` | `refresh_secret` | Secret key for signing refresh tokens       |

> ⚠️ Always set strong secrets for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` in production.

> In production, set `NODE_ENV=production` — this disables `synchronize` and requires explicit migrations from `src/migration/`.

---

## API Reference

All routes are prefixed with `/api/v1`.

### Register

```
POST /api/v1/auth/register
Content-Type: application/json
```

**Request body:**

```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

| Field      | Type     | Rules                          |
| ---------- | -------- | ------------------------------ |
| `email`    | `string` | Required, valid email format   |
| `password` | `string` | Required, min 6, max 100 chars |

**Response `201`:**

```json
{
  "success": true,
  "data": { "id": 1, "email": "user@example.com", "role": "user" }
}
```

> All self-registered users receive the `user` role by default. Promote to `admin` via DB — never through the API.

---

### Login

```
POST /api/v1/auth/login
Content-Type: application/json
```

**Request body:**

```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>"
  }
}
```

---

### Refresh Token

```
POST /api/v1/auth/refresh
Content-Type: application/json
```

**Request body:**

```json
{ "refreshToken": "<jwt>" }
```

**Response `200`:**

```json
{
  "success": true,
  "data": { "accessToken": "<jwt>" }
}
```

---

### Logout

```
POST /api/v1/auth/logout
Authorization: Bearer <accessToken>
```

**Response `204`:** no content — refresh token is invalidated in DB.

---

### Get Current User

```
GET /api/v1/users/me
Authorization: Bearer <accessToken>
```

Returns the profile of the currently authenticated user. Available to all authenticated users regardless of role.

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "role": "user"
  }
}
```

**Response `401`:** missing or invalid token.

---

### Get All Posts

```
GET /api/v1/posts
GET /api/v1/posts?term=tech
```

Wildcard search on `title`, `content`, and `category` (case-insensitive). Omit `term` to return all posts.

**Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "My First Blog Post",
      "content": "This is the content of my first blog post.",
      "category": "Technology",
      "tags": ["Tech", "Programming"],
      "createdAt": "2021-09-01T12:00:00.000Z",
      "updatedAt": "2021-09-01T12:00:00.000Z"
    }
  ]
}
```

---

### Get Post by ID

```
GET /api/v1/posts/:id
```

**Response `200`:** single post object (same shape as above)

**Response `404`:**

```json
{
  "success": false,
  "status": "error",
  "message": "Post not found"
}
```

---

### Create Post

```
POST /api/v1/posts
Authorization: Bearer <accessToken>   (admin only)
Content-Type: application/json
```

**Request body:**

```json
{
  "title": "My First Blog Post",
  "content": "This is the content of my first blog post.",
  "category": "Technology",
  "tags": ["Tech", "Programming"]
}
```

| Field      | Type       | Rules                              |
| ---------- | ---------- | ---------------------------------- |
| `title`    | `string`   | Required, non-empty, max 255 chars |
| `content`  | `string`   | Required, non-empty                |
| `category` | `string`   | Required, non-empty, max 100 chars |
| `tags`     | `string[]` | Required, min 1 item               |

**Response `201`:** created post object
**Response `400`:** validation errors
**Response `401`:** missing or invalid token
**Response `403`:** authenticated but not admin

> `POST /api/v1/posts` supports the `Idempotency-Key` header — see [Idempotency](#idempotency).

---

### Update Post

```
PUT /api/v1/posts/:id
Authorization: Bearer <accessToken>   (admin only)
Content-Type: application/json
```

Request body — same shape as create. All fields required.

**Response `200`:** updated post object
**Response `400`:** validation errors
**Response `401`:** missing or invalid token
**Response `403`:** authenticated but not admin
**Response `404`:** post not found

---

### Delete Post

```
DELETE /api/v1/posts/:id
Authorization: Bearer <accessToken>   (admin only)
```

**Response `204`:** no content
**Response `401`:** missing or invalid token
**Response `403`:** authenticated but not admin
**Response `404`:** post not found

---

## Data Model

Tables are managed by **TypeORM entities** in `src/entity/`. In development, `synchronize: true` auto-creates and alters tables on startup. In production, run migrations from `src/migration/`.

**`users` table — via `UserEntity`:**

```typescript
@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'text', unique: true }) email: string;
  @Column({ type: 'text' }) password: string; // bcrypt hash
  @Column({ type: 'text', default: Role.USER }) role: Role; // 'admin' | 'user'
  @Column({ name: 'refresh_token', nullable: true }) refreshToken:
    | string
    | null;
}
```

**`posts` table — via `PostEntity`:**

```typescript
@Entity('posts')
export class PostEntity {
  @PrimaryGeneratedColumn()                       id: number;
  @Column({ type: 'text' })                       title: string;
  @Column({ type: 'text' })                       content: string;
  @Column({ type: 'text' })                       category: string;
  @Column({ type: 'text', transformer: { ... } }) tags: string[];  // stored as JSON
  @CreateDateColumn()                             createdAt: Date;
  @UpdateDateColumn()                             updatedAt: Date;
}
```

**`idempotency_keys` table — via `IdempotencyKeyEntity`:**

```typescript
@Entity('idempotency_keys')
export class IdempotencyKeyEntity {
  @PrimaryColumn({ type: 'text' }) key: string; // UUID
  @Column({ type: 'integer' }) statusCode: number;
  @Column({ type: 'text' }) response: string; // JSON-serialised body
  @Column({ type: 'integer' }) createdAt: number; // Unix ms timestamp
}
```

**Domain entity shape (`Post`):**

| Field       | Type       | Notes                                        |
| ----------- | ---------- | -------------------------------------------- |
| `id`        | `number`   | Auto-incremented; readonly after creation    |
| `title`     | `string`   |                                              |
| `content`   | `string`   |                                              |
| `category`  | `string`   |                                              |
| `tags`      | `string[]` | Serialised as JSON in SQLite, parsed on read |
| `createdAt` | `string`   | ISO 8601; set on insert, never updated       |
| `updatedAt` | `string`   | ISO 8601; refreshed on every mutation        |

---

## Architecture & Design

The project follows a strict **3-layer architecture** with **manual dependency injection**:

```
HTTP Request
     ↓
 Controller    parse request, validate input, delegate to service, send response
     ↓
  Service      business logic, not-found guards, orchestration
     ↓
 Repository    TypeORM queries, entity → domain mapping
     ↓
  SQLite DB (via TypeORM DataSource)
```

**Dependency flow — `server.ts` is the only file that calls `new`:**

```
server.ts  (composition root)
    │
    ├── initializeDb()                                → DataSource
    │
    ├── dataSource.getRepository(UserEntity)          → Repository<UserEntity>
    ├── new UserRepository(userTypeOrmRepo)            → IUserRepository
    ├── new AuthService(userRepository)               → AuthService
    ├── new AuthController(authService)               → AuthController
    ├── createAuthRoutes(authController)              → Router
    ├── new UserService(userRepository)               → UserService
    ├── new UserController(userService)               → UserController
    ├── createUserRoutes(userController)              → Router
    │
    ├── dataSource.getRepository(PostEntity)          → Repository<PostEntity>
    ├── new PostRepository(postTypeOrmRepo)            → IPostRepository
    ├── new PostService(postRepository)               → IPostService
    ├── new PostController(postService)               → PostController
    ├── createPostRoutes(controller, idempotencyRepo) → Router
    │
    ├── configurePassport(userRepository)             → registers JwtStrategy
    │
    └── createApp([{ path, router }, ...])            → Express app
```

---

## TypeScript Design

### Generic Base Classes

**`BaseRepository<E, T, C, U>`** — wraps TypeORM `Repository<E>`, provides `findById` and `delete` for free:

```typescript
// PostRepository only needs to implement:
//   toDomain(entity: PostEntity): Post
//   findAll(term?), create(input), update(id, input)
//
// findById and delete are inherited — no SQL written twice

class PostRepository
  extends BaseRepository<PostEntity, Post, CreatePostSchema, UpdatePostSchema>
  implements IPostRepository {
    protected toDomain(entity: PostEntity): Post { ... }
    async findAll(term?: string): Promise<Post[]> { ... }
    async create(input: CreatePostSchema): Promise<Post> { ... }
    async update(id: number, input: UpdatePostSchema): Promise<Post | undefined> { ... }
  }
```

**`BaseService<T, C, U>`** — `getById` and `delete` with built-in 404 handling:

```typescript
// PostService only needs to implement:
//   getAll, create, update
//   get resourceName(): string  ← drives "Post not found" messages

class PostService
  extends BaseService<Post, CreatePostSchema, UpdatePostSchema>
  implements IPostService {
    protected readonly resourceName = 'Post';
    async getAll(term?: string): Promise<Post[]> { ... }
    async create(input: CreatePostSchema): Promise<Post> { ... }
    async update(id: number, input: UpdatePostSchema): Promise<Post> { ... }
  }
```

### Generic Interfaces

All type contracts live in `src/types/common.ts`. All methods are `async` — TypeORM operations return Promises:

| Interface               | Definition                                      | Purpose                              |
| ----------------------- | ----------------------------------------------- | ------------------------------------ |
| `IRepository<T, C, U>`  | `findAll / findById / create / update / delete` | Contract every repository implements |
| `IService<T, C, U>`     | `getAll / getById / create / update / delete`   | Contract every service implements    |
| `ApiSuccessResponse<T>` | `{ success: true; data: T }`                    | Typed success envelope               |
| `ApiErrorResponse`      | `{ success: false; status; message; errors? }`  | Typed error envelope                 |
| `ApiResponse<T>`        | `ApiSuccessResponse<T> \| ApiErrorResponse`     | Union for any response               |

### Interface vs Abstract Class

| Used for                                                              | Why                                                                                                     |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `IPostRepository`, `IPostService`, `IUserRepository` — **interfaces** | Contract only — controller/service depend on abstractions, not concrete classes                         |
| `BaseRepository`, `BaseService` — **abstract classes**                | Share real async implementation (`findById`, `delete`, `getById`, not-found guard) across all resources |

### `createApp(routes: RouteConfig[])` factory

`app.ts` accepts an array of `{ path, router }` pairs and never imports any resource directly:

```typescript
createApp([
  { path: '/api/v1/auth', router: createAuthRoutes(authController) },
  { path: '/api/v1/users', router: createUserRoutes(userController) },
  {
    path: '/api/v1/posts',
    router: createPostRoutes(postController, idempotencyRepo)
  }
]);
```

---

## Authentication

The API uses **stateless JWT authentication** via [Passport.js](https://www.passportjs.org/) with the `passport-jwt` strategy.

### Token types

| Token          | Expiry | Purpose                                                    |
| -------------- | ------ | ---------------------------------------------------------- |
| `accessToken`  | 15 min | Sent as `Authorization: Bearer` on every protected request |
| `refreshToken` | 7 days | Stored in DB — used to issue new access tokens             |

### How it works

```
Login → accessToken (15m) + refreshToken (7d) stored in DB
           │
           ├── Protected request → Authorization: Bearer <accessToken>
           │        ↓
           │   passport-jwt extracts + verifies token
           │        ↓
           │   JwtStrategy fetches user from DB (account still exists?)
           │        ↓
           │   req.user = { userId, email, role }
           │
           ├── Access token expired → POST /auth/refresh
           │        ↓
           │   verify refreshToken signature
           │        ↓
           │   compare with DB value (revocation check)
           │        ↓
           │   issue new accessToken (with latest role from DB)
           │
           └── Logout → remove refresh_token from DB → revoked immediately
```

### `src/types/express.d.ts` — global type augmentation

`req.user` is typed as `JwtPayload` globally across the entire app — no inline casting needed:

```typescript
declare global {
  namespace Express {
    interface User extends JwtPayload {} // { userId: number; email: string; role: Role }
  }
}
```

### `src/configs/passport.ts`

`configurePassport(userRepository)` is called once in `server.ts` before `createApp()`, registering the `JwtStrategy` with the injected repository — keeping Passport configuration testable and decoupled from the global module scope.

---

## Role-based Authorization

The API implements role-based access control (RBAC) with two roles: `admin` and `user`.

### Roles

| Role    | Permissions                                        |
| ------- | -------------------------------------------------- |
| `user`  | Read all posts, manage own session (`/users/me`)   |
| `admin` | Full access — all `user` permissions + write posts |

### How it works

Role is stored in the `users` table and included in the JWT payload on login. The `authorize(...roles)` middleware reads `req.user.role` — set by `authMiddleware` (passport-jwt) — without an extra DB query:

```
authMiddleware → authorize('admin') → controller
     ↓                  ↓
 verify JWT        check req.user.role
 set req.user      403 if not in allowed roles
```

### `src/middlewares/authorize.ts`

```typescript
// Usage on routes:
router.post('/', authMiddleware, authorize(Role.ADMIN), controller.createPost);
router.put(
  '/:id',
  authMiddleware,
  authorize(Role.ADMIN),
  controller.updatePost
);
router.delete(
  '/:id',
  authMiddleware,
  authorize(Role.ADMIN),
  controller.deletePost
);
```

### Promoting a user to admin

Role assignment is never exposed through the public API. Promote via DB directly:

```bash
sqlite3 data/blog.db "UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';"
```

The promoted user receives the updated role on their **next login** or **next token refresh** (access tokens reflect the DB role on refresh, max 15 min delay).

### `src/constants/role.ts`

Uses a `const` object instead of an `enum` — compatible with `erasableSyntaxOnly: true`:

```typescript
export const Role = {
  ADMIN: 'admin',
  USER: 'user'
} as const;

export type Role = (typeof Role)[keyof typeof Role];
```

---

## Rate Limiting

Two limiters are applied, defined in `src/middlewares/rate-limit.ts`:

| Limiter         | Limit                 | Applied to                   |
| --------------- | --------------------- | ---------------------------- |
| `globalLimiter` | 100 req / 15 min / IP | All routes                   |
| `writeLimiter`  | 10 req / 15 min / IP  | `POST`, `PUT`, `DELETE` only |

When a limit is exceeded the response is:

```json
{
  "success": false,
  "status": "error",
  "message": "Too many requests, please try again later."
}
```

Standard `RateLimit-*` response headers (RFC 9110) are included so clients can back off gracefully.

---

## Idempotency

`POST /api/v1/posts` supports the `Idempotency-Key` header to prevent duplicate posts caused by network errors and client retries.

### How it works

```
Request arrives
    │
    ├── No header          → proceed normally (no idempotency)
    ├── Invalid UUID       → 400 Bad Request
    ├── Key found, < 24h   → replay original response (no DB write)
    ├── Key found, ≥ 24h   → delete stale row, treat as new request
    └── New key            → create post → cache (key, status, response) → 201
```

### Usage

```http
POST /api/v1/posts
Authorization: Bearer <accessToken>
Content-Type: application/json
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000

{
  "title": "My Post",
  "content": "...",
  "category": "Tech",
  "tags": ["api"]
}
```

On a replayed request, the response includes:

```
Idempotent-Replayed: true
```

### Rules

- The key **must be a UUID** (v4 format)
- Keys expire after **24 hours** — sending the same key after expiry creates a new post
- Only `2xx` responses are cached — validation errors (`400`) are never stored
- `PUT` and `DELETE` are naturally idempotent by HTTP semantics and do not require this header

### Cleanup

Expired keys are purged from the `idempotency_keys` table on every server startup. The helper `purgeExpiredKeys(repo)` in `src/middlewares/idempotency.ts` can also be called on a schedule in production.

---

## Error Handling

All errors follow a consistent JSON shape:

```json
{
  "success": false,
  "status": "error",
  "message": "Human-readable description",
  "errors": {
    "fieldName": ["Validation message"]
  }
}
```

`errors` is only present on `400` validation failures.

| Scenario                   | Status | Message                                   |
| -------------------------- | ------ | ----------------------------------------- |
| Post / User not found      | `404`  | `Post not found` / `User not found`       |
| Invalid ID param           | `400`  | `Invalid post ID`                         |
| Missing required field     | `400`  | `Validation failed` + `errors` map        |
| Email already exists       | `400`  | `Email already exists`                    |
| Invalid credentials        | `400`  | `Invalid credentials`                     |
| Missing or invalid token   | `401`  | `Unauthorized — missing or invalid token` |
| Invalid refresh token      | `400`  | `Invalid refresh token`                   |
| Insufficient role          | `403`  | `Forbidden — requires one of: admin`      |
| Invalid Idempotency-Key    | `400`  | `Invalid idempotency-key header...`       |
| Rate limit exceeded        | `429`  | `Too many requests...`                    |
| Route not found            | `404`  | `Route METHOD /path not found`            |
| Unhandled exception (dev)  | `500`  | Original error message                    |
| Unhandled exception (prod) | `500`  | `Internal server error`                   |

---

## Code Quality

| Tool                                               | Purpose                                          |
| -------------------------------------------------- | ------------------------------------------------ |
| TypeScript `strict` + `NodeNext`                   | Full type safety, ESM module resolution          |
| `experimentalDecorators` + `emitDecoratorMetadata` | Required for TypeORM entity decorators           |
| ESLint (flat config) + `typescript-eslint`         | Linting with type-aware rules                    |
| Prettier                                           | Consistent formatting                            |
| EditorConfig                                       | Cross-editor whitespace/indent consistency       |
| Husky                                              | Git hooks: pre-commit runs lint + format check   |
| Commitlint                                         | Enforces Conventional Commits on commit messages |

```bash
pnpm lint          # Check for lint errors
pnpm lint:fix      # Auto-fix lint errors
pnpm format        # Format all files
pnpm format:check  # Check formatting without writing
```

---

## Commit Convention

Uses [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add role-based authorization with admin and user roles
feat: add GET /users/me endpoint
fix: handle legacy comma-separated tags format
refactor: migrate raw SQL to TypeORM entities
docs: update README with authorization section
chore: add bcryptjs and passport dependencies
```

**Allowed types:** `feat` | `fix` | `docs` | `style` | `refactor` | `test` | `chore` | `perf` | `ci` | `revert`

Commitlint enforces this on every commit via the `commit-msg` Husky hook.
