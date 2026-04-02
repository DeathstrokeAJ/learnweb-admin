import { NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import User from "@/lib/models/user.model"
import Post from "@/lib/models/post.model"
import { getAuthUser, handleApiError } from "@/lib/middleware/auth"

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        await connectDB()
        const targetUserId = params.id
        const authUser = await getAuthUser()
        const currentUserId = authUser?.userId // May be null if not logged in

        const user = await User.findById(targetUserId)
            .select("username displayName avatar bio skillLevel stats createdAt followers following")
            .lean()

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Calculate stats
        const followersCount = user.followers?.length || 0
        const followingCount = user.following?.length || 0
        const isFollowing = currentUserId
            ? user.followers?.some((id: any) => id.toString() === currentUserId)
            : false

        // Fetch recent posts
        const posts = await Post.find({ author: targetUserId, status: "approved" })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate("author", "username avatar displayName")
            .lean()

        return NextResponse.json({
            user: {
                ...user,
                followersCount,
                followingCount,
                isFollowing,
            },
            posts
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
