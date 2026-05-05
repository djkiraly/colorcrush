import type { Metadata } from "next";
import { Mail, Phone, MapPin } from "lucide-react";
import { getSettings } from "@/lib/settings";
import ContactForm from "./ContactForm";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const title = "Contact Us";
  const description = `Get in touch with ${settings.name} for product questions, bulk orders, custom gifts, or wholesale inquiries.`;
  return {
    title,
    description,
    alternates: { canonical: "/contact" },
    openGraph: { type: "website", title, description, url: "/contact" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ContactPage() {
  const settings = await getSettings();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-heading font-bold text-brand-secondary mb-6 text-center">
        Contact Us
      </h1>
      <p className="text-brand-text-secondary text-center mb-12 max-w-xl mx-auto">
        Have a question? We&apos;d love to hear from you. Send us a message and we&apos;ll
        respond as soon as possible.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="space-y-6">
          {[
            { icon: Mail, label: "Email", value: settings.contact.email },
            { icon: Phone, label: "Phone", value: settings.contact.phone },
            { icon: MapPin, label: "Address", value: settings.contact.address },
          ].map((item) => (
            <div key={item.label} className="flex gap-4">
              <div className="p-3 rounded-lg bg-brand-primary/10 h-fit">
                <item.icon className="h-5 w-5 text-brand-primary" />
              </div>
              <div>
                <p className="font-medium text-brand-text">{item.label}</p>
                <p className="text-sm text-brand-text-secondary">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
