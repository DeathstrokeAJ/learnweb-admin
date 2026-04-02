import { NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import User from "@/lib/models/user.model"
import Community from "@/lib/models/community.model" // Ensure model is registered
import { requireAuth, handleApiError } from "@/lib/middleware/auth"

export async function GET() {
    try {
        // console.log("[API] GET /communities/joined start")
        const auth = await requireAuth()
        // console.log("[API] /communities/joined auth success", auth.userId)
        await connectDB()

        // Ensure Community model is loaded
        if (!Community) { }

        const user = await User.findById(auth.userId)
            .populate("joinedCommunities")
            .select("joinedCommunities")
            .lean()

        // console.log("[API] /communities/joined user found:", !!user)

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        return NextResponse.json((user as any).joinedCommunities || [])
    } catch (err) {
        console.error("[API] GET /communities/joined error:", err)
        return handleApiError(err)
    }
}
