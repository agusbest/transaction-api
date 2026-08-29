import { prisma } from "../../lib/prisma";
import type { CreateUserInput } from "./user.schema";

export async function createUser(input: CreateUserInput) {
  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
    },
    select: {
      id: true,
      name: true,
      email: true,
      balance: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      balance: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      balance: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}