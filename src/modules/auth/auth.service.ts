import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma";
import type { LoginInput, RegisterInput } from "./auth.schema";

export async function registerUser(input: RegisterInput) {
  const passwordHash = await bcrypt.hash(input.password, 12);

  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
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

export async function authenticateUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
  });

  if (!user) {
    return null;
  }

  const passwordValid = await bcrypt.compare(
    input.password,
    user.passwordHash,
  );

  if (!passwordValid) {
    return null;
  }

  return user;
}