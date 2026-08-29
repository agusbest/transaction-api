import fp from "fastify-plugin";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";

export default fp(async (app) => {
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: "Transaction API",
        description:
          "Backend API for secure money transfer transactions.",
        version: "1.0.0",
      },
      servers: [
        {
          url: "http://localhost:3000",
          description: "Local development server",
        },
      ],
      tags: [
        {
          name: "Health",
          description: "Application health check",
        },
        {
          name: "Authentication",
          description: "Authentication endpoints",
        },
        {
          name: "Users",
          description: "User endpoints",
        },
        {
          name: "Transactions",
          description: "Transaction endpoints",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: "/docs",
  });
});