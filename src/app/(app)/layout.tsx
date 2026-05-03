import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NotificationBell } from "@/components/layout/notification-bell";
import { Separator } from "@/components/ui/separator";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 items-center justify-between border-b px-4 md:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-2" />
            <Separator orientation="vertical" className="h-4" />
          </div>
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-auto p-4 pb-20 md:p-6 md:pb-6">
          {children}
        </main>
      </SidebarInset>
      <MobileNav />
    </SidebarProvider>
  );
}
