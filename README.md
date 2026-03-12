# Node.js + Redis + PostgreSQL REST API

A REST API built with Node.js, Express, PostgreSQL, and Redis that handles user registration, authentication with JWT, and Redis-based profile caching.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 + TypeScript |
| Framework | Express 4 |
| Database | PostgreSQL 15 (persistent storage) |
| Cache | Redis 7 (session cache via ioredis) |
| Auth | JWT (jsonwebtoken) |
| Passwords | bcryptjs |
| Testing | Jest + ts-jest + Supertest |
| Containers | Docker + Docker Compose |

---

## Architecture Overview

```
Client
  │
  ▼
Express Router
  │
  ├── POST /users          → CreateUserController  → PostgreSQL (INSERT)
  ├── POST /login          → LoginUserController   → PostgreSQL (SELECT) + Redis (SET)
  └── GET  /users/profile/:id  → auth middleware → GetUserInfoController → Redis (GET)
```

After a successful login, the user's data is stored in Redis with a 1-hour TTL (`user-{id}`).  
`GET /users/profile/:id` reads exclusively from the Redis cache — no database round-trip.

---

## API Endpoints

### `POST /users` — Create a new user

**Request body:**
```json
{
  "name": "newname",
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "newpassword"
}
```

**Responses:**

| Status | Body |
|---|---|
| `201 Created` | `{ "message": "User created successfully", "userId": "<uuid>" }` |
| `400 Bad Request` | `{ "error": "Missing required fields." }` |
| `409 Conflict` | `{ "error": "Username already taken." }` |
| `500 Internal Server Error` | `{ "error": "Internal server error" }` |

---

### `POST /login` — Authenticate a user

**Request body:**
```json
{
  "username": "newuser",
  "password": "newpassword"
}
```

**Responses:**

| Status | Body |
|---|---|
| `200 OK` | `{ "message": "Login successful", "token": "<jwt>", "user": { "id", "name", "username", "email" } }` |
| `400 Bad Request` | `{ "error": "Username and password are required." }` |
| `401 Unauthorized` | `{ "error": "Invalid credentials." }` |
| `500 Internal Server Error` | `{ "error": "Internal server error." }` |

---

### `GET /users/profile/:id` — Get user profile (requires JWT)

**Header:**
```
Authorization: Bearer <token>
```

**Responses:**

| Status | Body |
|---|---|
| `200 OK` | `{ "id", "name", "username", "email" }` |
| `401 Unauthorized` | `{ "error": "Token missing" }` or `{ "error": "Invalid token" }` |
| `404 Not Found` | `{ "error": "User not found in cache." }` *(session expired or user never logged in)* |
| `500 Internal Server Error` | `{ "error": "Internal server error." }` |

> **Note:** This endpoint reads from Redis only. The cache is populated on login and expires after 1 hour. A 404 means the user needs to log in again.

---

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- Node.js 20+ (for local development without Docker)

### 1. Clone the repository

```bash
git clone https://github.com/luizcurti/redis-nodis-pg.git
cd redis-nodis-pg
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
# Application
PORT=3000
JWT_SECRET=your_jwt_secret_key

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=mydb

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

> When running via Docker Compose, `POSTGRES_HOST` should be `postgres` and `REDIS_HOST` should be `redis` (the service names defined in `docker-compose.yml`).

### 3. Start with Docker Compose

```bash
docker-compose up
```

This starts:
- **PostgreSQL** on port `5432` (creates the `users` table automatically via `database.sql`)
- **Redis** on port `6379`
- **Node.js app** on port `3000`

### 4. Start locally (without Docker)

Make sure PostgreSQL and Redis are running, then:

```bash
npm install
npm run dev
```

---

## Database Schema

```sql
CREATE TABLE IF NOT EXISTS users (
  id       UUID PRIMARY KEY,
  name     TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  email    TEXT UNIQUE NOT NULL
);
```

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server with hot reload (tsx watch) |
| `npm start` | Start production server (tsx) |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm test` | Run all tests |
| `npm run coverage` | Run tests with coverage report |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with automatic fixes |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check if code is properly formatted |

---

## Running Tests

```bash
npm test
```

The test suite uses Jest with mocked PostgreSQL, Redis, bcrypt, and JWT dependencies — no live services are required to run the tests.

```
Test Suites: 7 passed
Tests:       30 passed
```

---

## CI/CD Pipeline

This project uses GitHub Actions for continuous integration. The pipeline runs on every push and pull request to `main` and includes:

- ESLint code quality check
- Prettier format validation
- TypeScript type checking
- Full test suite with coverage
- Build verification

**Services provisioned in CI:**
- PostgreSQL 13
- Redis Alpine

---

## Project Structure

```
.
├── src/
│   ├── server.ts                  # Express app entry point
│   ├── routes.ts                  # Route definitions
│   ├── postgres.ts                # PostgreSQL pool (pg)
│   ├── redisConfig.ts             # Redis client (ioredis)
│   ├── controllers/
│   │   ├── CreateUserController.ts
│   │   ├── LoginUserController.ts
│   │   └── GetUserInfoController.ts
│   ├── middleware/
│   │   └── auth.ts                # JWT authentication middleware
│   └── @types/
│       └── express/index.d.ts     # Express Request type extension
├── __tests__/                     # Jest test suites
├── database.sql                   # PostgreSQL schema (auto-run by Docker)
├── docker-compose.yml
├── Dockerfile
├── jest.config.js
├── tsconfig.json
└── eslint.config.js
```

