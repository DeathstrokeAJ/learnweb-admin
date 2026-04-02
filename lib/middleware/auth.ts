import { cookies, headers } from "next/headers"
import { verifyAccessToken, type TokenPayload } from "@/lib/auth/jwt"
import { NextResponse } from "next/server"

export async function getAuthUser(): Promise<TokenPayload | null> {
  try {
    // 1. Check cookies (Web)
    const cookieStore = await cookies()
    let token = cookieStore.get("access_token")?.value

    // 2. Check Authorization header (Mobile/API)
    if (!token) {
      const headerList = await headers()
      const authHeader = headerList.get("Authorization")
      // console.log("[Auth] AuthHeader:", authHeader)
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7)
      }
    }

    // console.log("[Auth] Final Token:", token ? "Exists" : "Missing")

    if (!token) return null
    return await verifyAccessToken(token)
  } catch (err) {
    console.error("[Auth] Error getting user:", err)
    return null
  }
}

export async function requireAuth(): Promise<TokenPayload> {
  const user = await getAuthUser()
  if (!user) {
    throw new AuthError("Unauthorized", 401)
  }
  return user
}

export async function requireRole(...roles: string[]): Promise<TokenPayload> {
  const user = await requireAuth()
  if (!roles.includes(user.role)) {
    throw new AuthError("Forbidden: insufficient permissions", 403)
  }
  return user
}

export class AuthError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = "AuthError"
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  console.error("API Error:", error)
  return NextResponse.json({ error: "Internal server error" }, { status: 500 })
}
