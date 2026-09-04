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
  app.post(
  "/transfers",
  {
    schema: {
      tags: ["Transfers"],
      summary: "Transfer balance",
      description:
        "Transfer balance from the authenticated user to another user. Requires the Idempotency-Key HTTP header.",
      security: [
        {
          bearerAuth: [],
        },
      ],
      headers: {
        type: "object",
        required: ["Idempotency-Key"],
        properties: {
          "Idempotency-Key": {
            type: "string",
            description:
              "Unique key to ensure the transfer is processed only once",
          },
        },
      },
      body: {
        type: "object",
        required: ["fromUserId", "toUserId", "amount"],
        properties: {
          fromUserId: {
            type: "string",
          },
          toUserId: {
            type: "string",
          },
          amount: {
            type: "string",
          },
        },
      },
      response: {
        201: {
          description: "Transfer successfully created",
        },
        400: {
          description:
            "Validation error, insufficient balance, or missing idempotency key",
        },
        401: {
          description: "Unauthorized",
        },
        403: {
          description:
            "Authenticated user cannot create transfer from another account",
        },
      },
    },
  },
  async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({
        error: "UNAUTHORIZED",
        message: "Unauthorized",
      });
    }

    const result = createTransactionSchema.safeParse(request.body);

    if (!result.success) {
      return reply.status(400).send({
        error: "VALIDATION_ERROR",
        message: "Invalid request body",
        details: result.error.flatten(),
      });
    }

    const userId = request.user.sub;

    if (result.data.fromUserId !== userId) {
      return reply.status(403).send({
        error: "FORBIDDEN",
        message: "You can only create transfers from your own account",
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

    try {
      const transaction = await createTransaction(
        result.data,
        idempotencyKey.trim(),
      );

      return reply.status(201).send({
        data: transaction,
      });
    } catch (error: any) {
      if (error?.code === "INSUFFICIENT_BALANCE") {
        return reply.status(400).send({
          error: "INSUFFICIENT_BALANCE",
          message: "Insufficient balance",
        });
      }

      throw error;
    }
  },
);

  app.get(
    "/transactions",
    {
      schema: {
        tags: ["Transactions"],
        summary: "Get transactions",
        description:
          "Get transactions belonging to the authenticated user with pagination.",
        security: [
          {
            bearerAuth: [],
          },
        ],
        querystring: {
          type: "object",
          properties: {
            page: {
              type: "integer",
              minimum: 1,
              default: 1,

            },
            limit: {
              type: "integer",
              minimum: 1,
              default: 10,
   
            },
          },
        },
        response: {
          200: {
            description: "Transactions retrieved successfully",
          },
          400: {
            description: "Invalid query parameters",
          },
          401: {
            description: "Unauthorized",
          },
        },
      },
    },
    async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({
          error: "UNAUTHORIZED",
          message: "Unauthorized",
        });
      }

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

      const userId = request.user.sub;

      const resultData = await getTransactions(
        result.data,
        userId,
      );

      return reply.send(resultData);
    },
  );
}