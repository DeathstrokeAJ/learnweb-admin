import { NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import ModerationTicket from "@/lib/models/moderation-ticket.model"
import Post from "@/lib/models/post.model"
import User from "@/lib/models/user.model"
import AuditLog from "@/lib/models/audit-log.model"
import Notification from "@/lib/models/notification.model"
import { requireRole, handleApiError } from "@/lib/middleware/auth"
import { validateBody } from "@/lib/middleware/validate"
import { moderateActionSchema } from "@/lib/validations/moderation.schema"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await requireRole("MODERATOR", "SUPER_ADMIN")
    const { data, error } = await validateBody(request, moderateActionSchema)
    if (error) return error

    await connectDB()

    const ticket = await ModerationTicket.findById(id)
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    ticket.reviewedBy = auth.userId as unknown as typeof ticket.reviewedBy
    ticket.reviewedAt = new Date()
    ticket.action = data.action
    ticket.actionNote = data.note

    switch (data.action) {
      case "approve":
        ticket.status = "approved"
        await Post.findByIdAndUpdate(ticket.postId, { status: "approved" })
        break

      case "dismiss":
        ticket.status = "dismissed"
        break

      case "strike": {
        ticket.status = "actioned"
        await Post.findByIdAndUpdate(ticket.postId, { status: "removed" })
        const user = await User.findByIdAndUpdate(
          ticket.reportedUserId,
          { $inc: { strikeCount: 1, riskScore: 0.15 } },
          { new: true }
        )
        if (user && user.strikeCount >= 3) {
          user.isBanned = true
          await user.save()
          await Notification.create({
            userId: ticket.reportedUserId,
            type: "user_banned",
            title: "Account Banned",
            message: "Your account has been banned due to multiple violations.",
          })
        } else {
          await Notification.create({
            userId: ticket.reportedUserId,
            type: "strike_issued",
            title: "Strike Issued",
            message: `A strike has been added to your account. (${user?.strikeCount}/3)`,
          })
        }
        break
      }

      case "ban":
        ticket.status = "actioned"
        await Post.findByIdAndUpdate(ticket.postId, { status: "removed" })
        await User.findByIdAndUpdate(ticket.reportedUserId, { isBanned: true })
        await Notification.create({
          userId: ticket.reportedUserId,
          type: "user_banned",
          title: "Account Banned",
          message: "Your account has been permanently banned.",
        })
        break

      case "suspend": {
        ticket.status = "actioned"
        const suspendUntil = new Date()
        suspendUntil.setDate(suspendUntil.getDate() + (data.suspendDays || 7))
        await User.findByIdAndUpdate(ticket.reportedUserId, {
          isSuspended: true,
          suspendedUntil: suspendUntil,
        })
        break
      }
    }

    await ticket.save()

    await AuditLog.create({
      performedBy: auth.userId,
      action: `moderation:${data.action}`,
      targetType: "ticket",
      targetId: ticket._id,
      details: { ticketId: id, postId: ticket.postId, note: data.note },
    })

    return NextResponse.json({ ticket })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await requireRole("MODERATOR", "SUPER_ADMIN")
    await connectDB()

    const ticket = await ModerationTicket.findById(id)
      .populate("postId")
      .populate("reportedUserId", "username displayName avatar riskScore strikeCount")
      .populate("reportedBy", "username displayName")
      .populate("reviewedBy", "username displayName")

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    return NextResponse.json({ ticket })
  } catch (err) {
    return handleApiError(err)
  }
}
