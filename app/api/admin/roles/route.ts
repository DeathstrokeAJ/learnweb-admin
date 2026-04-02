import { NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import User from "@/lib/models/user.model"
import { requireRole, handleApiError } from "@/lib/middleware/auth"

export async function GET() {
  try {
    await requireRole("SUPER_ADMIN")
    await connectDB()

    const usersWithRoles = await User.find({
      role: { $in: ["MODERATOR", "SENIOR_MODERATOR", "SUPER_ADMIN"] }
    }).select("-password")

    return NextResponse.json(usersWithRoles)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PATCH(request: Request) {
  try {
    await requireRole("SUPER_ADMIN")
    await connectDB()

    const { userId, newRole } = await request.json()

    if (!["USER", "MODERATOR", "SENIOR_MODERATOR", "SUPER_ADMIN"].includes(newRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role: newRole },
      { new: true }
    ).select("-password")

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Role updated successfully", user: updatedUser })
  } catch (err) {
    return handleApiError(err)
  }
}
