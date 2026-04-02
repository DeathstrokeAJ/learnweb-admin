import { NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import Community from "@/lib/models/community.model"
import User from "@/lib/models/user.model"
import { requireAuth, handleApiError } from "@/lib/middleware/auth"

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await requireAuth()
    await connectDB()

    const community = await Community.findById(id)
    if (!community || community.status !== "active") {
      return NextResponse.json({ error: "Community not found or inactive" }, { status: 404 })
    }

    const user = await User.findById(auth.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const alreadyJoined = user.joinedCommunities.some(
      (cid: { toString: () => string }) => cid.toString() === id
    )

    if (alreadyJoined) {
      // Leave community
      await User.findByIdAndUpdate(auth.userId, { $pull: { joinedCommunities: id } })
      await Community.findByIdAndUpdate(id, { $inc: { memberCount: -1 } })
      return NextResponse.json({ joined: false })
    } else {
      // Join community
      await User.findByIdAndUpdate(auth.userId, { $addToSet: { joinedCommunities: id } })
      await Community.findByIdAndUpdate(id, { $inc: { memberCount: 1 } })
      return NextResponse.json({ joined: true })
    }
  } catch (err) {
    return handleApiError(err)
  }
}
