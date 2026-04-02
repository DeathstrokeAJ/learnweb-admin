import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "@/lib/auth/jwt"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get("refresh_token")?.value

    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 })
    }

    const payload = await verifyRefreshToken(refreshToken)

    const tokenPayload = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      username: payload.username,
    }

    const newAccessToken = await signAccessToken(tokenPayload)
    const newRefreshToken = await signRefreshToken(tokenPayload)

    cookieStore.set("access_token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60,
      path: "/",
    })
    cookieStore.set("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    })

    return NextResponse.json({ message: "Tokens refreshed" })
  } catch {
    return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 })
  }
}
