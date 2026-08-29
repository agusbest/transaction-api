import type { FastifyInstance } from "fastify";
import { Prisma } from "../generated/client";
import { AppError } from "../lib/app-error";

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: error.code,
        message: error.message,
      });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return reply.status(409).send({
          error: "CONFLICT",
          message: "Resource already exists",
        });
      }

      if (error.code === "P2025") {
        return reply.status(404).send({
          error: "NOT_FOUND",
          message: "Resource not found",
        });
      }
    }

    return reply.status(500).send({
      error: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
    });
  });
}