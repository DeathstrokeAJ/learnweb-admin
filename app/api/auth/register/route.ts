import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import connectDB from "@/lib/db/mongodb"
import User from "@/lib/models/user.model"
import { hashPassword } from "@/lib/auth/password"
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt"
import { validateBody } from "@/lib/middleware/validate"
import { registerSchema } from "@/lib/validations/auth.schema"

export async function POST(request: Request) {
  try {
    const { data, error } = await validateBody(request, registerSchema)
    if (error) return error

    await connectDB()

    const existing = await User.findOne({
      $or: [{ email: data.email }, { username: data.username }],
    })

    if (existing) {
      const field = existing.email === data.email ? "email" : "username"
      return NextResponse.json({ error: `This ${field} is already registered` }, { status: 409 })
    }

    const passwordHash = await hashPassword(data.password)

    const user = await User.create({
      username: data.username,
      email: data.email,
      passwordHash,
      displayName: data.displayName,
      skillLevel: data.skillLevel,
      role: "USER",
    })

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
      message: "Registration successful",
    }, { status: 201 })
  } catch (err) {
    console.error("Register error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
