import Fastify from "fastify";

import { prisma } from "./lib/prisma";

import { userRoutes } from "./modules/users/user.route";
import { transactionRoutes } from "./modules/transactions/transaction.route";
import { authRoutes } from "./modules/auth/auth.route";

import { registerErrorHandler } from "./plugins/error-handler";
import authPlugin from "./plugins/auth";
import swaggerPlugin from "./plugins/swagger";

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  registerErrorHandler(app);

  // Plugins
  await app.register(authPlugin);
  await app.register(swaggerPlugin);

  // Home
  app.get("/", async () => {
  return {
    message: "Transaction API is running",
    status: "ok",
    docs: "/docs",
    health: "/health",
  };
});

  // Health check
  app.get(
    "/health",
    {
      schema: {
        tags: ["Health"],
        summary: "Health check",
        description:
          "Checks whether the API and PostgreSQL database are available.",
        response: {
          200: {
            description: "Application and database are healthy",
            type: "object",
            properties: {
              status: {
                type: "string",
              },
              database: {
                type: "string",
              },
            },
          },
          503: {
            description: "Database is unavailable",
            type: "object",
            properties: {
              status: {
                type: "string",
              },
              database: {
                type: "string",
              },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      try {
        await prisma.$queryRaw`SELECT 1`;

        return {
          status: "ok",
          database: "connected",
        };
      } catch (error) {
        app.log.error(error);

        return reply.status(503).send({
          status: "error",
          database: "disconnected",
        });
      }
    },
  );

  // Routes
  await app.register(userRoutes);
  await app.register(transactionRoutes);
  await app.register(authRoutes);

  // console.log(app.printRoutes());

  return app;
}