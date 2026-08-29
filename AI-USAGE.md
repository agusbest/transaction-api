# AI Usage Documentation

## AI Tools Used

* ChatGPT (OpenAI)

## What AI Was Used For

AI was used as a development assistant during the implementation of this technical assessment.

The main uses were:

* Discussing backend architecture and project structure.
* Assisting with Fastify, TypeScript, Prisma, PostgreSQL, and Docker configuration.
* Troubleshooting development and database connection issues.
* Reviewing API implementation and error handling.
* Assisting with Zod validation.
* Assisting with Vitest test cases.
* Reviewing idempotency implementation and transaction behavior.
* Assisting with Dockerfile and Docker Compose configuration.
* Assisting with project documentation and README preparation.

## AI-Assisted Parts

The following parts were developed with AI assistance:

* Project structure and module organization.
* Prisma schema design and migration configuration.
* Fastify route and service implementation.
* Zod request validation.
* Transaction service logic, including database transactions.
* Idempotency handling.
* Pagination implementation.
* Error handling structure.
* Vitest test cases.
* Dockerfile and Docker Compose configuration.
* README.md documentation.

All AI-assisted code was reviewed, adapted, and tested as part of the development process.

## Example of Incorrect AI Output

One example occurred while configuring Prisma 7 and Docker.

An initial Docker configuration attempted to run:

```text
npx prisma generate
```

during the Docker build without providing the `DATABASE_URL` environment variable required by `prisma7.config.ts`.

This caused the Docker build to fail with:

```text
PrismaConfigEnvError: Cannot resolve environment variable: DATABASE_URL
```

The configuration was then reviewed and modified so that the build stage could successfully generate the Prisma client, while the actual database connection is provided through Docker Compose at runtime.

Another issue occurred during the initial Dockerfile configuration where the application entry point was assumed to be:

```text
dist/src/server.js
```

After checking the actual TypeScript build output, the application entry point was found to be:

```text
dist/server.js
```

The Dockerfile was corrected accordingly.

## How AI-Generated Code Was Reviewed and Tested

AI-generated suggestions were not accepted without verification.

The implementation was reviewed by:

1. Running the application locally.
2. Testing API endpoints manually during development.
3. Verifying PostgreSQL connectivity.
4. Running Prisma migrations.
5. Running TypeScript compilation.
6. Running automated Vitest tests.
7. Running the application inside Docker containers.
8. Verifying Docker-to-PostgreSQL connectivity.
9. Running Prisma production migrations using `prisma migrate deploy`.
10. Reviewing the resulting API behavior and database state.

The final automated test suite passes:

```text
Test Files  2 passed
Tests       12 passed
```

The project also successfully passes:

```bash
npm run build
```

and the Docker environment successfully builds and runs the API and PostgreSQL services.

## Understanding of Submitted Code

AI was used as an assistant rather than as a replacement for understanding the implementation.

The submitted code was reviewed during development, tested against the requirements, and modified where necessary. The candidate is responsible for the final implementation and is prepared to explain the architecture, transaction handling, idempotency mechanism, validation, database design, testing strategy, and Docker setup.
