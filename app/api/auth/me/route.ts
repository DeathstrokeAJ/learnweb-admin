import { NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import User from "@/lib/models/user.model"
import { requireAuth, handleApiError } from "@/lib/middleware/auth"

export async function GET() {
  try {
    const auth = await requireAuth()
    await connectDB()

    const user = await User.findById(auth.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Calculate Stats
    const shares = await import("@/lib/models/post.model").then(m => m.default.countDocuments({ userId: auth.userId }));

    // Aggregation for Reputation (Total Likes)
    const reputationResult = await import("@/lib/models/post.model").then(m => m.default.aggregate([
      { $match: { userId: auth.userId } },
      { $group: { _id: null, totalLikes: { $sum: "$likes" } } }
    ]));
    const reputation = reputationResult[0]?.totalLikes || 0;

    // Learning (Mocked for now as joined communities count or similar)
    const learning = user.joinedCommunities?.length || 12; // Default mock 12 if no data

    return NextResponse.json({
      user: {
        ...user.toJSON(),
        stats: {
          learning,
          shares,
          reputation
        }
      }
    })
  } catch (err) {
    return handleApiError(err)
  }
}
