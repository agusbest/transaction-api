import type { FastifyInstance } from "fastify";
import {
  createUser,
  getUserById,
  getUsers,
} from "./user.service";
import { createUserSchema } from "./user.schema";

export async function userRoutes(app: FastifyInstance) {
 app.post("/users", async (request, reply) => {
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
});

  app.get("/users", async (_request, reply) => {
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
  });

  app.get("/users/:id", async (request, reply) => {
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
  });
}