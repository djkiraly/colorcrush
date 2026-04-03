import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/lib/email-notifications";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .limit(1);

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || "customer";
        // Record last login
        if (user.id) {
          db.update(users)
            .set({ lastLoginAt: new Date() })
            .where(eq(users.id, user.id))
            .catch(() => {});
        }
      }
      // Refresh emailVerified from DB on every token refresh
      if (token.id) {
        const [u] = await db.select({ emailVerified: users.emailVerified }).from(users).where(eq(users.id, token.id as string)).limit(1);
        token.emailVerified = u?.emailVerified?.toISOString() || null;
      }
      if (account?.provider === "google") {
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, token.email!))
          .limit(1);

        if (existingUser) {
          token.id = existingUser.id;
          token.role = existingUser.role;
        } else {
          const [newUser] = await db
            .insert(users)
            .values({
              email: token.email!,
              name: token.name || "User",
              role: "customer",
              emailVerified: new Date(),
              avatarUrl: token.picture,
            })
            .returning();
          token.id = newUser.id;
          token.role = newUser.role;
          // Send welcome email (fire-and-forget)
          sendWelcomeEmail(newUser.id, newUser.email, newUser.name).catch(() => {});
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { emailVerified?: string | null }).emailVerified = token.emailVerified as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
});
