"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MobileNav() {
  const pathname = usePathname();
  const mobileItems = NAV_ITEMS.filter((item) => item.mobileNav);
  const overflowItems = NAV_ITEMS.filter((item) => !item.mobileNav);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex items-center justify-around py-2">
        {mobileItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 text-xs",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs text-muted-foreground">
            <MoreHorizontal className="h-5 w-5" />
            <span>More</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top">
            {overflowItems.map((item) => (
              <DropdownMenuItem key={item.href} render={<Link href={item.href} />} className="flex items-center gap-2">
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
