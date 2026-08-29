import type { FastifyInstance } from "fastify";
import {
  createTransaction,
  getTransactions,
} from "./transaction.service";
import {
  createTransactionSchema,
  transactionListQuerySchema,
} from "./transaction.schema";

export async function transactionRoutes(app: FastifyInstance) {
  app.post("/transactions", async (request, reply) => {
    const result = createTransactionSchema.safeParse(request.body);

    if (!result.success) {
      return reply.status(400).send({
        error: "VALIDATION_ERROR",
        message: "Invalid request body",
        details: result.error.flatten(),
      });
    }

    const idempotencyKey = request.headers["idempotency-key"];

    if (
      typeof idempotencyKey !== "string" ||
      idempotencyKey.trim().length === 0
    ) {
      return reply.status(400).send({
        error: "IDEMPOTENCY_KEY_REQUIRED",
        message: "Idempotency-Key header is required",
      });
    }

    const transaction = await createTransaction(
      result.data,
      idempotencyKey.trim(),
    );

    return reply.status(201).send({
      data: transaction,
    });
  });

  app.get("/transactions", async (request, reply) => {
    const result = transactionListQuerySchema.safeParse(
      request.query,
    );

    if (!result.success) {
      return reply.status(400).send({
        error: "VALIDATION_ERROR",
        message: "Invalid query parameters",
        details: result.error.flatten(),
      });
    }

    const resultData = await getTransactions(result.data);

    return reply.send(resultData);
  });
}