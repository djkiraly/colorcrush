"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  color: string;
}

export function StatsCard({
  label,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  color,
}: StatsCardProps) {
  return (
    <div className={cn("rounded-xl p-6", color)}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-brand-text-secondary">{label}</p>
        <Icon className="h-5 w-5 text-brand-text-muted" />
      </div>
      <p className="text-3xl font-bold text-brand-text">{value}</p>
      {change && (
        <p
          className={cn(
            "text-sm mt-1",
            changeType === "positive" && "text-brand-success",
            changeType === "negative" && "text-brand-error",
            changeType === "neutral" && "text-brand-text-muted"
          )}
        >
          {change}
        </p>
      )}
    </div>
  );
}
