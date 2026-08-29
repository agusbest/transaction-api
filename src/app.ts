import Fastify from "fastify";
import { prisma } from "./lib/prisma";
import { userRoutes } from "./modules/users/user.route";
import { transactionRoutes } from "./modules/transactions/transaction.route";
import { registerErrorHandler } from "./plugins/error-handler";

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  registerErrorHandler(app);

  app.get("/health", async (_request, reply) => {
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
  });

  app.register(userRoutes);
  app.register(transactionRoutes);

  return app;
}