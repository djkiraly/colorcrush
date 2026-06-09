"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import { Trash2, Mail } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const settings = useSiteSettings();
  const canDelete = !!settings.features?.customerDeletion;
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    async function fetchCustomer() {
      const res = await fetch(`/api/customers/${params.id}`);
      const data = await res.json();
      setCustomer(data);
      setLoading(false);
    }
    fetchCustomer();
  }, [params.id]);

  const handleResendVerification = async () => {
    setResending(true);
    try {
      const res = await fetch(
        `/api/admin/customers/${params.id}/resend-verification`,
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
      setResending(false);
    }
  };

  const handleDelete = async () => {
    const orderCount = customer?.orders?.length || 0;
    const confirmText = `delete ${customer.email}`;
    const entered = window.prompt(
      `This will permanently delete ${customer.name} (${customer.email}) and all ${orderCount} of their orders. This cannot be undone.\n\nType "${confirmText}" to confirm:`
    );
    if (entered !== confirmText) {
      if (entered !== null) toast.error("Confirmation text did not match. Cancelled.");
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/customers/${params.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Customer deleted (${data.deletedOrders} orders).`);
        router.push("/admin/customers");
      } else {
        toast.error(data.error || "Failed to delete customer");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  if (!customer) return <p>Customer not found</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-brand-secondary">{customer.name}</h1>
          <p className="text-sm text-brand-text-muted">{customer.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge>Customer</Badge>
          {!customer.emailVerified && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResendVerification}
              disabled={resending}
              className="border-yellow-300 text-yellow-800 hover:bg-yellow-50"
            >
              <Mail className="h-4 w-4 mr-1" />
              {resending ? "Sending…" : "Resend Verification"}
            </Button>
          )}
          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {deleting ? "Deleting…" : "Delete Customer"}
            </Button>
          )}
        </div>
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
                    <p className="text-xs text-brand-text-muted">{formatDateTime(order.createdAt)}</p>
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
