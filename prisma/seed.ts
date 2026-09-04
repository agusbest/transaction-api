import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

const SALT_ROUNDS = 10;

async function main() {
  await prisma.user.deleteMany();

  const alicePasswordHash = await bcrypt.hash("password123", SALT_ROUNDS);
  const bobPasswordHash = await bcrypt.hash("password123", SALT_ROUNDS);

  const alice = await prisma.user.create({
    data: {
      name: "Alice",
      email: "alice@example.com",
      passwordHash: alicePasswordHash,
      balance: "1000.00",
    },
  });

  const bob = await prisma.user.create({
    data: {
      name: "Bob",
      email: "bob@example.com",
      passwordHash: bobPasswordHash,
      balance: "500.00",
    },
  });

  console.log("Seeded users:");
  console.log({
    aliceId: alice.id,
    bobId: bob.id,
    loginCredentials: {
      alice: { email: "alice@example.com", password: "password123" },
      bob: { email: "bob@example.com", password: "password123" },
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });