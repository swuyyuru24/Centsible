"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Bell, AlertTriangle, Info, AlertCircle } from "lucide-react";

const ICON_MAP = {
  info: Info,
  warning: AlertTriangle,
  alert: AlertCircle,
};

const COLOR_MAP = {
  info: "text-blue-500",
  warning: "text-yellow-500",
  alert: "text-red-500",
};

type Notification = {
  id: string;
  title: string;
  body: string;
  type: "info" | "warning" | "alert";
  read: boolean;
  created_at: string;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      return (data || []) as Notification[];
    },
    refetchInterval: 30000, // Check every 30 seconds
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", unreadIds);

    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" />}>
        <div className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 sm:w-96">
        <SheetHeader className="flex flex-row items-center justify-between">
          <SheetTitle>Notifications</SheetTitle>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead}>
              Mark all read
            </Button>
          )}
        </SheetHeader>
        <div className="mt-4 space-y-3 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </p>
          ) : (
            notifications.map((notif) => {
              const Icon = ICON_MAP[notif.type] || Info;
              return (
                <div
                  key={notif.id}
                  className={cn(
                    "flex gap-3 rounded-lg p-3",
                    !notif.read && "bg-muted/50"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 mt-0.5 shrink-0",
                      COLOR_MAP[notif.type]
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{notif.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {notif.body}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {format(new Date(notif.created_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
