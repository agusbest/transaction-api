# Transaction API

A backend REST API for managing users, account balances, and balance transfers.

This project was built as a **Backend Developer Technical Assessment** using Node.js and TypeScript, with a focus on transaction integrity, concurrency safety, idempotency, authentication, validation, automated testing, and production-ready backend practices.

---

## Project Overview

Transaction API allows authenticated users to:

- Register an account
- Login using email and password
- View user information
- View current account balance
- Transfer balance to another user
- View transaction history
- Use pagination for transaction history
- Safely retry transfers using an `Idempotency-Key`

The application ensures that balance transfers are processed atomically and safely under concurrent requests.

### Main Architecture

The application follows a modular service-based architecture:

```text
Client
  │
  ▼
Fastify Routes
  │
  ├── Authentication
  ├── Users
  ├── Transfers
  └── Transactions
  │
  ▼
Service Layer
  │
  ▼
Prisma ORM
  │
  ▼
PostgreSQL
```

Responsibilities are separated between:

- **Routes** — HTTP endpoints, authentication, request validation, and responses
- **Schemas** — Request validation using Zod
- **Services** — Business logic
- **Prisma** — Database access and transactions
- **PostgreSQL** — Persistent storage and database-level integrity
- **Pino** — Structured application logging

---

## Technology Stack

| Technology | Version / Purpose |
|---|---|
| Node.js | 22+ |
| TypeScript | Type-safe application development |
| Fastify | Web framework |
| PostgreSQL | 17 |
| Prisma | 7 |
| Zod | Request validation |
| JWT | Authentication |
| bcrypt | Password hashing |
| Pino | Structured logging |
| Vitest | Automated testing |
| Docker | Containerization |
| Docker Compose | Local infrastructure |

---

## Features

### Authentication

- User registration
- User login
- Password hashing with bcrypt
- JWT-based authentication
- Protected API endpoints
- Authorization to ensure users can only initiate transfers from their own account

### Users

- Create user
- Get all users
- Get user by ID
- Get current balance
- Balance stored using PostgreSQL `DECIMAL`

### Transactions

- Transfer balance between users
- Validate sender
- Validate receiver
- Prevent transfer to the same account
- Validate transfer amount
- Validate sufficient balance
- Atomic balance updates
- Database transaction support
- Concurrency-safe balance handling
- Idempotency protection
- Transaction history

### Reliability

- PostgreSQL transactions
- Row-level locking for concurrent balance updates
- Database constraints
- Unique idempotency keys
- Zod request validation
- Centralized error handling
- Structured logging
- JWT authentication

---

# Project Structure

```text
transaction-api/
│
├── prisma/
│   ├── migrations/
│   └── schema.prisma
│
├── src/
│   ├── generated/
│   │
│   ├── lib/
│   │   ├── app-error.ts
│   │   └── prisma.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.route.ts
│   │   │   ├── auth.schema.ts
│   │   │   └── auth.service.ts
│   │   │
│   │   ├── transactions/
│   │   │   ├── transaction.route.ts
│   │   │   ├── transaction.schema.ts
│   │   │   └── transaction.service.ts
│   │   │
│   │   └── users/
│   │       ├── user.route.ts
│   │       ├── user.schema.ts
│   │       └── user.service.ts
│   │
│   ├── plugins/
│   │   ├── auth.ts
│   │   ├── error-handler.ts
│   │   └── swagger.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── tests/
│   ├── auth.test.ts
│   ├── users.test.ts
│   ├── transactions.test.ts
│   └── concurrency.test.ts
│
├── prisma7.config.ts
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── package.json
├── tsconfig.json
├── README.md
└── AI-USAGE.md
```

---

# Prerequisites

## Recommended Setup

The recommended setup uses Docker for PostgreSQL.

Required:

- Node.js 22+
- Docker Desktop
- Docker Compose

PostgreSQL does **not** need to be installed separately when using the Docker setup.

## Native PostgreSQL Setup

Docker is not mandatory if PostgreSQL is already installed locally.

Required:

- Node.js 22+
- PostgreSQL 17+

---

# Environment Configuration

Create the environment file from `.env.example`:

```bash
cp .env.example .env
```

Example:

```env
DATABASE_URL="postgresql://transaction_user:transaction_password@localhost:5433/transaction_db"
JWT_SECRET="change-this-to-a-secure-random-secret"
PORT=3000
NODE_ENV=development
```

### Environment Variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://transaction_user:transaction_password@localhost:5433/transaction_db` |
| `JWT_SECRET` | Secret used to sign JWT tokens | `change-this-to-a-secure-random-secret` |
| `PORT` | API server port | `3000` |
| `NODE_ENV` | Application environment | `development` |

Do not commit `.env` to Git.

Production environments should use a strong randomly generated `JWT_SECRET`.

---

# Installation

Clone the repository:

```bash
git clone <repository-url>
cd transaction-api
```

Install dependencies:

```bash
npm install
```

Generate Prisma Client:

```bash
npx prisma generate
```

Create `.env`:

```bash
cp .env.example .env
```

Update the environment variables if necessary.

---

# Database Setup

## Using Docker

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Apply migrations:

```bash
npx prisma migrate deploy
```

Seed demo users:

```bash
npm run db:seed
```

The seed creates two demo users.

### Demo Accounts

```text
Alice
Email: alice@example.com
Password: password123
Balance: 1000.00
```

```text
Bob
Email: bob@example.com
Password: password123
Balance: 500.00
```

These accounts are intended for local development and testing only.

---

## Reset Database

To reset the development database:

```bash
npx prisma migrate reset
```

This will remove existing data and re-run the migrations.

After resetting, run the seed again if necessary:

```bash
npm run db:seed
```

> Do not use database reset commands against a production database.

---

# Running the Application

## Option 1 — Docker PostgreSQL + Local Node.js

This is the recommended development workflow.

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Then start the API locally:

```bash
npm run dev
```

API:

```text
http://localhost:3000
```

Health check:

```text
http://localhost:3000/health
```

Swagger UI:

```text
http://localhost:3000/docs
```

In this mode, **do not start the API container** because the local Node.js process already uses port `3000`.

---

## Option 2 — Full Docker

Docker Compose can run both the API and PostgreSQL.

Build the containers:

```bash
docker compose build
```

Start the services:

```bash
docker compose up -d
```

Check running services:

```bash
docker compose ps
```

Expected containers:

```text
transaction-api
transaction-api-postgres
```

Apply migrations:

```bash
docker compose exec api npx prisma migrate deploy
```

Run seed data:

```bash
docker compose exec api npm run db:seed
```

View API logs:

```bash
docker compose logs api
```

Follow logs:

```bash
docker compose logs -f api
```

API:

```text
http://localhost:3000
```

Swagger:

```text
http://localhost:3000/docs
```

Stop the services:

```bash
docker compose down
```

To remove the PostgreSQL data volume as well:

```bash
docker compose down -v
```

> `docker compose down -v` permanently removes the local PostgreSQL Docker volume and its data.

---

# Docker Database Configuration

The Docker PostgreSQL configuration uses:

```text
Database: transaction_db
User:     transaction_user
Port:     5433 (host)
```

PostgreSQL listens on its standard internal container port:

```text
5432
```

The host maps:

```text
localhost:5433 → PostgreSQL container:5432
```

When the API runs inside Docker, it connects to PostgreSQL through the Docker network rather than through `localhost`.

---

# API Documentation

Interactive API documentation is available through Swagger/OpenAPI.

## Local Development

Swagger UI:

```text
http://localhost:3000/docs
```

Health Check:

```text
http://localhost:3000/health
```

## Live Deployment

The API has been deployed and is publicly accessible:

* **Live API:** https://transaction-api-6coy.onrender.com
* **Swagger UI:** https://transaction-api-6coy.onrender.com/docs
* **Health Check:** https://transaction-api-6coy.onrender.com/health

The Swagger UI provides interactive documentation for all available API endpoints, including:

* Authentication
* User management
* Balance management
* Balance transfers
* Transaction history

The health check endpoint verifies that the API and database connection are running correctly.



---

# API Endpoints

Base URL:

```text
http://localhost:3000
```

---

## Authentication

### Register

```http
POST /auth/register
```

Request:

```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "data": {
    "id": "user-id",
    "name": "Alice",
    "email": "alice@example.com",
    "balance": "0",
    "createdAt": "2026-09-04T07:00:00.000Z",
    "updatedAt": "2026-09-04T07:00:00.000Z"
  }
}
```

Password is securely hashed using bcrypt and is never returned in the response.

---

## Login

```http
POST /auth/login
```

Request:

```json
{
  "email": "alice@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "data": {
    "accessToken": "jwt-token"
  }
}
```

Use the returned token in protected requests:

```http
Authorization: Bearer <accessToken>
```

---

# Users

## Create User

```http
POST /users
```

Authentication:

```text
Not required
```

Request:

```json
{
  "name": "Charlie",
  "email": "charlie@example.com",
  "password": "password123"
}
```

A newly created user starts with:

```text
balance: 0
```

The API does not allow users to specify an initial balance during registration.

---

## Get All Users

```http
GET /users
```

Authentication:

```text
Required
```

Example:

```http
Authorization: Bearer <accessToken>
```

---

## Get User

```http
GET /users/:id
```

Authentication:

```text
Required
```

Example:

```http
GET /users/cmtco902g0001ocvbm94hvgvm
```

---

## Get Current Balance

```http
GET /users/:id/balance
```

Authentication:

```text
Required
```

Response example:

```json
{
  "data": {
    "userId": "user-id",
    "balance": "750"
  }
}
```

---

# Transfers

## Create Transfer

```http
POST /transfers
```

Authentication:

```text
Required
```

Required headers:

```http
Authorization: Bearer <accessToken>
Idempotency-Key: transfer-001
Content-Type: application/json
```

Request:

```json
{
  "fromUserId": "sender-user-id",
  "toUserId": "receiver-user-id",
  "amount": "250.00"
}
```

Example response:

```json
{
  "data": {
    "id": "transaction-id",
    "fromUserId": "sender-user-id",
    "toUserId": "receiver-user-id",
    "amount": "250",
    "status": "completed",
    "createdAt": "2026-09-04T07:00:00.000Z",
    "updatedAt": "2026-09-04T07:00:00.000Z"
  }
}
```

A successful transfer deducts the amount from the sender and adds it to the receiver.

Example:

```text
Before:

Alice: 1000
Bob:    500

Transfer: 250

After:

Alice: 750
Bob:    750
```

The authenticated user is only allowed to create a transfer where `fromUserId` matches the authenticated user's ID.

---

# Transactions

## Get Transaction History

```http
GET /transactions
```

Authentication:

```text
Required
```

Supports pagination.

Example:

```http
GET /transactions?page=1&limit=10
```

Response:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

Transactions are ordered by newest first.

The transaction history is scoped to the authenticated user.

---

# Idempotency

The transfer endpoint requires an `Idempotency-Key` header.

Example:

```http
Idempotency-Key: transfer-alice-bob-001
```

The key prevents the same transfer from being processed multiple times when a client retries a request.

Example:

```text
Initial balance:

Alice: 1000
Bob:    500

First request:

Transfer 500

Alice: 500
Bob:   1000

Retry using the same Idempotency-Key:

Alice: 500
Bob:   1000

Transactions created: 1
```

A repeated request with the same idempotency key returns the previously created transaction instead of creating another transaction.

The idempotency key is protected by a database-level unique constraint for the authenticated user.

---

# Concurrency Handling

Transfers use a database transaction to ensure that balance updates are atomic.

The sender and receiver balance records are locked during the critical part of the transfer operation.

This prevents race conditions such as:

```text
Initial balance:

Alice = 1000
```

Two concurrent requests:

```text
Request A → transfer 800
Request B → transfer 800
```

Without proper concurrency control, both requests could read the same initial balance and incorrectly succeed.

With the transaction and row-level locking strategy:

```text
Request A → succeeds
Request B → fails with insufficient balance
```

The resulting balance can never become negative because both operations cannot independently spend the same available balance.

---

# Database Design

The application uses PostgreSQL with Prisma ORM.

## User

Stores user account information and current balance.

```text
users

├── id
├── name
├── email
├── passwordHash
├── balance
├── createdAt
└── updatedAt
```

Important constraints:

- `id` is the primary key
- `email` is unique
- `balance` uses PostgreSQL `DECIMAL`
- Passwords are stored as bcrypt hashes

---

## Transaction

Stores balance transfer history.

```text
transactions

├── id
├── fromUserId
├── toUserId
├── amount
├── status
├── createdAt
└── updatedAt
```

Relationships:

```text
User
 ├── outgoingTransactions
 └── incomingTransactions

Transaction
 ├── fromUser
 └── toUser
```

Indexes are used on commonly queried fields such as:

- `fromUserId`
- `toUserId`
- `status`
- `createdAt`

---

## IdempotencyKey

Stores idempotency information.

```text
idempotency_keys

├── id
├── key
├── userId
├── transactionId
└── createdAt
```

A unique constraint on:

```text
(key, userId)
```

prevents the same user from processing the same idempotency key multiple times.

---

# Database Migration

Prisma migrations are stored in:

```text
prisma/migrations/
```

For development:

```bash
npx prisma migrate dev
```

For an existing database:

```bash
npx prisma migrate deploy
```

Generate Prisma Client:

```bash
npx prisma generate
```

When running the API inside Docker:

```bash
docker compose exec api npx prisma migrate deploy
```

---

# Validation and Error Handling

Request validation is performed using Zod.

Example:

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid request body",
  "details": {}
}
```

Common errors include:

```text
VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
USER_NOT_FOUND
SENDER_NOT_FOUND
RECEIVER_NOT_FOUND
INSUFFICIENT_BALANCE
IDEMPOTENCY_KEY_REQUIRED
EMAIL_ALREADY_EXISTS
```

HTTP status codes are used according to the type of error:

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
500 Internal Server Error
```

Unexpected server errors are handled centrally and sensitive implementation details such as stack traces, passwords, JWT secrets, and database credentials are not exposed to API clients.

---

# Authentication and Authorization

The API uses JWT authentication.

After successful login, the API returns an access token.

Protected endpoints require:

```http
Authorization: Bearer <accessToken>
```

Authorization is also enforced for transfers.

A user cannot create a transfer from another user's account:

```text
Authenticated User: Alice

fromUserId: Bob
```

The API returns:

```http
403 Forbidden
```

This prevents authenticated users from impersonating another account when initiating transfers.

---

# Logging

The application uses Pino for structured logging.

Important application events include:

- Transfer created
- Transfer completed
- Transfer failed
- Unexpected errors

Sensitive information is intentionally excluded from logs, including:

- Passwords
- Password hashes
- JWT tokens
- JWT secrets
- Database credentials

---

# Testing

The project uses **Vitest** for automated testing.

Run all tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

The tests cover important application behavior including:

## Users

- Create user successfully
- Reject invalid user data
- Get all users
- Get user by ID
- Return 404 when user does not exist

## Authentication

- Successful login
- Invalid credentials
- Protected endpoint without JWT

## Transfers

- Successful transfer
- Insufficient balance
- Invalid amount
- Invalid request data
- Missing sender
- Missing receiver
- Missing idempotency key
- Duplicate idempotency request
- Sender balance verification
- Receiver balance verification
- Transaction count verification

## Concurrency

Concurrent transfers are tested to verify that a user's balance cannot be overspent due to race conditions.

Run:

```bash
npm test
```

All tests require a working PostgreSQL database according to the configured `DATABASE_URL`.

---

# Build

Compile the TypeScript application:

```bash
npm run build
```

The compiled application is generated in:

```text
dist/
```

Production entry point:

```text
dist/server.js
```

Start the compiled application:

```bash
npm start
```

---

# Health Check

The application provides a health-check endpoint:

```http
GET /health
```

Example:

```text
http://localhost:3000/health
```

This endpoint can be used by Docker, deployment platforms, monitoring systems, or load balancers to verify that the API is running.

---

# Docker Architecture

```text
                    ┌─────────────────────┐
                    │       Client        │
                    │  Swagger / Postman  │
                    └──────────┬──────────┘
                               │
                               │ HTTP :3000
                               ▼
                    ┌─────────────────────┐
                    │    API Container    │
                    │  Node.js + Fastify  │
                    │       :3000         │
                    └──────────┬──────────┘
                               │
                               │ postgres:5432
                               ▼
                    ┌─────────────────────┐
                    │ PostgreSQL Container│
                    │    PostgreSQL 17    │
                    │       :5432         │
                    └─────────────────────┘
```

Host PostgreSQL port:

```text
localhost:5433
```

API port:

```text
localhost:3000
```

---

# Quick Start

## Recommended Development Setup

Make sure Docker Desktop is running.

Clone the repository:

```bash
git clone <repository-url>
cd transaction-api
```

Install dependencies:

```bash
npm install
```

Create environment file:

```bash
cp .env.example .env
```

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Generate Prisma Client:

```bash
npx prisma generate
```

Apply migrations:

```bash
npx prisma migrate deploy
```

Seed demo users:

```bash
npm run db:seed
```

Start the API:

```bash
npm run dev
```

Access:

```text
API:
http://localhost:3000

Swagger:
http://localhost:3000/docs

Health:
http://localhost:3000/health
```

Demo login:

```text
Email: alice@example.com
Password: password123
```

---

# Useful Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build
npm run build

# Production server
npm start

# Run tests
npm test

# Watch tests
npm run test:watch

# Generate Prisma Client
npx prisma generate

# Development migration
npx prisma migrate dev

# Deploy migrations
npx prisma migrate deploy

# Seed database
npm run db:seed

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```

---

# Technical Decisions

## Database Design

PostgreSQL was selected because the application requires strong transactional guarantees and relational consistency.

Balances use `DECIMAL(18,2)` rather than floating-point numbers to avoid precision problems when handling monetary values.

Database constraints and indexes are used in addition to application-level validation.

---

## Transaction Strategy

Balance transfers are executed inside a database transaction.

The transfer operation performs:

```text
1. Validate idempotency key
2. Lock required user rows
3. Validate sender and receiver
4. Validate sufficient balance
5. Deduct sender balance
6. Add receiver balance
7. Create transaction record
8. Store idempotency key
9. Commit transaction
```

If any operation fails, the database transaction is rolled back so that partial balance updates cannot occur.

---

## Concurrency Strategy

The implementation uses database-level row locking inside a transaction.

This prevents concurrent transfers from reading and modifying the same sender balance simultaneously.

Database-level concurrency control is preferred over relying only on application-level checks because the database is the authoritative source of balance state.

---

## Idempotency Strategy

Idempotency is implemented using a dedicated `IdempotencyKey` table.

The combination of:

```text
key + userId
```

is unique.

The idempotency record is created as part of the same database transaction as the transfer.

This ensures that retries cannot create duplicate transactions or deduct the balance twice.

---

## Authentication Strategy

JWT is used for stateless API authentication.

Passwords are hashed using bcrypt before being stored in the database.

Passwords are never stored or returned in plain text.

Authorization is additionally enforced for transfer operations so that the authenticated user can only transfer funds from their own account.

---

## Error Handling Strategy

Validation errors are handled using Zod.

Expected business errors are converted into appropriate HTTP responses.

Unexpected errors are handled centrally to avoid exposing:

- Stack traces
- Database details
- Passwords
- JWT secrets
- Internal implementation details

Structured logs are used for debugging and operational visibility.

---

# Known Limitations

This project is intentionally scoped for the technical assessment.

The following features are not implemented:

- Refresh tokens
- Password reset
- Email verification
- Account lockout / brute-force protection
- Rate limiting
- Multi-currency support
- External payment provider integration
- Distributed tracing
- Background job processing
- Advanced fraud detection
- Production-grade secrets management

For production, the application could be improved with:

- Refresh token rotation
- Rate limiting
- Stronger password policies
- Account lockout and login monitoring
- Secrets management such as a cloud secret manager
- Redis for distributed caching and rate limiting
- Distributed tracing
- Metrics and monitoring
- CI/CD pipelines
- Database replication and backup strategies
- More extensive integration and load testing
- Horizontal scaling behind a load balancer

These features were intentionally excluded to keep the implementation focused on the assessment requirements.

---

# AI Usage

AI-assisted development details are documented separately in:

```text
AI-USAGE.md
```

The document describes:

- AI tools used
- Areas where AI assistance was used
- Code and architecture assisted by AI
- An example of an incorrect AI-generated suggestion
- Manual review and testing performed by the candidate

All application logic was reviewed, tested, and verified before inclusion in the project.

---

# License

This project was created as a technical assessment and is intended for evaluation purposes.