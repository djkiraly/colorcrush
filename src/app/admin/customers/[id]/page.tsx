"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import Link from "next/link";

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCustomer() {
      const res = await fetch(`/api/customers/${params.id}`);
      const data = await res.json();
      setCustomer(data);
      setLoading(false);
    }
    fetchCustomer();
  }, [params.id]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  if (!customer) return <p>Customer not found</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-brand-secondary">{customer.name}</h1>
          <p className="text-sm text-brand-text-muted">{customer.email}</p>
        </div>
        <Badge className="capitalize">{customer.role}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-heading font-semibold mb-4">Profile</h2>
          <div className="space-y-3 text-sm">
            <div><span className="text-brand-text-muted">Name:</span> {customer.name}</div>
            <div><span className="text-brand-text-muted">Email:</span> {customer.email}</div>
            <div><span className="text-brand-text-muted">Phone:</span> {customer.phone || "N/A"}</div>
            <div><span className="text-brand-text-muted">Joined:</span> {new Date(customer.createdAt).toLocaleDateString()}</div>
            <div><span className="text-brand-text-muted">Total Orders:</span> {customer.orders?.length || 0}</div>
          </div>
        </div>

        {/* Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-heading font-semibold mb-4">Order History</h2>
          <div className="space-y-3">
            {(customer.orders || []).length === 0 ? (
              <p className="text-brand-text-muted text-sm text-center py-4">No orders</p>
            ) : (
              customer.orders.map((order: any) => (
                <Link key={order.id} href={`/admin/orders/${order.id}`} className="flex items-center justify-between py-2 hover:bg-gray-50 rounded px-2 -mx-2">
                  <div>
                    <p className="text-sm font-medium">{order.orderNumber}</p>
                    <p className="text-xs text-brand-text-muted">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <OrderStatusBadge status={order.status} />
                    <span className="text-sm font-semibold">${order.total}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
