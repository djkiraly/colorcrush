"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DataTable } from "@/components/admin/DataTable";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function fetchOrders() {
      const res = await fetch(`/api/orders?page=${page}&limit=20`);
      const data = await res.json();
      setOrders(data.orders || []);
      setTotalPages(data.totalPages || 1);
    }
    fetchOrders();
  }, [page]);

  const columns = [
    { key: "orderNumber", header: "Order #", render: (o: any) => (
      <Link href={`/admin/orders/${o.id}`} className="text-brand-primary hover:underline font-medium">{o.orderNumber}</Link>
    )},
    { key: "userName", header: "Customer" },
    { key: "createdAt", header: "Date", render: (o: any) => new Date(o.createdAt).toLocaleDateString() },
    { key: "total", header: "Total", render: (o: any) => <span className="font-semibold">${o.total}</span> },
    { key: "status", header: "Status", render: (o: any) => <OrderStatusBadge status={o.status} /> },
    { key: "shippingMethod", header: "Shipping", render: (o: any) => <span className="capitalize text-sm">{o.shippingMethod || "—"}</span> },
  ];

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-brand-secondary mb-6">Orders</h1>
      <DataTable
        columns={columns}
        data={orders}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        searchPlaceholder="Search orders..."
      />
    </div>
  );
}
