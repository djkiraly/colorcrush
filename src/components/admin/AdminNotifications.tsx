"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  AlertTriangle,
  ShoppingCart,
  Warehouse,
  MessageSquare,
  Star,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type NotificationItem = {
  id: string;
  title: string;
  subtitle?: string;
  severity?: string;
  href?: string;
};

type NotificationGroup = {
  key: string;
  label: string;
  href: string;
  count: number;
  items: NotificationItem[];
};

const GROUP_ICONS: Record<string, LucideIcon> = {
  alerts: AlertTriangle,
  orders: ShoppingCart,
  lowStock: Warehouse,
  interactions: MessageSquare,
  reviews: Star,
};

export function AdminNotifications() {
  const [count, setCount] = useState(0);
  const [groups, setGroups] = useState<NotificationGroup[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch("/api/admin/notifications")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (cancelled || !d) return;
          setCount(d.count ?? 0);
          setGroups(d.groups ?? []);
        })
        .catch(() => {});
    };
    load();
    const interval = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const activeGroups = groups.filter((g) => g.count > 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-primary px-1 text-[10px] font-semibold leading-none text-white">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent align="end" sideOffset={8} className="w-96 p-0">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <p className="font-heading font-semibold text-sm">Notifications</p>
          {count > 0 && (
            <span className="text-xs text-brand-text-muted">{count} need attention</span>
          )}
        </div>

        <div className="max-h-[28rem] overflow-y-auto">
          {activeGroups.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-brand-text-muted">
              You&apos;re all caught up 🎉
            </p>
          ) : (
            activeGroups.map((group) => {
              const Icon = GROUP_ICONS[group.key] ?? Bell;
              return (
                <div key={group.key} className="border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
                    <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-text-muted">
                      <Icon className="h-3.5 w-3.5" />
                      {group.label}
                      <span className="rounded-full bg-brand-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-brand-primary">
                        {group.count}
                      </span>
                    </span>
                    <Link
                      href={group.href}
                      onClick={() => setOpen(false)}
                      className="text-xs text-brand-primary hover:underline"
                    >
                      View all
                    </Link>
                  </div>
                  <div className="pb-1.5">
                    {group.items.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href ?? group.href}
                        onClick={() => setOpen(false)}
                        className="block px-4 py-1.5 hover:bg-gray-50"
                      >
                        <p className="truncate text-sm font-medium text-brand-text">
                          {item.title}
                        </p>
                        {item.subtitle && (
                          <p className="truncate text-xs text-brand-text-muted capitalize">
                            {item.subtitle}
                          </p>
                        )}
                      </Link>
                    ))}
                    {group.count > group.items.length && (
                      <p className="px-4 pt-1 text-xs text-brand-text-muted">
                        +{group.count - group.items.length} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
