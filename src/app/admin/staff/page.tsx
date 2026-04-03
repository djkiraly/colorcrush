"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DataTable } from "@/components/admin/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function AdminStaffPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const role = (session?.user as { role?: string })?.role;
  const [staff, setStaff] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role && role !== "super_admin") {
      router.replace("/admin");
      return;
    }
    async function fetchStaff() {
      const res = await fetch(`/api/staff?page=${page}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setStaff(data.staff || []);
        setTotalPages(data.totalPages || 1);
      }
      setLoading(false);
    }
    if (role === "super_admin") fetchStaff();
  }, [page, role, router]);

  if (role && role !== "super_admin") return null;

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (s: any) => (
        <Link
          href={`/admin/staff/${s.id}`}
          className="text-brand-primary hover:underline font-medium"
        >
          {s.name}
        </Link>
      ),
    },
    { key: "email", header: "Email" },
    {
      key: "role",
      header: "Role",
      render: (s: any) => (
        <Badge
          className={
            s.role === "super_admin"
              ? "bg-purple-100 text-purple-700"
              : "bg-blue-100 text-blue-700"
          }
        >
          {s.role === "super_admin" ? "Super Admin" : "Admin"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Joined",
      render: (s: any) => new Date(s.createdAt).toLocaleDateString(),
    },
    {
      key: "lastLoginAt",
      header: "Last Login",
      render: (s: any) =>
        s.lastLoginAt
          ? new Date(s.lastLoginAt).toLocaleString()
          : "Never",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-brand-secondary">
          Staff
        </h1>
        <Link href="/admin/staff/new">
          <Button className="bg-brand-primary hover:bg-brand-primary-hover text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Staff
          </Button>
        </Link>
      </div>
      {!loading && (
        <DataTable
          columns={columns}
          data={staff}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          searchPlaceholder="Search staff..."
        />
      )}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h3 className="font-heading font-semibold text-blue-800 mb-2">Admin</h3>
          <ul className="text-sm text-blue-700 space-y-1.5">
            <li>Manage products, categories, and inventory</li>
            <li>View and process orders</li>
            <li>Manage customers and interactions</li>
            <li>Moderate reviews and manage coupons</li>
            <li>View analytics and email logs</li>
          </ul>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
          <h3 className="font-heading font-semibold text-purple-800 mb-2">Super Admin</h3>
          <ul className="text-sm text-purple-700 space-y-1.5">
            <li>Everything an Admin can do, plus:</li>
            <li>Create, edit, and revoke staff access</li>
            <li>Configure site branding, shipping, and integrations</li>
            <li>Manage GCS storage and Gmail settings</li>
            <li>Toggle feature flags</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
