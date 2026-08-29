import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  await prisma.user.deleteMany();

  const alice = await prisma.user.create({
    data: {
      name: "Alice",
      email: "alice@example.com",
      balance: "1000.00",
    },
  });

  const bob = await prisma.user.create({
    data: {
      name: "Bob",
      email: "bob@example.com",
      balance: "500.00",
    },
  });

  console.log("Seeded users:");
  console.log({
    aliceId: alice.id,
    bobId: bob.id,
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