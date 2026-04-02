import { NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import Community from "@/lib/models/community.model"
import { requireAuth, handleApiError } from "@/lib/middleware/auth"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await connectDB()

    const community = await Community.findById(id)
      .populate("adminIds", "username displayName avatar")
      .populate("createdBy", "username displayName avatar")

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 })
    }

    return NextResponse.json({ community })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await requireAuth()
    const body = await request.json()

    await connectDB()

    const community = await Community.findById(id)
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 })
    }

    const isAdmin = community.adminIds.some(
      (aid: { toString: () => string }) => aid.toString() === auth.userId
    )
    const isSuperAdmin = auth.role === "SUPER_ADMIN"

    if (!isAdmin && !isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    Object.assign(community, body)
    await community.save()

    return NextResponse.json({ community })
  } catch (err) {
    return handleApiError(err)
  }
}
