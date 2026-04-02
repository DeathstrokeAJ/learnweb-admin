
import { NextResponse, type NextRequest } from "next/server"
import connectDB from "@/lib/db/mongodb"
import Post from "@/lib/models/post.model"
import { requireAuth, handleApiError } from "@/lib/middleware/auth"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const auth = await requireAuth()
        await connectDB()

        const post = await Post.findById(id)
        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 })
        }

        const userIdStr = auth.userId.toString()
        const bookmarkedBy = post.bookmarkedBy || []
        const isBookmarked = bookmarkedBy.some((uid: any) => uid.toString() === userIdStr)

        if (isBookmarked) {
            // Unbookmark
            post.bookmarkedBy = bookmarkedBy.filter((uid: any) => uid.toString() !== userIdStr)
            post.bookmarks = Math.max(0, post.bookmarks - 1)
        } else {
            // Bookmark
            // Initialize if missing (for first time add)
            if (!post.bookmarkedBy) post.bookmarkedBy = []
            post.bookmarkedBy.push(auth.userId)
            post.bookmarks += 1
        }

        await post.save()

        return NextResponse.json({
            success: true,
            isBookmarked: !isBookmarked,
            bookmarks: post.bookmarks
        })
    } catch (err) {
        return handleApiError(err)
    }
}
