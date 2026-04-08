import { defineConfig, env } from "prisma/config";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    // Use the direct (unpooled) connection for migrations — Neon's pooled
    // connection goes through PgBouncer which doesn't support the advisory
    // locks that `prisma migrate deploy` requires.
    url: env("DATABASE_URL_UNPOOLED"),
  },
});
