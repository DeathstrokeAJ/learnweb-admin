import { NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import User from "@/lib/models/user.model"
import Post from "@/lib/models/post.model"
import ModerationTicket from "@/lib/models/moderation-ticket.model"
import { requireRole, handleApiError } from "@/lib/middleware/auth"

export async function GET() {
    try {
        await requireRole("MODERATOR", "SUPER_ADMIN")
        await connectDB()

        const now = new Date()
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

        const [
            totalPending,
            criticalPending,
            resolvedToday,
            totalTickets,
            ticketsPerDay,
            recentTickets,
        ] = await Promise.all([
            ModerationTicket.countDocuments({ status: { $in: ["pending", "in_review"] } }),
            ModerationTicket.countDocuments({ status: "pending", severity: "critical" }),
            ModerationTicket.countDocuments({ status: "resolved", updatedAt: { $gte: dayAgo } }),
            ModerationTicket.countDocuments({}),
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
            ModerationTicket.find({})
                .sort({ createdAt: -1 })
                .limit(5)
                .populate("reportedUserId", "username")
                .populate("reportedBy", "username"),
        ])

        const mappedTickets = recentTickets.map((t: any) => ({
            ...t.toObject(),
            reportedUser: t.reportedUserId, // Map for UI
            reporter: t.reportedBy, // Map for UI
        }))

        return NextResponse.json({
            totalPending,
            criticalPending,
            resolvedToday,
            totalTickets,
            ticketsPerDay,
            recentTickets: mappedTickets,
        })
    } catch (err) {
        return handleApiError(err)
    }
}
