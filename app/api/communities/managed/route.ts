import { NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import Community from "@/lib/models/community.model"
import { requireRole, handleApiError } from "@/lib/middleware/auth"

export async function GET() {
    try {
        const user = await requireRole("MODERATOR", "SUPER_ADMIN")
        await connectDB()

        // Fetch communities where the user is a moderator or the creator
        const managedCommunities = await Community.find({
            $or: [
                { creator: user.userId },
                { moderators: user.userId }
            ]
        }).populate("creator", "username avatar")

        return NextResponse.json(managedCommunities)
    } catch (err) {
        return handleApiError(err)
    }
}
