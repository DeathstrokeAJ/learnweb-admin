"use client"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { ModeratorSidebar } from "@/components/moderator/app-sidebar"
import { RoleGuard } from "@/components/role-guard"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { usePathname } from "next/navigation"

const breadcrumbMap: Record<string, string> = {
  "/moderator": "Dashboard",
  "/moderator/queue": "Moderation Queue",
  "/moderator/users": "User Risk Profiles",
  "/moderator/communities": "Communities",
  "/moderator/notifications": "Notifications",
}

export default function ModeratorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const title = breadcrumbMap[pathname] || "Dashboard"

  return (
    <RoleGuard allowedRoles={["MODERATOR", "SUPER_ADMIN"]}>
      <SidebarProvider>
        <ModeratorSidebar />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 !h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>{title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </RoleGuard>
  )
}
