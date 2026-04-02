import { NextResponse, type NextRequest } from "next/server"
import connectDB from "@/lib/db/mongodb"
import Community from "@/lib/models/community.model"
import { requireAuth, handleApiError } from "@/lib/middleware/auth"
import { validateBody } from "@/lib/middleware/validate"
import { createCommunitySchema } from "@/lib/validations/community.schema"

export async function POST(request: Request) {
  try {
    const auth = await requireAuth()
    const { data, error } = await validateBody(request, createCommunitySchema)
    if (error) return error

    await connectDB()

    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")

    const existingSlug = await Community.findOne({ slug })
    if (existingSlug) {
      return NextResponse.json({ error: "A community with this name already exists" }, { status: 409 })
    }

    const community = await Community.create({
      ...data,
      slug,
      createdBy: auth.userId,
      adminIds: [auth.userId],
      status: "pending",
    })

    return NextResponse.json({ community }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = request.nextUrl
    const status = searchParams.get("status") || "active"
    const search = searchParams.get("search")
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50)
    const page = parseInt(searchParams.get("page") || "1")

    const query: Record<string, unknown> = { status }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { tags: { $in: [search.toLowerCase()] } },
      ]
    }

    const [communities, total] = await Promise.all([
      Community.find(query)
        .sort({ memberCount: -1 })
        .populate("createdBy", "username")
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Community.countDocuments(query),
    ])

    return NextResponse.json({
      communities,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err) {
    return handleApiError(err)
  }
}
