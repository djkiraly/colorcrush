"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DataTable } from "@/components/admin/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { toast } from "sonner";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [resendingId, setResendingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetch_() {
      const res = await fetch(`/api/customers?page=${page}&limit=20`);
      const data = await res.json();
      setCustomers(data.customers || []);
      setTotalPages(data.totalPages || 1);
    }
    fetch_();
  }, [page]);

  const handleResendVerification = async (
    e: React.MouseEvent,
    customer: any
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setResendingId(customer.id);
    try {
      const res = await fetch(
        `/api/admin/customers/${customer.id}/resend-verification`,
        { method: "POST" }
      );
      const data = await res.json();
      if (res.ok) {
        toast.success(`Verification email sent to ${customer.email}`);
      } else {
        toast.error(data.error || "Failed to send verification email");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setResendingId(null);
    }
  };

  const columns = [
    { key: "name", header: "Name", render: (c: any) => (
      <Link href={`/admin/customers/${c.id}`} className="text-brand-primary hover:underline font-medium">{c.name}</Link>
    )},
    { key: "email", header: "Email" },
    { key: "verified", header: "Verified", render: (c: any) => (
      c.emailVerified ? (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Verified</Badge>
      ) : (
        <Badge variant="secondary">Unverified</Badge>
      )
    )},
    { key: "createdAt", header: "Joined", render: (c: any) => new Date(c.createdAt).toLocaleDateString() },
    { key: "totalOrders", header: "Orders", render: (c: any) => Number(c.totalOrders ?? 0) },
    { key: "totalSpent", header: "Total Spent", render: (c: any) => `$${Number(c.totalSpent ?? 0).toFixed(2)}` },
    { key: "actions", header: "Actions", render: (c: any) => (
      c.emailVerified ? (
        <span className="text-muted-foreground text-xs">—</span>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => handleResendVerification(e, c)}
          disabled={resendingId === c.id}
        >
          <Mail className="h-3.5 w-3.5 mr-1.5" />
          {resendingId === c.id ? "Sending..." : "Resend"}
        </Button>
      )
    )},
  ];

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-brand-secondary mb-6">Customers</h1>
      <DataTable columns={columns} data={customers} page={page} totalPages={totalPages} onPageChange={setPage} searchPlaceholder="Search customers..." />
    </div>
  );
}
