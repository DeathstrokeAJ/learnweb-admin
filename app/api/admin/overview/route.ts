import { NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import User from "@/lib/models/user.model"
import Post from "@/lib/models/post.model"
import Community from "@/lib/models/community.model"
import ModerationTicket from "@/lib/models/moderation-ticket.model"
import AuditLog from "@/lib/models/audit-log.model"
import { requireRole, handleApiError } from "@/lib/middleware/auth"

export async function GET() {
  try {
    await requireRole("SUPER_ADMIN")
    await connectDB()

    const now = new Date()
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalUsers,
      activeToday,
      totalPosts,
      postsToday,
      totalCommunities,
      activeCommunities,
      openTickets,
      postsPerDay,
      userGrowth,
      engagementByType,
      recentAuditLogs,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ lastActive: { $gte: dayAgo } }),
      Post.countDocuments({}),
      Post.countDocuments({ createdAt: { $gte: dayAgo } }),
      Community.countDocuments({}),
      Community.countDocuments({ status: "active" }),
      ModerationTicket.countDocuments({ status: { $in: ["open", "under_review"] } }),
      Post.aggregate([
        { $match: { createdAt: { $gte: weekAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: weekAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Post.aggregate([
        { $group: { _id: "$postType", count: { $sum: 1 }, avgEngagement: { $avg: "$engagementScore" } } },
        { $sort: { count: -1 } },
      ]),
      AuditLog.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("performedBy", "username email"),
    ])

    return NextResponse.json({
      totalUsers,
      activeToday,
      totalPosts,
      postsToday,
      totalCommunities,
      activeCommunities,
      openTickets,
      postsPerDay,
      userGrowth,
      engagementByType,
      recentAuditLogs,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
