import { NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import ModerationTicket from "@/lib/models/moderation-ticket.model"
import Post from "@/lib/models/post.model"
import User from "@/lib/models/user.model"
import { requireRole, handleApiError } from "@/lib/middleware/auth"

export async function GET() {
  try {
    await requireRole("MODERATOR", "SUPER_ADMIN")
    await connectDB()

    const now = new Date()
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      openTickets,
      totalTickets,
      resolvedToday,
      flaggedPosts,
      highRiskUsers,
      ticketsByPriority,
      recentTickets,
      weeklyTrend,
    ] = await Promise.all([
      ModerationTicket.countDocuments({ status: { $in: ["open", "under_review"] } }),
      ModerationTicket.countDocuments({}),
      ModerationTicket.countDocuments({ status: { $in: ["approved", "dismissed", "actioned"] }, reviewedAt: { $gte: dayAgo } }),
      Post.countDocuments({ status: "flagged" }),
      User.countDocuments({ riskScore: { $gte: 0.5 } }),
      ModerationTicket.aggregate([
        { $match: { status: { $in: ["open", "under_review"] } } },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),
      ModerationTicket.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("postId", "title postType")
        .populate("reportedUserId", "username displayName")
        .lean(),
      ModerationTicket.aggregate([
        { $match: { createdAt: { $gte: weekAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ])

    const priorityMap: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 }
    ticketsByPriority.forEach((p: { _id: string; count: number }) => {
      priorityMap[p._id] = p.count
    })

    return NextResponse.json({
      openTickets,
      totalTickets,
      resolvedToday,
      flaggedPosts,
      highRiskUsers,
      ticketsByPriority: priorityMap,
      recentTickets,
      weeklyTrend,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
