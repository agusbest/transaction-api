import type { FastifyInstance } from "fastify";
import {
  createUser,
  getUserById,
  getUsers,
} from "./user.service";
import { createUserSchema } from "./user.schema";

export async function userRoutes(app: FastifyInstance) {
 app.post(
  "/users",
  {
    schema: {
      tags: ["Users"],
      summary: "Create a new user",
      description: "Creates a new user account.",
      response: {
        201: {
          description: "User successfully created",
          type: "object",
          properties: {
            data: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                email: { type: "string" },
                balance: { type: "string" },
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
        },
        409: {
          description: "Email already exists",
        },
      },
    },
  },
  async (request, reply) => {
    const result = createUserSchema.safeParse(request.body);

    if (!result.success) {
      return reply.status(400).send({
        error: "ValidationError",
        message: "Invalid request body",
        details: result.error.flatten(),
      });
    }

    const user = await createUser(result.data);

    return reply.status(201).send({
      data: user,
    });
  },
);

  app.get(
    "/users",
    {
      schema: {
        tags: ["Users"],
        summary: "Get all users",
        description: "Returns all registered users.",
        response: {
          200: {
            description: "Users retrieved successfully",
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",

                    },
                    name: {
                      type: "string",

                    },
                    email: {
                      type: "string",

                    },
                    balance: {
                      type: "string",
                      example: "0",
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
          },
          500: {
            description: "Failed to fetch users",
          },
        },
      },
    },
    async (_request, reply) => {
      try {
        const users = await getUsers();

        return reply.send({
          data: users,
        });
      } catch (error) {
        app.log.error(error);

        return reply.status(500).send({
          error: "InternalServerError",
          message: "Failed to fetch users",
        });
      }
    },
  );

  app.get(
    "/users/:id",
    {
      schema: {
        tags: ["Users"],
        summary: "Get user by ID",
        description: "Returns a single user by its ID.",
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",

            },
          },
        },
        response: {
          200: {
            description: "User retrieved successfully",
            type: "object",
            properties: {
              data: {
                type: "object",
                properties: {
                  id: {
                    type: "string",
      
                  },
                  name: {
                    type: "string",
      
                  },
                  email: {
                    type: "string",

                  },
                  balance: {
                    type: "string",

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
          404: {
            description: "User not found",
          },
          500: {
            description: "Failed to fetch user",
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      try {
        const user = await getUserById(id);

        if (!user) {
          return reply.status(404).send({
            error: "NotFound",
            message: "User not found",
          });
        }

        return reply.send({
          data: user,
        });
      } catch (error) {
        app.log.error(error);

        return reply.status(500).send({
          error: "InternalServerError",
          message: "Failed to fetch user",
        });
      }
    },
  );
}

