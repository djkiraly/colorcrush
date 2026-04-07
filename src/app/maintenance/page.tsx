export const dynamic = "force-dynamic";

import { getSettings } from "@/lib/settings";
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function MaintenancePage() {
  const settings = await getSettings();

  if (!settings.maintenanceMode?.enabled) {
    redirect("/");
  }

  const logoUrl = settings.logoUrl || settings.logo;
  const message =
    settings.maintenanceMode?.message ||
    "<p>We're currently performing scheduled maintenance. We'll be back soon!</p>";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4">
      <div className="max-w-lg w-full text-center space-y-8">
        {logoUrl && (
          <div className="flex justify-center">
            <Image
              src={logoUrl}
              alt={settings.name}
              width={200}
              height={200}
              className="h-32 w-auto object-contain"
              priority
            />
          </div>
        )}

        <div className="space-y-2">
          <h1 className="text-3xl font-heading font-bold text-brand-secondary">
            We&apos;ll Be Back Soon
          </h1>
        </div>

        <div
          className="prose prose-sm mx-auto text-brand-text-secondary [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
          dangerouslySetInnerHTML={{ __html: message }}
        />

        <div className="flex items-center justify-center gap-3 text-brand-text-muted">
          <div className="h-px w-12 bg-gray-200" />
          <span className="text-xs uppercase tracking-widest">
            {settings.name}
          </span>
          <div className="h-px w-12 bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
