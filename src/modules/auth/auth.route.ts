import type { FastifyInstance } from "fastify";

import {
  authenticateUser,
  registerUser,
} from "./auth.service";

import {
  loginSchema,
  registerSchema,
} from "./auth.schema";

export async function authRoutes(app: FastifyInstance) {
  // ==========================================
  // POST /auth/register
  // ==========================================
  app.post(
    "/auth/register",
    {
      schema: {
        tags: ["Authentication"],
        summary: "Register a new user",
        description:
          "Creates a new user account with a securely hashed password.",

        body: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: {
              type: "string",
              minLength: 1,
              description: "User's full name",
            },
            email: {
              type: "string",
              format: "email",
              description: "User's email address",
            },
            password: {
              type: "string",
              minLength: 8,
              description: "User's password",
            },
          },
        },

        response: {
          201: {
            description: "User successfully registered",
            type: "object",
            properties: {
              data: {
                type: "object",
                properties: {
                  id: {
                    type: "string",
                    description: "User ID",
                  },
                  name: {
                    type: "string",
                    description: "User's name",
                  },
                  email: {
                    type: "string",
                    description: "User's email",
                  },
                  balance: {
                    type: "string",
                    description: "Current account balance",
                  },
                  createdAt: {
                    type: "string",
                    format: "date-time",
                  },
                  updatedAt: {
                    type: "string",
                    format: "date-time",
                  },
                },
              },
            },
          },

          400: {
            description: "Invalid request body",
            type: "object",
            properties: {
              error: {
                type: "string",
              },
              message: {
                type: "string",
              },
              details: {
                type: "object",
              },
            },
          },

          409: {
            description: "Email already exists",
            type: "object",
            properties: {
              error: {
                type: "string",
              },
              message: {
                type: "string",
              },
            },
          },
        },
      },
    },

    async (request, reply) => {
      const result = registerSchema.safeParse(request.body);

      if (!result.success) {
        return reply.status(400).send({
          error: "VALIDATION_ERROR",
          message: "Invalid request body",
          details: result.error.flatten(),
        });
      }

      try {
        const user = await registerUser(result.data);

        return reply.status(201).send({
          data: user,
        });
      } catch (error: any) {
        if (error?.code === "P2002") {
          return reply.status(409).send({
            error: "EMAIL_ALREADY_EXISTS",
            message: "Email already exists",
          });
        }

        throw error;
      }
    },
  );

  // ==========================================
  // POST /auth/login
  // ==========================================
  app.post(
    "/auth/login",
    {
      schema: {
        tags: ["Authentication"],
        summary: "Login user",
        description:
          "Authenticates a user using email and password and returns a JWT access token.",

        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              description: "User's email address",
            },
            password: {
              type: "string",
              minLength: 8,
              description: "User's password",
            },
          },
        },

        response: {
          200: {
            description: "Login successful",
            type: "object",
            properties: {
              data: {
                type: "object",
                properties: {
                  accessToken: {
                    type: "string",
                    description: "JWT access token",
                  },
                },
              },
            },
          },

          400: {
            description: "Invalid request body",
            type: "object",
            properties: {
              error: {
                type: "string",
              },
              message: {
                type: "string",
              },
              details: {
                type: "object",
              },
            },
          },

          401: {
            description: "Invalid email or password",
            type: "object",
            properties: {
              error: {
                type: "string",
              },
              message: {
                type: "string",
              },
            },
          },
        },
      },
    },

    async (request, reply) => {
      const result = loginSchema.safeParse(request.body);

      if (!result.success) {
        return reply.status(400).send({
          error: "VALIDATION_ERROR",
          message: "Invalid request body",
          details: result.error.flatten(),
        });
      }

      const user = await authenticateUser(result.data);

      if (!user) {
        return reply.status(401).send({
          error: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        });
      }

      const token = await app.jwt.sign({
        sub: user.id,
        email: user.email,
      });

      return reply.send({
        data: {
          accessToken: token,
        },
      });
    },
  );
}