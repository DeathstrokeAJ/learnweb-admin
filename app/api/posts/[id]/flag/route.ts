import { NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import Post from "@/lib/models/post.model"
import Community from "@/lib/models/community.model"
import ModerationTicket from "@/lib/models/moderation-ticket.model"
import { requireAuth, handleApiError } from "@/lib/middleware/auth"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const auth = await requireAuth()
        const { reason, category } = await request.json()

        if (!reason) {
            return NextResponse.json({ error: "Reason is required" }, { status: 400 })
        }

        await connectDB()

        const post = await Post.findById(id)
        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 })
        }

        // Check if duplicate report exists
        const existingTicket = await ModerationTicket.findOne({
            postId: id,
            reportedBy: auth.userId,
            status: { $in: ["pending", "in_review"] },
        })

        if (existingTicket) {
            return NextResponse.json({ error: "You have already reported this post" }, { status: 409 })
        }

        const ticket = await ModerationTicket.create({
            postId: id,
            reportedUserId: post.userId,
            reportedBy: auth.userId,
            communityId: post.communityId,
            content: post.content, // Required field in new model
            reason,
            category: category || "general",
            status: "pending", // Fixed from 'open'
            severity: "medium", // Fixed from 'priority'
            aiAnalysis: { score: 0, labels: [] },
        })

        // Auto-flag post if reports exceed threshold (e.g., 5)
        const reportCount = await ModerationTicket.countDocuments({ postId: id })
        if (reportCount >= 5) {
            post.status = "flagged"
            await post.save()
        }

        return NextResponse.json({ ticket }, { status: 201 })
    } catch (err) {
        return handleApiError(err)
    }
}
