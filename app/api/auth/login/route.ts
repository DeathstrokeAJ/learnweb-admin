import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import connectDB from "@/lib/db/mongodb"
import User from "@/lib/models/user.model"
import { comparePassword } from "@/lib/auth/password"
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt"
import { validateBody } from "@/lib/middleware/validate"
import { loginSchema } from "@/lib/validations/auth.schema"

export async function POST(request: Request) {
  try {
    const { data, error } = await validateBody(request, loginSchema)
    if (error) return error

    await connectDB()

    const user = await User.findOne({
      $or: [{ email: data.email }, { username: data.email }]
    }).select("+passwordHash")

    if (!user) {
      return NextResponse.json({ error: "Invalid email/username or password" }, { status: 401 })
    }

    if (user.isBanned) {
      return NextResponse.json({ error: "This account has been banned" }, { status: 403 })
    }

    if (user.isSuspended && user.suspendedUntil && new Date(user.suspendedUntil) > new Date()) {
      return NextResponse.json({
        error: `Account suspended until ${user.suspendedUntil.toISOString()}`,
      }, { status: 403 })
    }

    const valid = await comparePassword(data.password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Clear suspension if expired
    if (user.isSuspended && (!user.suspendedUntil || new Date(user.suspendedUntil) <= new Date())) {
      user.isSuspended = false
      user.suspendedUntil = undefined
    }

    user.lastActive = new Date()
    await user.save()

    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      username: user.username,
    }

    const accessToken = await signAccessToken(tokenPayload)
    const refreshToken = await signRefreshToken(tokenPayload)

    const cookieStore = await cookies()
    cookieStore.set("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60,
      path: "/",
    })
    cookieStore.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    })

    return NextResponse.json({
      user: user.toJSON(),
      accessToken,
      refreshToken,
      message: "Login successful",
    })
  } catch (err) {
    console.error("Login error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
