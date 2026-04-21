export const dynamic = "force-dynamic";

import { getSettings } from "@/lib/settings";
import { redirect } from "next/navigation";
import Image from "next/image";
import { MaintenanceVideo } from "@/components/storefront/MaintenanceVideo";
import { parseYouTubeId } from "@/lib/youtube";

export default async function MaintenancePage() {
  const settings = await getSettings();

  if (!settings.maintenanceMode?.enabled) {
    redirect("/");
  }

  const logoUrl = settings.logoUrl || settings.logo;
  const message =
    settings.maintenanceMode?.message ||
    "<p>We're currently performing scheduled maintenance. We'll be back soon!</p>";
  const heading = settings.maintenanceMode?.heading || "We'll Be Back Soon";

  const videoEnabled = settings.maintenanceMode?.videoEnabled;
  const videoId = videoEnabled ? parseYouTubeId(settings.maintenanceMode?.videoUrl ?? "") : null;

  const pageShell = "min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50";

  const logoBlock = logoUrl ? (
    <div className="flex justify-center">
      <Image
        src={logoUrl}
        alt={settings.name}
        width={400}
        height={400}
        className="h-40 md:h-56 w-auto object-contain"
        priority
      />
    </div>
  ) : null;

  const headingBlock = (
    <h1 className="text-3xl md:text-4xl font-heading font-bold text-brand-secondary text-center">
      {heading}
    </h1>
  );

  const brandFooter = (
    <div className="flex items-center justify-center gap-3 text-brand-text-muted">
      <div className="h-px w-12 bg-gray-200" />
      <span className="text-xs uppercase tracking-widest">{settings.name}</span>
      <div className="h-px w-12 bg-gray-200" />
    </div>
  );

  const staticHero = (
    <div className={`${pageShell} flex items-center justify-center px-4`}>
      <div className="max-w-lg w-full text-center space-y-8">
        {logoBlock}
        {headingBlock}
        <div
          className="prose prose-sm mx-auto text-brand-text-secondary [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
          dangerouslySetInnerHTML={{ __html: message }}
        />
        {brandFooter}
      </div>
    </div>
  );

  if (videoId) {
    const videoHero = (
      <div className="pt-10 md:pt-16 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          {logoBlock}
          {headingBlock}
        </div>
      </div>
    );

    return <MaintenanceVideo videoId={videoId} hero={videoHero} staticHero={staticHero} />;
  }

  return staticHero;
}
