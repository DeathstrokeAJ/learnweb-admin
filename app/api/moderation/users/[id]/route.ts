import { NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import User from "@/lib/models/user.model"
import Post from "@/lib/models/post.model"
import ModerationTicket from "@/lib/models/moderation-ticket.model"
import AuditLog from "@/lib/models/audit-log.model"
import { requireRole, handleApiError } from "@/lib/middleware/auth"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await requireRole("MODERATOR", "SUPER_ADMIN")
    await connectDB()

    const [user, recentPosts, tickets, auditLogs] = await Promise.all([
      User.findById(id),
      Post.find({ userId: id }).sort({ createdAt: -1 }).limit(10).lean(),
      ModerationTicket.find({ reportedUserId: id }).sort({ createdAt: -1 }).limit(20).lean(),
      AuditLog.find({ targetId: id, targetType: "user" }).sort({ createdAt: -1 }).limit(20)
        .populate("performedBy", "username displayName")
        .lean(),
    ])

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      user: user.toJSON(),
      recentPosts,
      tickets,
      auditLogs,
    })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await requireRole("MODERATOR", "SUPER_ADMIN")
    const body = await request.json()

    await connectDB()

    const user = await User.findById(id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (body.action === "ban") {
      user.isBanned = true
      await user.save()
    } else if (body.action === "unban") {
      user.isBanned = false
      user.strikeCount = 0
      user.riskScore = 0
      await user.save()
    } else if (body.action === "suspend") {
      const until = new Date()
      until.setDate(until.getDate() + (body.days || 7))
      user.isSuspended = true
      user.suspendedUntil = until
      await user.save()
    } else if (body.action === "unsuspend") {
      user.isSuspended = false
      user.suspendedUntil = undefined
      await user.save()
    }

    await AuditLog.create({
      performedBy: auth.userId,
      action: `user:${body.action}`,
      targetType: "user",
      targetId: id,
      details: { action: body.action, days: body.days },
    })

    return NextResponse.json({ user: user.toJSON() })
  } catch (err) {
    return handleApiError(err)
  }
}
