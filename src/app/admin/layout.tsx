import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { SiteSettingsProvider } from "@/components/providers/SiteSettingsProvider";
import { getSettings } from "@/lib/settings";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "admin" && role !== "super_admin") {
    redirect("/");
  }

  const settings = await getSettings();

  return (
    <SessionProvider>
      <SiteSettingsProvider settings={settings}>
        <div className="flex h-screen overflow-hidden">
          <AdminSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <AdminTopbar />
            <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
              {children}
            </main>
          </div>
        </div>
      </SiteSettingsProvider>
    </SessionProvider>
  );
}
