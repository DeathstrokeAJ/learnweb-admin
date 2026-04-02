import { NextResponse, type NextRequest } from "next/server"
import connectDB from "@/lib/db/mongodb"
import CommunityRequest from "@/lib/models/community-request.model"
import Community from "@/lib/models/community.model"
import { requireAuth, handleApiError } from "@/lib/middleware/auth"
import { validateBody } from "@/lib/middleware/validate"
import { createCommunityRequestSchema } from "@/lib/validations/community.schema"

// POST: Submit a new community request
export async function POST(request: Request) {
    try {
        const auth = await requireAuth()
        const { data, error } = await validateBody(request, createCommunityRequestSchema)
        if (error) return error

        await connectDB()

        const slug = data.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")

        // Check for existing community
        const existingCommunity = await Community.findOne({ slug })
        if (existingCommunity) {
            // Auto-reject logic: Create a record but mark as auto-rejected
            const autoRejectedRequest = await CommunityRequest.create({
                ...data,
                slug,
                requestedBy: auth.userId,
                status: "auto_rejected",
                reviewNote: `A community with the slug '${slug}' (Name: ${existingCommunity.name}) already exists.`,
            })

            return NextResponse.json({
                request: autoRejectedRequest,
                autoRejected: true,
                reason: "A community with this name already exists."
            }, { status: 200 }) // Return 200 so frontend can show distinct UI flow
        }

        // Check for existing pending request by same user (optional spam prevention)
        // For now, allow multiple.

        const newRequest = await CommunityRequest.create({
            ...data,
            slug,
            requestedBy: auth.userId,
            status: "pending",
        })

        return NextResponse.json({ request: newRequest, autoRejected: false }, { status: 201 })
    } catch (err) {
        return handleApiError(err)
    }
}

// GET: List my requests
export async function GET(request: NextRequest) {
    try {
        const auth = await requireAuth()
        await connectDB()

        const requests = await CommunityRequest.find({ requestedBy: auth.userId })
            .sort({ createdAt: -1 })
            .lean()

        return NextResponse.json({ requests })
    } catch (err) {
        return handleApiError(err)
    }
}
