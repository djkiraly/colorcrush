import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { VerificationGate } from "@/components/storefront/VerificationGate";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?next=/account");
  }

  // Read fresh from DB rather than trusting the JWT — JWTs are cached
  // and the user may have just verified in another tab.
  const [u] = await db
    .select({
      email: users.email,
      emailVerified: users.emailVerified,
      isGuest: users.isGuest,
    })
    .from(users)
    .where(eq(users.id, session.user.id!))
    .limit(1);

  if (!u) {
    redirect("/login?next=/account");
  }

  // Hard gate: customer accounts (not guest stubs) must verify before viewing
  // any /account/* page. Guests are already locked out of /account by the
  // session check above (guests don't get sessions).
  if (!u.emailVerified && !u.isGuest) {
    return <VerificationGate email={u.email} />;
  }

  return <>{children}</>;
}
