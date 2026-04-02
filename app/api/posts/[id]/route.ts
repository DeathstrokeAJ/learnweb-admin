import { NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import Post from "@/lib/models/post.model"
import { requireAuth, handleApiError } from "@/lib/middleware/auth"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await connectDB()

    const post = await Post.findById(id)
      .populate("userId", "username displayName avatar")
      .populate("communityId", "name slug icon")

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    return NextResponse.json({ post })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await requireAuth()
    await connectDB()

    const post = await Post.findById(id)
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const isOwner = post.userId.toString() === auth.userId
    const isMod = ["MODERATOR", "SUPER_ADMIN"].includes(auth.role)
    if (!isOwner && !isMod) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    post.status = "removed"
    await post.save()

    return NextResponse.json({ message: "Post removed" })
  } catch (err) {
    return handleApiError(err)
  }
}
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await requireAuth()
    const { status } = await request.json()
    await connectDB()

    const post = await Post.findById(id)
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Community admins can approve posts in their community
    const isCommunityAdmin = auth.role === "COMMUNITY_ADMIN" && post.communityId.toString() === auth.managedCommunityId
    const isMod = ["MODERATOR", "SUPER_ADMIN"].includes(auth.role)

    if (!isCommunityAdmin && !isMod) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    post.status = status
    await post.save()

    return NextResponse.json({ post })
  } catch (err) {
    return handleApiError(err)
  }
}
