import { NextResponse, type NextRequest } from "next/server"
import connectDB from "@/lib/db/mongodb"
import CommunityRequest from "@/lib/models/community-request.model"
import { requireRole, handleApiError } from "@/lib/middleware/auth"

// GET: List all community requests (Admin only)
export async function GET(request: NextRequest) {
    try {
        // Allow MODERATOR and SUPER_ADMIN to view requests (or just SUPER_ADMIN as per plan)
        // Plan said SUPER_ADMIN.
        await requireRole("SUPER_ADMIN")
        await connectDB()

        const { searchParams } = request.nextUrl
        const status = searchParams.get("status")

        const query: any = {}
        if (status && status !== "all") {
            query.status = status
        }

        const requests = await CommunityRequest.find(query)
            .sort({ createdAt: -1 })
            .populate("requestedBy", "username email avatar") // Populate user info
            .lean()

        return NextResponse.json({ requests })
    } catch (err) {
        return handleApiError(err)
    }
}
