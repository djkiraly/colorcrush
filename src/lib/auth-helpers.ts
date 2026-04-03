import { auth } from "@/lib/auth";

type SessionUser = { id?: string; role?: string };

export function getUserRole(session: { user?: SessionUser } | null): string | null {
  return (session?.user as SessionUser)?.role || null;
}

export function isAdmin(session: { user?: SessionUser } | null): boolean {
  const role = getUserRole(session);
  return role === "admin" || role === "super_admin";
}

export function isSuperAdmin(session: { user?: SessionUser } | null): boolean {
  return getUserRole(session) === "super_admin";
}

export async function getAuthSession() {
  return await auth();
}
