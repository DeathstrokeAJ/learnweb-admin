import { NextResponse, type NextRequest } from "next/server"
import connectDB from "@/lib/db/mongodb"
import Comment from "@/lib/models/comment.model"
import Post from "@/lib/models/post.model"
import { requireAuth, handleApiError } from "@/lib/middleware/auth"

import { emitEvent } from "@/lib/socket/server"
import { SOCKET_EVENTS } from "@/lib/socket/events"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await requireAuth()
    const body = await request.json()

    if (!body.content || body.content.length > 2000) {
      return NextResponse.json({ error: "Comment content is required (max 2000 chars)" }, { status: 400 })
    }

    await connectDB()

    const post = await Post.findById(id)
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const comment = await Comment.create({
      postId: id,
      userId: auth.userId,
      parentId: body.parentId || undefined,
      content: body.content,
    })

    const updatedPost = await Post.findByIdAndUpdate(id, { $inc: { commentCount: 1 } }, { new: true })

    const populated = await Comment.findById(comment._id)
      .populate("userId", "username displayName avatar")
      .lean()

    // Real-time updates
    emitEvent(SOCKET_EVENTS.POST_NEW_COMMENT, { postId: id, comment: populated }, `post:${id}`)
    emitEvent(SOCKET_EVENTS.POST_COMMENT_UPDATE, { postId: id, commentCount: updatedPost.commentCount }, `post:${id}`)

    // Notification logic would go here (omitted for brevity)

    return NextResponse.json({ comment: populated }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await connectDB()

    const { searchParams } = request.nextUrl
    const cursor = searchParams.get("cursor")
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50)

    const query: Record<string, unknown> = { postId: id, isDeleted: false }
    if (cursor) query._id = { $lt: cursor }

    const comments = await Comment.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate("userId", "username displayName avatar")
      .lean()

    const hasMore = comments.length > limit
    const results = hasMore ? comments.slice(0, limit) : comments

    return NextResponse.json({
      comments: results,
      nextCursor: hasMore ? results[results.length - 1]?._id : null,
      hasMore,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
