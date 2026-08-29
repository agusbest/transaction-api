import { z } from "zod";

export const createTransactionSchema = z
  .object({
    fromUserId: z.string().min(1, "Sender is required"),
    toUserId: z.string().min(1, "Receiver is required"),
    amount: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, "Amount must have at most 2 decimal places"),
  })
  .refine((data) => data.fromUserId !== data.toUserId, {
    message: "Sender and receiver must be different",
    path: ["toUserId"],
  })
  .refine((data) => Number(data.amount) > 0, {
    message: "Amount must be greater than zero",
    path: ["amount"],
  });

export type CreateTransactionInput = z.infer<
  typeof createTransactionSchema
>;

export const transactionListQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(10),
});

export type TransactionListQuery = z.infer<
  typeof transactionListQuerySchema
>;