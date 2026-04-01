"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { Badge } from "@/components/ui/badge";

export default function AdminEmailsPage() {
  const [emails, setEmails] = useState<any[]>([]);

  useEffect(() => {
    async function fetchEmails() {
      const res = await fetch("/api/email/log");
      const data = await res.json();
      setEmails(data.emails || []);
    }
    fetchEmails();
  }, []);

  const columns = [
    { key: "to", header: "To" },
    { key: "subject", header: "Subject" },
    { key: "templateName", header: "Template" },
    {
      key: "status", header: "Status",
      render: (e: any) => (
        <Badge className={e.status === "sent" ? "bg-green-100 text-green-800" : e.status === "failed" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}>
          {e.status}
        </Badge>
      ),
    },
    { key: "sentAt", header: "Sent At", render: (e: any) => e.sentAt ? new Date(e.sentAt).toLocaleString() : "—" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-brand-secondary mb-6">Email Log</h1>
      <DataTable columns={columns} data={emails} searchPlaceholder="Search emails..." />
    </div>
  );
}
