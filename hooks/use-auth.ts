"use client"

import { createContext, useContext } from "react"
import useSWR from "swr"
import api from "@/lib/api-client"
import type { UserRole } from "@/lib/models/user.model"

interface AuthUser {
  _id: string
  username: string
  email: string
  displayName: string
  role: UserRole
  avatar?: string
  skillLevel: string
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  error: unknown
  login: (email: string, password: string) => Promise<void>
  register: (data: { username: string; email: string; password: string; displayName: string }) => Promise<void>
  logout: () => Promise<void>
  mutate: () => void
  hasRole: (...roles: UserRole[]) => boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)

const fetcher = async () => {
  const data = await api.get<{ user: AuthUser }>("/api/auth/me")
  return data.user
}

export function useAuthProvider(): AuthContextValue {
  const { data: user, error, isLoading, mutate } = useSWR<AuthUser>("auth-user", fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
    errorRetryCount: 0,
  })

  const login = async (email: string, password: string) => {
    await api.post("/api/auth/login", { email, password })
    await mutate()
  }

  const register = async (data: { username: string; email: string; password: string; displayName: string }) => {
    await api.post("/api/auth/register", data)
    await mutate()
  }

  const logout = async () => {
    await api.post("/api/auth/logout")
    await mutate(undefined, { revalidate: false })
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
  }

  const hasRole = (...roles: UserRole[]) => {
    if (!user) return false
    return roles.includes(user.role)
  }

  return {
    user: user ?? null,
    isLoading,
    error,
    login,
    register,
    logout,
    mutate,
    hasRole,
  }
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export type { AuthUser }
