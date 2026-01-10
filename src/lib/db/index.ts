import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Only create the connection if DATABASE_URL exists (skip during build)
const connectionString = process.env.DATABASE_URL;

// Create postgres client with connection pooling settings
const queryClient = connectionString
  ? postgres(connectionString, {
      max: 10, // Maximum connections in pool
      idle_timeout: 20, // Close idle connections after 20 seconds
      connect_timeout: 10, // Timeout connection attempts after 10 seconds
    })
  : null;

// Create drizzle instance - may be null during build
export const db = queryClient ? drizzle(queryClient, { schema }) : null;

// Export schema for convenience
export * from "./schema";
