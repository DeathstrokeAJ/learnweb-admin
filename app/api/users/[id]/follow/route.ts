import { NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import User from "@/lib/models/user.model"
import { requireAuth, handleApiError } from "@/lib/middleware/auth"

export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        await connectDB()
        const targetUserId = params.id
        const authUser = await requireAuth()
        const currentUserId = authUser.userId

        if (targetUserId === currentUserId) {
            return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })
        }

        const targetUser = await User.findById(targetUserId)
        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const currentUser = await User.findById(currentUserId)
        if (!currentUser) {
            return NextResponse.json({ error: "Current user not found" }, { status: 404 })
        }

        // Check if already following
        const isFollowing = targetUser.followers.includes(currentUserId)

        if (isFollowing) {
            // Unfollow
            await User.updateOne({ _id: targetUserId }, { $pull: { followers: currentUserId } })
            await User.updateOne({ _id: currentUserId }, { $pull: { following: targetUserId } })
        } else {
            // Follow
            await User.updateOne({ _id: targetUserId }, { $addToSet: { followers: currentUserId } })
            await User.updateOne({ _id: currentUserId }, { $addToSet: { following: targetUserId } })
        }

        return NextResponse.json({
            followed: !isFollowing,
            message: !isFollowing ? "Followed successfully" : "Unfollowed successfully"
        })
    } catch (err: any) {
        return handleApiError(err)
    }
}
