"use client";

import { useEffect, useState, useCallback } from "react";
import { StatsCard } from "@/components/admin/StatsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DollarSign,
  CreditCard,
  ArrowDownCircle,
  TrendingUp,
  Eye,
  RotateCcw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Payment {
  [key: string]: unknown;
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  description: string | null;
  receiptEmail: string | null;
  paymentMethod: string;
  metadata: Record<string, string>;
  amountRefunded: number;
  latestCharge: string | null;
}

interface PaymentDetail extends Payment {
  chargeId: string | null;
  receiptUrl: string | null;
  fee: number;
  net: number;
  refunds: {
    id: string;
    amount: number;
    status: string;
    reason: string | null;
    created: number;
  }[];
}

interface BalanceStats {
  available: number;
  pending: number;
  totalRevenue30d: number;
  totalRefunds30d: number;
  transactionCount30d: number;
  currency: string;
}

const STATUS_COLORS: Record<string, string> = {
  succeeded: "bg-green-100 text-green-800",
  processing: "bg-yellow-100 text-yellow-800",
  requires_payment_method: "bg-orange-100 text-orange-800",
  requires_confirmation: "bg-orange-100 text-orange-800",
  requires_action: "bg-orange-100 text-orange-800",
  canceled: "bg-gray-100 text-gray-800",
  requires_capture: "bg-blue-100 text-blue-800",
};

function formatCurrency(amount: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function formatDate(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<BalanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [pageHistory, setPageHistory] = useState<string[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [lastId, setLastId] = useState<string | null>(null);

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<PaymentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Refund dialog
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundPayment, setRefundPayment] = useState<Payment | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundSubmitting, setRefundSubmitting] = useState(false);

  const fetchPayments = useCallback(async (startingAfter?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "25" });
      if (startingAfter) params.set("starting_after", startingAfter);
      const res = await fetch(`/api/admin/payments?${params}`);
      const data = await res.json();
      setPayments(data.payments || []);
      setHasMore(data.hasMore ?? false);
      setLastId(data.lastId ?? null);
    } catch {
      setPayments([]);
      setHasMore(false);
    }
    setLoading(false);
  }, []);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/admin/payments/balance");
      const data = await res.json();
      setStats(data);
    } catch {
      // Stats are non-critical
    }
    setStatsLoading(false);
  }, []);

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, [fetchPayments, fetchStats]);

  const nextPage = () => {
    if (lastId) {
      setPageHistory((prev) => [...prev, payments[0]?.id || ""]);
      fetchPayments(lastId);
    }
  };

  const prevPage = () => {
    const prev = [...pageHistory];
    prev.pop();
    setPageHistory(prev);
    // Re-fetch from beginning if going back to first page
    if (prev.length === 0) {
      fetchPayments();
    } else {
      fetchPayments(prev[prev.length - 1]);
    }
  };

  const openDetail = async (paymentId: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    const res = await fetch(`/api/admin/payments/${paymentId}`);
    const data = await res.json();
    setDetail(data.payment);
    setDetailLoading(false);
  };

  const openRefund = (payment: Payment) => {
    setRefundPayment(payment);
    const remainingCents = payment.amount - payment.amountRefunded;
    setRefundAmount((remainingCents / 100).toFixed(2));
    setRefundReason("");
    setRefundOpen(true);
  };

  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundPayment) return;
    setRefundSubmitting(true);

    const res = await fetch(`/api/admin/payments/${refundPayment.id}/refund`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: parseFloat(refundAmount),
        reason: refundReason || undefined,
      }),
    });

    if (res.ok) {
      toast.success("Refund issued successfully");
      setRefundOpen(false);
      fetchPayments();
      fetchStats();
      // Refresh detail if open
      if (detailOpen && detail?.id === refundPayment.id) {
        openDetail(refundPayment.id);
      }
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to issue refund");
    }
    setRefundSubmitting(false);
  };

  const currency = stats?.currency || "usd";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-brand-secondary">
          Payments
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          label="Available Balance"
          value={statsLoading ? "..." : formatCurrency(stats?.available ?? 0, currency)}
          icon={DollarSign}
          color="bg-green-50"
        />
        <StatsCard
          label="Pending Balance"
          value={statsLoading ? "..." : formatCurrency(stats?.pending ?? 0, currency)}
          icon={CreditCard}
          color="bg-blue-50"
        />
        <StatsCard
          label="Revenue (30d)"
          value={statsLoading ? "..." : formatCurrency(stats?.totalRevenue30d ?? 0, currency)}
          change={statsLoading ? undefined : `${stats?.transactionCount30d ?? 0} transactions`}
          changeType="neutral"
          icon={TrendingUp}
          color="bg-purple-50"
        />
        <StatsCard
          label="Refunds (30d)"
          value={statsLoading ? "..." : formatCurrency(stats?.totalRefunds30d ?? 0, currency)}
          icon={ArrowDownCircle}
          color="bg-red-50"
        />
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50/50">
              <th className="text-left px-4 py-3 text-sm font-medium text-brand-text-secondary">Amount</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-brand-text-secondary">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-brand-text-secondary">Customer</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-brand-text-secondary">Order</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-brand-text-secondary">Date</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-brand-text-secondary w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-brand-text-muted">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                  Loading payments...
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-brand-text-muted">
                  No payments found
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <span className="font-semibold">
                      {formatCurrency(p.amount, p.currency)}
                    </span>
                    {p.amountRefunded > 0 && (
                      <span className="text-xs text-red-600 ml-1">
                        ({formatCurrency(p.amountRefunded, p.currency)} refunded)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={STATUS_COLORS[p.status] || "bg-gray-100 text-gray-800"}>
                      {formatStatus(p.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-brand-text-secondary">
                    {p.receiptEmail || p.metadata?.userId?.slice(0, 8) || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {p.metadata?.orderNumber ? (
                      <span className="font-mono text-xs">{p.metadata.orderNumber}</span>
                    ) : (
                      <span className="text-brand-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-brand-text-secondary">
                    {formatDate(p.created)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetail(p.id)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {p.status === "succeeded" && p.amountRefunded < p.amount && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openRefund(p)}
                          title="Refund"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-brand-text-muted">
          Showing {payments.length} payments
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pageHistory.length === 0}
            onClick={prevPage}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasMore}
            onClick={nextPage}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Payment Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          {detailLoading || !detail ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-brand-text-muted">Amount</p>
                  <p className="text-lg font-bold">
                    {formatCurrency(detail.amount, detail.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-brand-text-muted">Status</p>
                  <Badge className={STATUS_COLORS[detail.status] || "bg-gray-100 text-gray-800"}>
                    {formatStatus(detail.status)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-brand-text-muted">Stripe Fee</p>
                  <p className="font-medium">{formatCurrency(detail.fee, detail.currency)}</p>
                </div>
                <div>
                  <p className="text-sm text-brand-text-muted">Net</p>
                  <p className="font-medium">{formatCurrency(detail.net, detail.currency)}</p>
                </div>
                <div>
                  <p className="text-sm text-brand-text-muted">Date</p>
                  <p className="text-sm">{formatDate(detail.created)}</p>
                </div>
                <div>
                  <p className="text-sm text-brand-text-muted">Customer</p>
                  <p className="text-sm">{detail.receiptEmail || "—"}</p>
                </div>
              </div>

              {detail.metadata && Object.keys(detail.metadata).length > 0 && (
                <div>
                  <p className="text-sm text-brand-text-muted mb-1">Metadata</p>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                    {Object.entries(detail.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-brand-text-muted">{key}</span>
                        <span className="font-mono">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detail.refunds.length > 0 && (
                <div>
                  <p className="text-sm text-brand-text-muted mb-2">Refunds</p>
                  <div className="space-y-2">
                    {detail.refunds.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between bg-red-50 rounded-lg p-3 text-sm"
                      >
                        <div>
                          <span className="font-medium">
                            {formatCurrency(r.amount, detail.currency)}
                          </span>
                          {r.reason && (
                            <span className="text-brand-text-muted ml-2">
                              ({r.reason.replace(/_/g, " ")})
                            </span>
                          )}
                        </div>
                        <span className="text-brand-text-muted">
                          {formatDate(r.created)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {detail.receiptUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(detail.receiptUrl!, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" /> Receipt
                  </Button>
                )}
                {detail.status === "succeeded" &&
                  detail.amountRefunded < detail.amount && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDetailOpen(false);
                        openRefund(detail as unknown as Payment);
                      }}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" /> Issue Refund
                    </Button>
                  )}
              </div>

              <p className="text-xs text-brand-text-muted font-mono break-all">
                {detail.id}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Refund</DialogTitle>
          </DialogHeader>
          {refundPayment && (
            <form onSubmit={handleRefund} className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-brand-text-muted">Original Amount</span>
                  <span className="font-medium">
                    {formatCurrency(refundPayment.amount, refundPayment.currency)}
                  </span>
                </div>
                {refundPayment.amountRefunded > 0 && (
                  <div className="flex justify-between mb-1">
                    <span className="text-brand-text-muted">Already Refunded</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(refundPayment.amountRefunded, refundPayment.currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-1 mt-1">
                  <span className="text-brand-text-muted">Refundable</span>
                  <span className="font-bold">
                    {formatCurrency(
                      refundPayment.amount - refundPayment.amountRefunded,
                      refundPayment.currency
                    )}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Refund Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={((refundPayment.amount - refundPayment.amountRefunded) / 100).toFixed(2)}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  required
                />
                <p className="text-xs text-brand-text-muted">
                  Leave as-is for a full refund, or enter a smaller amount for a partial refund.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Reason (optional)</Label>
                <select
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">No reason specified</option>
                  <option value="duplicate">Duplicate charge</option>
                  <option value="fraudulent">Fraudulent</option>
                  <option value="requested_by_customer">Requested by customer</option>
                </select>
              </div>

              <Button
                type="submit"
                disabled={refundSubmitting}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                {refundSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" /> Issue Refund
                  </>
                )}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
