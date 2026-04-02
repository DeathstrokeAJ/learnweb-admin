import { NextResponse, type NextRequest } from "next/server"
import connectDB from "@/lib/db/mongodb"
import CommunityRequest from "@/lib/models/community-request.model"
import Community from "@/lib/models/community.model"
import { requireRole, handleApiError, requireAuth } from "@/lib/middleware/auth"

// PATCH: Approve or Reject a request
export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const auth = await requireRole("SUPER_ADMIN") // Returns auth details
        const body = await request.json()
        const { action, reviewNote } = body

        if (!["approve", "reject"].includes(action)) {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 })
        }

        await connectDB()
        const communityRequest = await CommunityRequest.findById(params.id)
        if (!communityRequest) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 })
        }

        if (communityRequest.status !== "pending") {
            return NextResponse.json({ error: "Request is not pending" }, { status: 400 })
        }

        if (action === "reject") {
            communityRequest.status = "rejected"
            communityRequest.reviewNote = reviewNote
            communityRequest.reviewedBy = auth.userId
            communityRequest.reviewedAt = new Date()
            await communityRequest.save()

            return NextResponse.json({ request: communityRequest })
        }

        if (action === "approve") {
            // Create the Actual Community
            // First check duplicate slug again to be safe
            const existing = await Community.findOne({ slug: communityRequest.slug })
            if (existing) {
                // Edge case: someone created it manually in the meantime
                communityRequest.status = "rejected"
                communityRequest.reviewNote = "Auto-rejected on approval: Community already exists."
                await communityRequest.save()
                return NextResponse.json({ error: "Community already exists", request: communityRequest }, { status: 409 })
            }

            const newCommunity = await Community.create({
                name: communityRequest.name,
                slug: communityRequest.slug,
                description: communityRequest.description,
                createdBy: communityRequest.requestedBy,
                adminIds: [communityRequest.requestedBy], // requestor becomes admin
                status: "active",
            })

            communityRequest.status = "approved"
            communityRequest.communityId = newCommunity._id
            communityRequest.reviewedBy = auth.userId
            communityRequest.reviewedAt = new Date()
            communityRequest.reviewNote = reviewNote
            await communityRequest.save()

            return NextResponse.json({ request: communityRequest, community: newCommunity })
        }

    } catch (err) {
        return handleApiError(err)
    }
}
