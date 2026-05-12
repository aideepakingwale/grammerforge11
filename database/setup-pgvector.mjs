import { PrismaClient } from "@prisma/client";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const prisma = new PrismaClient();
const currentDir = dirname(fileURLToPath(import.meta.url));
const sql = await readFile(join(currentDir, "sql", "enable-pgvector.sql"), "utf8");

try {
  for (const statement of sql.split(/;\s*(?:\r?\n|$)/).map((item) => item.trim()).filter(Boolean)) {
    await prisma.$executeRawUnsafe(statement);
  }
  console.log("pgvector question embedding infrastructure is ready.");
} finally {
  await prisma.$disconnect();
}
