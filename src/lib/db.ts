import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required")
}

// Using neon-http driver for better compatibility
const sql = neon(connectionString)
export const db = drizzle(sql)