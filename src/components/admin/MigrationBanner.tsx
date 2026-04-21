"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

type Status = {
  currentVersion: number;
  currentTag: string | null;
  targetVersion: number;
  targetTag: string | null;
  isCurrent: boolean;
  pending: { idx: number; tag: string }[];
};

export function MigrationBanner() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    fetch("/api/migrations/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setStatus(data))
      .catch(() => {});
  }, []);

  if (!status || status.isCurrent) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-900 flex items-center gap-3">
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      <div className="flex-1">
        <span className="font-medium">Database is behind schema.</span>{" "}
        Current: v{status.currentVersion}
        {status.currentTag ? ` (${status.currentTag})` : ""}. Target: v{status.targetVersion}
        {status.targetTag ? ` (${status.targetTag})` : ""}.{" "}
        {status.pending.length} pending migration{status.pending.length === 1 ? "" : "s"}.{" "}
        <span className="text-amber-800">Run </span>
        <code className="bg-amber-100 px-1 rounded font-mono text-xs">npm run migrate</code>
        <span className="text-amber-800"> on the server.</span>
      </div>
    </div>
  );
}
