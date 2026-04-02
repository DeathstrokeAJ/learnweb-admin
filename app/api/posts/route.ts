import { NextResponse, type NextRequest } from "next/server"
import connectDB from "@/lib/db/mongodb"
import Post from "@/lib/models/post.model"
import Community from "@/lib/models/community.model"
import { requireAuth, handleApiError, getAuthUser } from "@/lib/middleware/auth"
import { validateBody } from "@/lib/middleware/validate"
import { createPostSchema } from "@/lib/validations/post.schema"

export async function POST(request: Request) {
  try {
    const auth = await requireAuth()
    const { data, error } = await validateBody(request, createPostSchema)
    if (error || !data) {
      console.log("Validation Error:", JSON.stringify(error, null, 2))
      return error || NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }

    await connectDB()

    if (data.communityId) {
      const community = await Community.findById(data.communityId)
      if (!community || community.status !== "active") {
        return NextResponse.json({ error: "Community not found or inactive" }, { status: 404 })
      }
    }

    const postPayload = {
      ...data,
      userId: auth.userId,
      status: "pending",
      pollOptions: data.pollOptions?.map((opt) => ({ text: opt.text, votes: 0, votedBy: [] })),
    }

    if (data.communityId) {
      postPayload.communityId = data.communityId
    }

    const post = await Post.create(postPayload)

    if (data.communityId) {
      await Community.findByIdAndUpdate(data.communityId, { $inc: { postCount: 1 } })
    }

    return NextResponse.json({ post }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = request.nextUrl
    const cursor = searchParams.get("cursor")
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50)
    const communityId = searchParams.get("communityId")
    const postType = searchParams.get("postType")
    const status = searchParams.get("status") || "approved"
    const search = searchParams.get("search")
    const bookmarkedBy = searchParams.get("bookmarkedBy")
    const likedBy = searchParams.get("likedBy")
    const userIdVal = searchParams.get("userId")

    const query: Record<string, unknown> = { status }
    if (communityId) query.communityId = communityId
    if (postType) query.postType = postType
    if (bookmarkedBy) query.bookmarkedBy = bookmarkedBy
    if (likedBy) query.likedBy = likedBy
    if (userIdVal) query.userId = userIdVal
    if (communityId) query.communityId = communityId
    if (postType) query.postType = postType
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ]
    }
    if (cursor) query._id = { $lt: cursor }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate("userId", "username displayName avatar")
      .populate("communityId", "name slug icon")
      .lean()

    const hasMore = posts.length > limit
    const rawResults = hasMore ? posts.slice(0, limit) : posts
    const nextCursor = hasMore ? rawResults[rawResults.length - 1]?._id : null

    // Hydrate with user interaction state
    const authUser = await getAuthUser()
    const currentUserId = authUser?.userId

    const results = rawResults.map((post: any) => ({
      ...post,
      isLiked: currentUserId ? post.likedBy?.some((id: any) => id.toString() === currentUserId) : false,
      isBookmarked: currentUserId ? post.bookmarkedBy?.some((id: any) => id.toString() === currentUserId) : false,
    }))

    return NextResponse.json({ posts: results, nextCursor, hasMore })
  } catch (err) {
    return handleApiError(err)
  }
}
