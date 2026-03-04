"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "@/features/notifications/api";
import type { Notification } from "@/lib/api/types";

function notificationIcon(type: Notification["type"]) {
  if (type === "APPLICATION_RECEIVED") return "📩";
  if (type === "APPLICATION_APPROVED") return "✅";
  if (type === "APPLICATION_DECLINED") return "❌";
  return "🔔";
}

export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const isEnabled = Boolean(user?.id);
  const { data: unreadData } = useUnreadNotificationCount(isEnabled);
  const { data: notifications } = useNotifications(isEnabled && open);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = unreadData?.count ?? 0;

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!user) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-2xl text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-[22px] border border-border bg-background shadow-xl">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 divide-y divide-border overflow-y-auto">
            {!notifications || notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex gap-3 px-4 py-3 transition hover:bg-secondary/50 ${!n.is_read ? "bg-primary/5" : ""}`}
                >
                  <span className="mt-0.5 text-lg leading-none">{notificationIcon(n.type)}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${!n.is_read ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                    {n.body ? <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p> : null}
                    <div className="mt-1 flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </span>
                      {n.action_url && (
                        <Link
                          href={n.action_url}
                          className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                          onClick={() => {
                            if (!n.is_read) markRead.mutate(n.id);
                            setOpen(false);
                          }}
                        >
                          View
                        </Link>
                      )}
                    </div>
                  </div>
                  {!n.is_read && (
                    <button
                      type="button"
                      onClick={() => markRead.mutate(n.id)}
                      className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary"
                      aria-label="Mark as read"
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
