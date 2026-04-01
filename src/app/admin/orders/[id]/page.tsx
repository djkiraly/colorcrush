"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Image from "next/image";

const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"];

export default function AdminOrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingCarrier, setTrackingCarrier] = useState("");
  const [notes, setNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      const res = await fetch(`/api/orders/${params.id}`);
      const data = await res.json();
      setOrder(data);
      setNewStatus(data.status);
      setTrackingNumber(data.trackingNumber || "");
      setTrackingCarrier(data.trackingCarrier || "");
      setNotes(data.notes || "");
      setLoading(false);
    }
    fetchOrder();
  }, [params.id]);

  const handleUpdateStatus = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${params.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, trackingNumber, trackingCarrier, notes }),
      });
      if (res.ok) {
        toast.success("Order updated!");
        const data = await res.json();
        setOrder({ ...order, ...data });
      } else {
        toast.error("Failed to update");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-64 w-full" /></div>;
  if (!order) return <p>Order not found</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-brand-secondary">
            Order {order.orderNumber}
          </h1>
          <p className="text-sm text-brand-text-muted">
            {new Date(order.createdAt).toLocaleString()} | {order.user?.name} ({order.user?.email})
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-heading font-semibold mb-4">Items</h2>
            <div className="space-y-3">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex items-center gap-4 py-2 border-b last:border-0">
                  <div className="w-12 h-12 rounded bg-gray-100 overflow-hidden">
                    {item.productImage && <Image src={item.productImage} alt="" width={48} height={48} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.productName}</p>
                    <p className="text-xs text-brand-text-muted">Qty: {item.quantity} x ${item.unitPrice}</p>
                  </div>
                  <p className="font-semibold">${item.totalPrice}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Financials */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-heading font-semibold mb-4">Financial Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>${order.subtotal}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>${order.shippingCost}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>${order.taxAmount}</span></div>
              {parseFloat(order.discountAmount) > 0 && (
                <div className="flex justify-between text-brand-success"><span>Discount</span><span>-${order.discountAmount}</span></div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span><span className="text-brand-primary">${order.total}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-heading font-semibold mb-4">Status Timeline</h2>
            <div className="space-y-4">
              {ORDER_STATUSES.slice(0, ORDER_STATUSES.indexOf(order.status) + 1).map((s, i) => (
                <div key={s} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${s === order.status ? "bg-brand-primary" : "bg-gray-300"}`} />
                  <span className={`text-sm capitalize ${s === order.status ? "font-semibold text-brand-primary" : "text-brand-text-muted"}`}>
                    {s}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="font-heading font-semibold">Update Order</h2>
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize">{s}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Tracking Number</Label>
              <Input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Carrier</Label>
              <Input value={trackingCarrier} onChange={(e) => setTrackingCarrier(e.target.value)} placeholder="UPS, FedEx, USPS..." />
            </div>
            <div className="space-y-2">
              <Label>Admin Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
            <Button onClick={handleUpdateStatus} disabled={updating} className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white">
              {updating ? "Updating..." : "Update Order"}
            </Button>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="font-heading font-semibold mb-3">Shipping Address</h2>
              <div className="text-sm text-brand-text-secondary">
                <p>{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
              </div>
            </div>
          )}

          {order.giftMessage && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="font-heading font-semibold mb-3">Gift Message</h2>
              <p className="text-sm text-brand-text-secondary italic">&quot;{order.giftMessage}&quot;</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
