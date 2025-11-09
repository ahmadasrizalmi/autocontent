import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

// Detect database type from connection string
const isSQLite = connectionString.startsWith('file:') || connectionString.endsWith('.db');
const dialect = isSQLite ? 'sqlite' : 'mysql';

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: dialect as any,
  dbCredentials: isSQLite 
    ? { url: connectionString.replace('file:', '') }
    : { url: connectionString },
});
