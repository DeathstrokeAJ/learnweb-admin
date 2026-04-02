"use client"

import { useAuth } from "@/hooks/use-auth"
import type { UserRole } from "@/lib/models/user.model"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  fallbackUrl?: string
}

export function RoleGuard({ children, allowedRoles, fallbackUrl = "/login" }: RoleGuardProps) {
  const { user, isLoading, hasRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(fallbackUrl)
    }
    if (!isLoading && user && !hasRole(...allowedRoles)) {
      router.push("/unauthorized")
    }
  }, [user, isLoading, hasRole, allowedRoles, router, fallbackUrl])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || !hasRole(...allowedRoles)) {
    return null
  }

  return <>{children}</>
}
