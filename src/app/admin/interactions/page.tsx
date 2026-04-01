"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

const statusColors: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};

export default function AdminInteractionsPage() {
  const [interactions, setInteractions] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchInteractions = async () => {
    const res = await fetch("/api/interactions");
    const data = await res.json();
    setInteractions(data.interactions || []);
  };

  useEffect(() => { fetchInteractions(); }, []);

  const columns = [
    { key: "userName", header: "Customer" },
    { key: "type", header: "Type", render: (i: any) => <span className="capitalize text-sm">{i.type.replace("_", " ")}</span> },
    { key: "subject", header: "Subject" },
    { key: "status", header: "Status", render: (i: any) => <Badge className={statusColors[i.status]}>{i.status.replace("_", " ")}</Badge> },
    { key: "priority", header: "Priority", render: (i: any) => <Badge className={priorityColors[i.priority]}>{i.priority}</Badge> },
    { key: "createdAt", header: "Date", render: (i: any) => new Date(i.createdAt).toLocaleDateString() },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-brand-secondary">Customer Interactions</h1>
        <Button onClick={() => setDialogOpen(true)} className="bg-brand-primary hover:bg-brand-primary-hover text-white">
          <Plus className="h-4 w-4 mr-2" /> New Interaction
        </Button>
      </div>
      <DataTable columns={columns} data={interactions} searchPlaceholder="Search interactions..." />
    </div>
  );
}
