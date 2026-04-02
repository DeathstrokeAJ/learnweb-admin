import { NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import Post from "@/lib/models/post.model"
import { requireAuth, handleApiError } from "@/lib/middleware/auth"

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await requireAuth()
    await connectDB()

    const post = await Post.findById(id)
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const alreadyLiked = post.likedBy.some(
      (uid: { toString: () => string }) => uid.toString() === auth.userId
    )

    if (alreadyLiked) {
      await Post.findByIdAndUpdate(id, {
        $pull: { likedBy: auth.userId },
        $inc: { likes: -1 },
      })
      return NextResponse.json({ liked: false, likes: post.likes - 1 })
    } else {
      await Post.findByIdAndUpdate(id, {
        $addToSet: { likedBy: auth.userId },
        $inc: { likes: 1 },
      })
      return NextResponse.json({ liked: true, likes: post.likes + 1 })
    }
  } catch (err) {
    return handleApiError(err)
  }
}
