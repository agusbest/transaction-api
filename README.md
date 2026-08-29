# Transaction API

A backend REST API for handling user balances and money transfers.

Built as a technical assessment using **Node.js, TypeScript, Fastify, PostgreSQL, Prisma, Zod, Pino, and Vitest**.

## Tech Stack

* **Node.js** — Runtime
* **TypeScript** — Programming language
* **Fastify** — Web framework
* **PostgreSQL 17** — Database
* **Prisma 7** — ORM
* **Zod** — Request validation
* **Pino** — Structured logging
* **Vitest** — Automated testing
* **Docker / Docker Compose** — Local development and containerization

---

## Features

### Users

* Create user
* Get all users
* Get user by ID
* User balance tracking

### Transactions

* Transfer balance between users
* Validate sender and receiver
* Validate sufficient balance
* Atomic balance updates using database transactions
* Transaction history
* Pagination
* Idempotency protection
* Request validation

### Reliability

* Idempotency-Key support to prevent duplicate transfers
* Database transactions for atomic balance updates
* Input validation with Zod
* Centralized error handling
* Structured logging with Pino

---

## Project Structure

```text
transaction-api/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
│
├── src/
│   ├── generated/
│   ├── lib/
│   │   ├── app-error.ts
│   │   └── prisma.ts
│   │
│   ├── modules/
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
│   │   └── error-handler.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── tests/
│   ├── users.test.ts
│   └── transactions.test.ts
│
├── Dockerfile
├── docker-compose.yml
├── prisma7.config.ts
├── .env.example
├── package.json
└── README.md
```

---

# Requirements

Before running locally without Docker:

* Node.js 22+
* PostgreSQL 17+

For the recommended setup, Docker Desktop is sufficient.

---

# Environment Variables

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Example:

```env
DATABASE_URL="postgresql://transaction_user:transaction_password@localhost:5433/transaction_db"
PORT=3000
NODE_ENV=development
```

The `.env` file should not be committed to Git.

---

# Running with Docker

Docker Compose runs both the API and PostgreSQL.

### 1. Build the containers

```bash
docker compose build
```

### 2. Start the services

```bash
docker compose up -d
```

### 3. Check the containers

```bash
docker compose ps
```

Expected services:

```text
transaction-api
transaction-api-postgres
```

### 4. Apply database migrations

```bash
docker compose exec api npx prisma migrate deploy
```

If the database is already up to date:

```text
No pending migrations to apply.
```

### 5. Check API logs

```bash
docker compose logs api
```

The API runs on:

```text
http://localhost:3000
```

### 6. Stop the services

```bash
docker compose down
```

To also remove the PostgreSQL data volume:

```bash
docker compose down -v
```

> `docker compose down -v` deletes the PostgreSQL Docker volume and therefore removes the local database data.

---

# Running Locally

If running the API directly with Node.js:

### 1. Install dependencies

```bash
npm install
```

### 2. Generate Prisma Client

```bash
npx prisma generate
```

### 3. Apply development migrations

```bash
npx prisma migrate dev
```

### 4. Start development server

```bash
npm run dev
```

API:

```text
http://localhost:3000
```

---

# Database

The application uses PostgreSQL.

Database configuration for Docker:

```text
Database: transaction_db
User:     transaction_user
Port:     5433 (host)
```

Inside the Docker network, the API connects to PostgreSQL through:

```text
postgres:5432
```

The main database entities are:

### User

Stores user information and current balance.

```text
users
├── id
├── name
├── email
├── balance
├── createdAt
└── updatedAt
```

### Transaction

Stores money transfers.

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

### IdempotencyKey

Stores idempotency keys used to prevent duplicate transaction processing.

```text
idempotency_keys
├── id
├── key
├── userId
├── transactionId
└── createdAt
```

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

For an existing/production database:

```bash
npx prisma migrate deploy
```

When using Docker:

```bash
docker compose exec api npx prisma migrate deploy
```

---

# API Endpoints

Base URL:

```text
http://localhost:3000
```

## Users

### Create User

```http
POST /users
```

Request:

```json
{
  "name": "Alice",
  "email": "alice@example.com"
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
    "createdAt": "2026-08-28T08:20:23.316Z",
    "updatedAt": "2026-08-28T08:20:23.316Z"
  }
}
```

### Get Users

```http
GET /users
```

### Get User

```http
GET /users/:id
```

Example:

```http
GET /users/cmtco902g0001ocvbm94hvgvm
```

---

# Transactions

## Create Transaction

```http
POST /transactions
```

The request requires an `Idempotency-Key` header.

Example:

```http
Idempotency-Key: transfer-001
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
    "createdAt": "2026-08-28T08:20:23.316Z",
    "updatedAt": "2026-08-28T08:20:23.316Z"
  }
}
```

A successful transfer deducts the amount from the sender and adds it to the receiver.

Example:

```text
Alice: 1000 → 750
Bob:    500  → 750
```

---

## Get Transactions

```http
GET /transactions
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
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

Transactions are ordered by newest first.

---

# Idempotency

The transaction endpoint requires an `Idempotency-Key` header.

Example:

```http
Idempotency-Key: transfer-001
```

If the same request is retried with the same idempotency key, the transaction is not processed again.

Example:

```text
Initial balance

Alice: 1000
Bob:    500

First request:
Transfer 250

Alice: 750
Bob:   750

Retry with the same Idempotency-Key:

Alice: 750
Bob:   750

Transactions created: 1
```

This protects the API from duplicate transfers caused by retries or repeated requests.

---

# Validation and Error Handling

Request bodies are validated using Zod.

Example validation error:

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid request body",
  "details": {}
}
```

Common transaction errors include:

```text
SENDER_NOT_FOUND
RECEIVER_NOT_FOUND
INSUFFICIENT_BALANCE
IDEMPOTENCY_KEY_REQUIRED
VALIDATION_ERROR
```

HTTP status codes are used according to the type of error.

---

# Testing

The project uses Vitest for automated API testing.

Run:

```bash
npm test
```

Current test coverage includes:

### Users

* Create user successfully
* Reject invalid user data
* Get all users
* Get user by ID
* Return 404 when user does not exist

### Transactions

* Create transaction successfully
* Reject transaction when balance is insufficient
* Reject invalid transaction data
* Handle missing sender
* Handle missing receiver
* Require idempotency key
* Prevent duplicate transaction processing
* Verify sender balance
* Verify receiver balance
* Verify transaction count

Expected result:

```text
Test Files  2 passed
Tests       12 passed
```

---

# Build

Compile TypeScript:

```bash
npm run build
```

The compiled application is generated in:

```text
dist/
```

The production entry point is:

```text
dist/server.js
```

---

# Docker Architecture

```text
                 ┌─────────────────────┐
                 │       Client        │
                 │ Postman / Browser   │
                 └──────────┬──────────┘
                            │
                            │ HTTP :3000
                            ▼
                 ┌─────────────────────┐
                 │    API Container    │
                 │ Node.js + Fastify   │
                 │      :3000          │
                 └──────────┬──────────┘
                            │
                            │ postgres:5432
                            ▼
                 ┌─────────────────────┐
                 │ PostgreSQL Container│
                 │     PostgreSQL 17   │
                 │      :5432          │
                 └─────────────────────┘
```

---

# Quick Start

For the easiest setup:

```bash
git clone <repository-url>
cd transaction-api

docker compose build
docker compose up -d

docker compose exec api npx prisma migrate deploy
```

Then access:

```text
http://localhost:3000
```

Run automated tests:

```bash
npm install
npm test
```

---

## License

This project was created as a technical assessment.
