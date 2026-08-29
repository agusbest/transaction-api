import { describe, expect, it, beforeEach } from "vitest";
import { buildApp } from "../src/app";
import { prisma } from "../src/lib/prisma";

describe("Transactions API", () => {
  const app = buildApp();

  beforeEach(async () => {
    await prisma.idempotencyKey.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.user.deleteMany();
  });

  it("should create a transaction successfully", async () => {
    const sender = await prisma.user.create({
      data: {
        name: "Alice",
        email: "alice@test.com",
        balance: "1000.00",
      },
    });

    const receiver = await prisma.user.create({
      data: {
        name: "Bob",
        email: "bob@test.com",
        balance: "500.00",
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/transactions",
      headers: {
        "idempotency-key": "test-transfer-001",
      },
      payload: {
        fromUserId: sender.id,
        toUserId: receiver.id,
        amount: "250.00",
      },
    });

    expect(response.statusCode).toBe(201);

    const body = response.json();

    expect(body.data).toMatchObject({
      fromUserId: sender.id,
      toUserId: receiver.id,
      amount: "250",
      status: "completed",
    });
  });

  // Insufficient Balance Test

  it("should reject transaction when balance is insufficient", async () => {
  const sender = await prisma.user.create({
    data: {
      name: "Alice",
      email: "alice@test.com",
      balance: "100.00",
    },
  });

  const receiver = await prisma.user.create({
    data: {
      name: "Bob",
      email: "bob@test.com",
      balance: "500.00",
    },
  });

  const response = await app.inject({
    method: "POST",
    url: "/transactions",
    headers: {
      "idempotency-key": "test-transfer-002",
    },
    payload: {
      fromUserId: sender.id,
      toUserId: receiver.id,
      amount: "250.00",
    },
  });

  expect(response.statusCode).toBe(400);

  expect(response.json()).toEqual({
    error: "INSUFFICIENT_BALANCE",
    message: "Insufficient balance",
  });

  const updatedSender = await prisma.user.findUnique({
    where: {
      id: sender.id,
    },
  });

  const updatedReceiver = await prisma.user.findUnique({
    where: {
      id: receiver.id,
    },
  });

  expect(updatedSender?.balance.toString()).toBe("100");
  expect(updatedReceiver?.balance.toString()).toBe("500");

  const transactionCount = await prisma.transaction.count();

  expect(transactionCount).toBe(0);
});


// Test Idempotency

it("should not process the same idempotency key twice", async () => {
  const sender = await prisma.user.create({
    data: {
      name: "Alice",
      email: "alice@test.com",
      balance: "1000.00",
    },
  });

  const receiver = await prisma.user.create({
    data: {
      name: "Bob",
      email: "bob@test.com",
      balance: "500.00",
    },
  });

  const payload = {
    fromUserId: sender.id,
    toUserId: receiver.id,
    amount: "250.00",
  };

  const firstResponse = await app.inject({
    method: "POST",
    url: "/transactions",
    headers: {
      "idempotency-key": "same-key-001",
    },
    payload,
  });

  const secondResponse = await app.inject({
    method: "POST",
    url: "/transactions",
    headers: {
      "idempotency-key": "same-key-001",
    },
    payload,
  });

  expect(firstResponse.statusCode).toBe(201);
  expect(secondResponse.statusCode).toBe(201);

  const firstBody = firstResponse.json();
  const secondBody = secondResponse.json();

  expect(secondBody.data.id).toBe(firstBody.data.id);

  const updatedSender = await prisma.user.findUnique({
    where: {
      id: sender.id,
    },
  });

  const updatedReceiver = await prisma.user.findUnique({
    where: {
      id: receiver.id,
    },
  });

  expect(updatedSender?.balance.toString()).toBe("750");
  expect(updatedReceiver?.balance.toString()).toBe("750");

  const transactionCount = await prisma.transaction.count();

  expect(transactionCount).toBe(1);
});

// Test Pagination

it("should get transactions with pagination", async () => {
  const sender = await prisma.user.create({
    data: {
      name: "Alice",
      email: "alice-pagination@test.com",
      balance: "5000.00",
    },
  });

  const receiver = await prisma.user.create({
    data: {
      name: "Bob",
      email: "bob-pagination@test.com",
      balance: "1000.00",
    },
  });

  for (let i = 1; i <= 5; i++) {
    await app.inject({
      method: "POST",
      url: "/transactions",
      headers: {
        "idempotency-key": `pagination-test-${i}`,
      },
      payload: {
        fromUserId: sender.id,
        toUserId: receiver.id,
        amount: "100.00",
      },
    });
  }

  const response = await app.inject({
    method: "GET",
    url: "/transactions?page=1&limit=2",
  });

  expect(response.statusCode).toBe(200);

  const body = response.json();

  expect(body.data).toHaveLength(2);

  expect(body.meta).toMatchObject({
    page: 1,
    limit: 2,
    total: 5,
    totalPages: 3,
  });
});

it("should return the second page of transactions", async () => {
  const sender = await prisma.user.create({
    data: {
      name: "Alice",
      email: "alice-page2@test.com",
      balance: "5000.00",
    },
  });

  const receiver = await prisma.user.create({
    data: {
      name: "Bob",
      email: "bob-page2@test.com",
      balance: "1000.00",
    },
  });

  for (let i = 1; i <= 5; i++) {
    await app.inject({
      method: "POST",
      url: "/transactions",
      headers: {
        "idempotency-key": `page2-test-${i}`,
      },
      payload: {
        fromUserId: sender.id,
        toUserId: receiver.id,
        amount: "100.00",
      },
    });
  }

  const response = await app.inject({
    method: "GET",
    url: "/transactions?page=2&limit=2",
  });

  expect(response.statusCode).toBe(200);

  const body = response.json();

  expect(body.data).toHaveLength(2);

  expect(body.meta).toMatchObject({
    page: 2,
    limit: 2,
    total: 5,
    totalPages: 3,
  });
});

// Test Post
it("should reject invalid transaction data", async () => {
  const response = await app.inject({
    method: "POST",
    url: "/transactions",
    headers: {
      "idempotency-key": "invalid-transaction-001",
    },
    payload: {
      fromUserId: "",
      toUserId: "",
      amount: "0",
    },
  });

  expect(response.statusCode).toBe(400);

  const body = response.json();


expect(body.error).toBe("VALIDATION_ERROR");
expect(body.message).toBe("Invalid request body");
expect(body.details).toBeDefined();
});

// Test missing Indempotensy-key

it("should reject transaction without idempotency key", async () => {
  const sender = await prisma.user.create({
    data: {
      name: "Alice",
      email: "alice-no-key@test.com",
      balance: "1000.00",
    },
  });

  const receiver = await prisma.user.create({
    data: {
      name: "Bob",
      email: "bob-no-key@test.com",
      balance: "500.00",
    },
  });

  const response = await app.inject({
    method: "POST",
    url: "/transactions",
    payload: {
      fromUserId: sender.id,
      toUserId: receiver.id,
      amount: "250.00",
    },
  });

  expect(response.statusCode).toBe(400);

  expect(response.json()).toEqual({
    error: "IDEMPOTENCY_KEY_REQUIRED",
    message: "Idempotency-Key header is required",
  });
});

});