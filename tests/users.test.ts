import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app";
import { prisma } from "../src/lib/prisma";

describe("Users API", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.idempotencyKey.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.user.deleteMany();
  });

  it("should create a user successfully", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/users",
      payload: {
        name: "Alice",
        email: "alice@test.com",
        password: "password123",
      },
    });

    expect(response.statusCode).toBe(201);

    const body = response.json();

    expect(body.data).toMatchObject({
      name: "Alice",
      email: "alice@test.com",
      balance: "0",
    });

    expect(body.data.id).toBeDefined();
    expect(body.data.createdAt).toBeDefined();
    expect(body.data.updatedAt).toBeDefined();
  });

  it("should reject invalid user data", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/users",
      payload: {
        name: "",
        email: "invalid-email",
      },
    });

    expect(response.statusCode).toBe(400);

    const body = response.json();

    expect(body.error).toBe("ValidationError");
    expect(body.message).toBe("Invalid request body");
    expect(body.details).toBeDefined();
  });

  it("should get all users", async () => {
    await prisma.user.create({
      data: {
        name: "Alice",
        email: "alice@test.com",
        passwordHash: "test-password-hash",
      },
    });

    await prisma.user.create({
      data: {
        name: "Bob",
        email: "bob@test.com",
        passwordHash: "test-password-hash",
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/users",
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();

    expect(body.data).toHaveLength(2);

    expect(body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Alice",
          email: "alice@test.com",
          balance: "0",
        }),
        expect.objectContaining({
          name: "Bob",
          email: "bob@test.com",
          balance: "0",
        }),
      ]),
    );
  });

  it("should get a user by id", async () => {
    const user = await prisma.user.create({
      data: {
        name: "Alice",
        email: "alice@test.com",
        passwordHash: "test-password-hash",
      },
    });

    const response = await app.inject({
      method: "GET",
      url: `/users/${user.id}`,
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();

    expect(body.data).toMatchObject({
      id: user.id,
      name: "Alice",
      email: "alice@test.com",
      balance: "0",
    });
  });

  it("should return 404 when user does not exist", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/users/non-existent-user",
    });

    expect(response.statusCode).toBe(404);

    expect(response.json()).toEqual({
      error: "NotFound",
      message: "User not found",
    });
  });
});