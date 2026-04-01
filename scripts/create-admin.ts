import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/lib/db/schema";
import bcrypt from "bcryptjs";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function createAdmin() {
  const email = process.argv[2] || "admin@sweethaven.com";
  const password = process.argv[3] || "admin123";
  const name = process.argv[4] || "Admin";

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(schema.users)
    .values({
      email,
      name,
      passwordHash,
      role: "super_admin",
      emailVerified: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.users.email,
      set: { passwordHash, role: "super_admin", name },
    })
    .returning();

  console.log(`Admin user created/updated: ${user.email} (${user.role})`);
}

createAdmin().catch(console.error);
