import { NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import Community from "@/lib/models/community.model"
import AuditLog from "@/lib/models/audit-log.model"
import { requireRole, handleApiError } from "@/lib/middleware/auth"

export async function GET() {
  try {
    await requireRole("SUPER_ADMIN")
    await connectDB()

    const pendingRequests = await Community.find({ status: { $in: ["pending", "active", "rejected"] } })
      .sort({ createdAt: -1 })
      .populate("createdBy", "username email avatar")
      .lean()

    const mapped = pendingRequests.map((r: any) => ({
      id: r._id.toString(),
      name: r.name,
      slug: r.slug,
      description: r.description,
      status: r.status === "active" ? "approved" : r.status, // Map active to approved for UI
      category: r.category || "General",
      reason: r.reason || "No reason provided",
      memberEstimate: r.memberEstimate || 0,
      requestedBy: r.createdBy?.username || "Unknown",
      requestedByEmail: r.createdBy?.email || "Unknown",
      rules: r.rules || [],
      submittedAt: new Date(r.createdAt).toLocaleDateString(),
    }))

    return NextResponse.json(mapped)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole("SUPER_ADMIN")
    await connectDB()

    const { communityId, action } = await request.json()

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const status = action === "approve" ? "active" : "rejected"
    const community = await Community.findByIdAndUpdate(
      communityId,
      { status },
      { new: true }
    )

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 })
    }

    await AuditLog.create({
      performedBy: (auth as any).userId,
      action: `admin:${action}_community`,
      targetType: "community",
      targetId: community._id,
      details: { communityId, name: community.name }
    })

    return NextResponse.json({ message: `Community ${action}d successfully`, community })
  } catch (err) {
    return handleApiError(err)
  }
}
