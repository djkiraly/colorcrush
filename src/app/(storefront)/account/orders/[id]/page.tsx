"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

export default function OrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${params.id}`);
        const data = await res.json();
        setOrder(data);
      } catch {
        // handle
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-brand-text-muted">Order not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-heading font-bold text-brand-secondary">
            Order {order.orderNumber}
          </h1>
          <p className="text-sm text-brand-text-muted">
            Placed on {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Badge className="capitalize">{order.status}</Badge>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <h2 className="font-heading font-semibold mb-4">Items</h2>
        <div className="space-y-4">
          {order.items?.map((item: any) => (
            <div key={item.id} className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden">
                {item.productImage && (
                  <Image src={item.productImage} alt={item.productName} width={64} height={64} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">{item.productName}</p>
                <p className="text-sm text-brand-text-muted">Qty: {item.quantity}</p>
              </div>
              <p className="font-semibold">${item.totalPrice}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="font-heading font-semibold mb-4">Summary</h2>
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

        {order.trackingNumber && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium">Tracking: {order.trackingCarrier} — {order.trackingNumber}</p>
          </div>
        )}
      </div>
    </div>
  );
}
