"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DataTable } from "@/components/admin/DataTable";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function fetch_() {
      const res = await fetch(`/api/customers?page=${page}&limit=20`);
      const data = await res.json();
      setCustomers(data.customers || []);
      setTotalPages(data.totalPages || 1);
    }
    fetch_();
  }, [page]);

  const columns = [
    { key: "name", header: "Name", render: (c: any) => (
      <Link href={`/admin/customers/${c.id}`} className="text-brand-primary hover:underline font-medium">{c.name}</Link>
    )},
    { key: "email", header: "Email" },
    { key: "createdAt", header: "Joined", render: (c: any) => new Date(c.createdAt).toLocaleDateString() },
    { key: "totalOrders", header: "Orders", render: (c: any) => c.totalOrders || 0 },
    { key: "totalSpent", header: "Total Spent", render: (c: any) => `$${Number(c.totalSpent || 0).toFixed(2)}` },
  ];

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-brand-secondary mb-6">Customers</h1>
      <DataTable columns={columns} data={customers} page={page} totalPages={totalPages} onPageChange={setPage} searchPlaceholder="Search customers..." />
    </div>
  );
}
