import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/app-error";
import type {
  CreateTransactionInput,
  TransactionListQuery,
} from "./transaction.schema";

export async function createTransaction(
  input: CreateTransactionInput,
  idempotencyKey: string,
) {
  return prisma.$transaction(async (tx) => {
    const existingKey = await tx.idempotencyKey.findUnique({
      where: {
        key_userId: {
          key: idempotencyKey,
          userId: input.fromUserId,
        },
      },
      include: {
        transaction: true,
      },
    });

    if (existingKey) {
      return existingKey.transaction;
    }

    const sender = await tx.user.findUnique({
      where: {
        id: input.fromUserId,
      },
    });

    if (!sender) {
      throw new AppError(
        404,
        "SENDER_NOT_FOUND",
        "Sender not found",
      );
    }

    const receiver = await tx.user.findUnique({
      where: {
        id: input.toUserId,
      },
    });

    if (!receiver) {
      throw new AppError(
        404,
        "RECEIVER_NOT_FOUND",
        "Receiver not found",
      );
    }

    const updatedSender = await tx.user.updateMany({
      where: {
        id: sender.id,
        balance: {
          gte: input.amount,
        },
      },
      data: {
        balance: {
          decrement: input.amount,
        },
      },
    });

    if (updatedSender.count !== 1) {
      throw new AppError(
        400,
        "INSUFFICIENT_BALANCE",
        "Insufficient balance",
      );
    }

    await tx.user.update({
      where: {
        id: receiver.id,
      },
      data: {
        balance: {
          increment: input.amount,
        },
      },
    });

    const transaction = await tx.transaction.create({
      data: {
        fromUserId: sender.id,
        toUserId: receiver.id,
        amount: input.amount,
        status: "completed",
      },
    });

    await tx.idempotencyKey.create({
      data: {
        key: idempotencyKey,
        userId: sender.id,
        transactionId: transaction.id,
      },
    });

    return transaction;
  });
}

export async function getTransactions(
  query: TransactionListQuery,
) {
  const { page, limit } = query;

  const skip = (page - 1) * limit;

  const [transactions, total] = await prisma.$transaction([
    prisma.transaction.findMany({
      skip,
      take: limit,

      orderBy: [
        {
          createdAt: "desc",
        },
        {
          id: "desc",
        },
      ],

      select: {
        id: true,
        fromUserId: true,
        toUserId: true,
        amount: true,
        status: true,
        createdAt: true,
        updatedAt: true,

        fromUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        toUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),

    prisma.transaction.count(),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: transactions,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}