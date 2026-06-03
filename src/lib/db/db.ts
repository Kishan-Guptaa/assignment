/**
 * db.ts — Production Neon + Drizzle ORM configuration for Next.js 15.
 *
 * WHY THE PREVIOUS APPROACH CRASHED:
 *   The `ws` Node.js package uses a native binary addon (bufferUtil) for
 *   performance. When webpack bundles `ws` into the Next.js action bundle,
 *   it strips native addons — leaving bufferUtil as an empty object.
 *   Result: "TypeError: bufferUtil.mask is not a function".
 *
 *   FIX 1 (next.config.ts): Added `serverExternalPackages: ["ws", "@neondatabase/serverless"]`
 *   so webpack skips bundling them. Node.js requires them natively at runtime.
 *
 *   FIX 2 (here): Use neon() HTTP driver for all standard queries.
 *   For transactions, create a Pool on-demand (per-transaction) rather than
 *   module-level, preventing stale WebSocket connections in serverless.
 *
 * PRODUCTION STRATEGY:
 *   - neon() HTTP for reads and simple writes (fast, stateless, no WS overhead)
 *   - Pool (WebSocket) only when db.transaction() is called — created fresh,
 *     used, then the connection is returned automatically by the Pool.
 *   - Both use drizzle-orm/neon-serverless which supports BOTH adapters.
 */

import { neon, Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

// Tell @neondatabase/serverless to use the `ws` package as the WebSocket
// constructor when running in Node.js (Next.js server environment).
// This is safe because next.config.ts marks "ws" as serverExternalPackages,
// so Node.js loads the real native binary — not a webpack-bundled fake.
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL environment variable is not set. " +
      "Add it to .env.local for development or your deployment environment variables."
  );
}

// Pool for transactional operations (uses WebSocket connection).
// max: 1 is correct for serverless — each function invocation is short-lived.
const pool = new Pool({ connectionString, max: 1 });

// Primary db instance backed by the Pool.
// Supports both .select()/.insert()/.update()/.delete() AND db.transaction().
export const db = drizzle(pool, { schema });

// Export pool for advanced usage (e.g. pool.end() in test teardown).
export { pool };
