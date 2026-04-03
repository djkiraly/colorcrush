"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import { toast } from "sonner";
import { Mail, Phone, MapPin } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const siteConfig = useSiteSettings();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success("Message sent! We'll get back to you soon.");
  };

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
        {/* Contact Info */}
        <div className="space-y-6">
          {[
            { icon: Mail, label: "Email", value: siteConfig.contact.email },
            { icon: Phone, label: "Phone", value: siteConfig.contact.phone },
            { icon: MapPin, label: "Address", value: siteConfig.contact.address },
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

        {/* Form */}
        <div className="lg:col-span-2">
          {submitted ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
              <p className="text-4xl mb-4">💌</p>
              <h3 className="text-xl font-heading font-semibold text-brand-secondary">
                Message Sent!
              </h3>
              <p className="text-brand-text-muted mt-2">
                We&apos;ll get back to you within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" rows={5} required />
              </div>
              <Button type="submit" className="bg-brand-primary hover:bg-brand-primary-hover text-white px-8">
                Send Message
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
