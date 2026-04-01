"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/storefront/StarRating";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);

  const fetchReviews = async () => {
    const res = await fetch("/api/reviews");
    const data = await res.json();
    setReviews(data.reviews || []);
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleApprove = async (id: string, approve: boolean) => {
    const res = await fetch(`/api/reviews/${id}/approve`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved: approve }),
    });
    if (res.ok) {
      toast.success(approve ? "Review approved!" : "Review rejected!");
      fetchReviews();
    }
  };

  const columns = [
    { key: "productName", header: "Product" },
    { key: "userName", header: "Customer" },
    { key: "rating", header: "Rating", render: (r: any) => <StarRating rating={r.rating} size={14} /> },
    { key: "title", header: "Title", render: (r: any) => <span className="line-clamp-1">{r.title || "—"}</span> },
    {
      key: "isApproved", header: "Status",
      render: (r: any) => <Badge className={r.isApproved ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>{r.isApproved ? "Approved" : "Pending"}</Badge>,
    },
    { key: "createdAt", header: "Date", render: (r: any) => new Date(r.createdAt).toLocaleDateString() },
  ];

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-brand-secondary mb-6">Reviews</h1>
      <DataTable
        columns={columns}
        data={reviews}
        searchPlaceholder="Search reviews..."
        actions={(r: any) => (
          <div className="flex gap-1">
            {!r.isApproved && (
              <Button variant="ghost" size="icon" onClick={() => handleApprove(r.id, true)} className="text-brand-success">
                <Check className="h-4 w-4" />
              </Button>
            )}
            {r.isApproved && (
              <Button variant="ghost" size="icon" onClick={() => handleApprove(r.id, false)} className="text-brand-error">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      />
    </div>
  );
}
