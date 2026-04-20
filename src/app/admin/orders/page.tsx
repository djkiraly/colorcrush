"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DataTable } from "@/components/admin/DataTable";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { Send, Loader2, XCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sendingReceipt, setSendingReceipt] = useState<string | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<string | null>(null);

  const deleteOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Delete order ${orderNumber}? This cannot be undone.`)) return;
    setDeletingOrder(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Order deleted");
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to delete order");
      }
    } catch {
      toast.error("Failed to delete order");
    } finally {
      setDeletingOrder(null);
    }
  };

  const cancelOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setCancellingOrder(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled", cancelReason: "Cancelled by admin" }),
      });
      if (res.ok) {
        toast.success("Order cancelled");
        setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "cancelled" } : o));
      } else {
        toast.error("Failed to cancel order");
      }
    } catch {
      toast.error("Failed to cancel order");
    } finally {
      setCancellingOrder(null);
    }
  };

  const resendReceipt = async (orderId: string) => {
    setSendingReceipt(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/resend-receipt`, { method: "POST" });
      if (res.ok) {
        toast.success("Receipt sent");
      } else {
        toast.error("Failed to send receipt");
      }
    } catch {
      toast.error("Failed to send receipt");
    } finally {
      setSendingReceipt(null);
    }
  };

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
    { key: "createdAt", header: "Date/Time", render: (o: any) => new Date(o.createdAt).toLocaleString() },
    { key: "itemCount", header: "Item Count", render: (o: any) => Number(o.itemCount || 0) },
    { key: "total", header: "Total", render: (o: any) => <span className="font-semibold">${o.total}</span> },
    { key: "status", header: "Status", render: (o: any) => <OrderStatusBadge status={o.status} /> },
    { key: "shippingMethod", header: "Shipping", render: (o: any) => <span className="capitalize text-sm">{o.shippingMethod || "—"}</span> },
    { key: "actions", header: "Actions", render: (o: any) => {
      const isFinal = ["cancelled", "refunded"].includes(o.status);
      return (
        <div className="flex items-center gap-1">
          <button
            onClick={() => resendReceipt(o.id)}
            disabled={sendingReceipt === o.id}
            className="p-2 rounded hover:bg-gray-100 text-brand-text-muted hover:text-brand-primary transition-colors disabled:opacity-50"
            title="Resend receipt"
          >
            {sendingReceipt === o.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
          <button
            onClick={() => cancelOrder(o.id)}
            disabled={isFinal || cancellingOrder === o.id}
            className="p-2 rounded hover:bg-red-50 text-brand-text-muted hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title={isFinal ? "Order already " + o.status : "Cancel order"}
          >
            {cancellingOrder === o.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
          </button>
          {o.status === "cancelled" && (
            <button
              onClick={() => deleteOrder(o.id, o.orderNumber)}
              disabled={deletingOrder === o.id}
              className="p-2 rounded hover:bg-red-50 text-brand-text-muted hover:text-red-600 transition-colors disabled:opacity-50"
              title="Delete order"
            >
              {deletingOrder === o.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </button>
          )}
        </div>
      );
    }},
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
