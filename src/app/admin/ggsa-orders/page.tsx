"use client";

import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, Undo2 } from "lucide-react";
import { GGSA_FLAVOR_LABELS, type GgsaFlavor } from "@/lib/validators/ggsa";
import { formatPickupDate } from "@/lib/ggsa-pickup";
import { formatDateTime } from "@/lib/utils";

interface GgsaOrder {
  id: string;
  flavor: string;
  quantity: number;
  totalCents: number;
  contactName: string;
  email: string;
  phone: string;
  status: "pending" | "paid" | "fulfilled";
  pickupDate: string | null;
  createdAt: string;
  [key: string]: unknown;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  paid: "bg-blue-100 text-blue-800 border-blue-200",
  fulfilled: "bg-green-100 text-green-800 border-green-200",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded border px-2 py-0.5 text-xs font-medium capitalize ${
        STATUS_STYLES[status] ?? "bg-gray-100 text-gray-800 border-gray-200"
      }`}
    >
      {status}
    </span>
  );
}

export default function AdminGgsaOrdersPage() {
  const [orders, setOrders] = useState<GgsaOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/admin/ggsa-orders");
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const setStatus = async (id: string, status: "paid" | "fulfilled") => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/ggsa-orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast.success(status === "fulfilled" ? "Marked fulfilled" : "Reverted to paid");
      await fetchOrders();
    } catch {
      toast.error("Update failed");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) =>
      [o.contactName, o.email, o.phone].some((v) => v?.toLowerCase().includes(q))
    );
  }, [orders, query]);

  const paidCount = orders.filter((o) => o.status === "paid").length;

  const columns = [
    {
      key: "createdAt",
      header: "Date/Time",
      render: (o: GgsaOrder) => (
        <span className="text-sm text-brand-text-secondary whitespace-nowrap">
          {formatDateTime(o.createdAt)}
        </span>
      ),
    },
    {
      key: "contactName",
      header: "Customer",
      render: (o: GgsaOrder) => (
        <div className="text-sm">
          <div className="font-medium text-brand-text">{o.contactName}</div>
          <div className="text-brand-text-muted">{o.email}</div>
          <div className="text-brand-text-muted">{o.phone}</div>
        </div>
      ),
    },
    {
      key: "flavor",
      header: "Flavor",
      render: (o: GgsaOrder) =>
        GGSA_FLAVOR_LABELS[o.flavor as GgsaFlavor] ?? o.flavor,
    },
    {
      key: "quantity",
      header: "Qty",
      render: (o: GgsaOrder) => o.quantity,
    },
    {
      key: "totalCents",
      header: "Total",
      render: (o: GgsaOrder) => `$${(o.totalCents / 100).toFixed(2)}`,
    },
    {
      key: "pickupDate",
      header: "Pickup",
      render: (o: GgsaOrder) =>
        o.pickupDate ? (
          <span className="text-sm">{formatPickupDate(new Date(o.pickupDate))}</span>
        ) : (
          <span className="text-brand-text-muted">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (o: GgsaOrder) => <StatusBadge status={o.status} />,
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-brand-secondary">
          GGSA Orders
        </h1>
        <p className="text-sm text-brand-text-muted mt-1">
          Team Sweet Bag orders for concession-stand pickup.
          {paidCount > 0 && (
            <span className="ml-1 font-medium text-brand-text">
              {paidCount} awaiting fulfillment.
            </span>
          )}
        </p>
      </div>

      {loading ? (
        <p className="text-brand-text-muted">Loading…</p>
      ) : (
        <DataTable<GgsaOrder>
          columns={columns}
          data={filtered}
          searchPlaceholder="Search name, email, phone…"
          onSearch={setQuery}
          actions={(o) =>
            o.status === "paid" ? (
              <Button
                size="sm"
                onClick={() => setStatus(o.id, "fulfilled")}
                disabled={updatingId === o.id}
                className="bg-[#7B2D8E] hover:bg-[#6A2479] text-white"
              >
                <Check className="h-4 w-4 mr-1" />
                Fulfill
              </Button>
            ) : o.status === "fulfilled" ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setStatus(o.id, "paid")}
                disabled={updatingId === o.id}
              >
                <Undo2 className="h-4 w-4 mr-1" />
                Undo
              </Button>
            ) : (
              <span className="text-xs text-brand-text-muted">Unpaid</span>
            )
          }
        />
      )}
    </div>
  );
}
