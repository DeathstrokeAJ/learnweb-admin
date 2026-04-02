import { NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import Community from "@/lib/models/community.model"
import { handleApiError } from "@/lib/middleware/auth"

export async function GET() {
    try {
        await connectDB()

        // Fetch random or popular communities for discovery
        // For now, returning the most recently created ones
        const communities = await Community.find({})
            .sort({ createdAt: -1 })
            .limit(20)
            .populate("adminIds", "username displayName avatar")
            .lean()

        return NextResponse.json(communities)
    } catch (err) {
        return handleApiError(err)
    }
}
