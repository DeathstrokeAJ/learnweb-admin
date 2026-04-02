import { NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import ModerationTicket from "@/lib/models/moderation-ticket.model"
import Post from "@/lib/models/post.model"
import { requireRole, handleApiError } from "@/lib/middleware/auth"

export async function GET() {
  try {
    await requireRole("SUPER_ADMIN")
    await connectDB()

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [
      toxicityDistribution,
      falsePositiveRate,
      avgConfidence,
      riskDistribution,
      aiDecisionLog,
      moderationBySource,
    ] = await Promise.all([
      // Toxicity score distribution buckets
      Post.aggregate([
        { $match: { "aiModerationDetails.toxicityScore": { $exists: true } } },
        {
          $bucket: {
            groupBy: "$aiModerationDetails.toxicityScore",
            boundaries: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.01],
            default: "other",
            output: { count: { $sum: 1 } },
          },
        },
      ]),
      // False positives: tickets that were dismissed (AI flagged but moderator approved)
      ModerationTicket.aggregate([
        { $match: { createdAt: { $gte: weekAgo } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            dismissed: { $sum: { $cond: [{ $eq: ["$status", "dismissed"] }, 1, 0] } },
          },
        },
      ]),
      // Average AI confidence
      Post.aggregate([
        { $match: { "aiModerationDetails.overallRisk": { $exists: true } } },
        {
          $group: {
            _id: null,
            avgRisk: { $avg: "$aiModerationDetails.overallRisk" },
            avgToxicity: { $avg: "$aiModerationDetails.toxicityScore" },
            avgSpam: { $avg: "$aiModerationDetails.spamScore" },
            total: { $sum: 1 },
          },
        },
      ]),
      // Risk score distribution across all posts
      Post.aggregate([
        {
          $bucket: {
            groupBy: "$riskScore",
            boundaries: [0, 0.2, 0.4, 0.6, 0.8, 1.01],
            default: "other",
            output: { count: { $sum: 1 } },
          },
        },
      ]),
      // Recent AI moderation decisions
      Post.find({ "aiModerationDetails.moderatedBy": { $exists: true } })
        .sort({ createdAt: -1 })
        .limit(20)
        .select("title postType aiModerationDetails riskScore status createdAt")
        .populate("userId", "username displayName")
        .lean(),
      // Breakdown by moderation source (rule-based vs openrouter)
      Post.aggregate([
        { $match: { "aiModerationDetails.moderatedBy": { $exists: true } } },
        { $group: { _id: "$aiModerationDetails.moderatedBy", count: { $sum: 1 } } },
      ]),
    ])

    const fpData = falsePositiveRate[0] || { total: 0, dismissed: 0 }

    return NextResponse.json({
      toxicityDistribution,
      falsePositiveRate: fpData.total > 0 ? fpData.dismissed / fpData.total : 0,
      falsePositiveTotal: fpData.dismissed,
      totalReviewed: fpData.total,
      avgConfidence: avgConfidence[0] || { avgRisk: 0, avgToxicity: 0, avgSpam: 0, total: 0 },
      riskDistribution,
      aiDecisionLog,
      moderationBySource,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
