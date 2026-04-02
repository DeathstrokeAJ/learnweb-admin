import { NextResponse, type NextRequest } from "next/server"
import connectDB from "@/lib/db/mongodb"
import { getPersonalizedFeed } from "@/lib/ai/recommendation"
import { requireAuth, handleApiError } from "@/lib/middleware/auth"

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth()
    await connectDB()

    const { searchParams } = request.nextUrl
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50)
    const cursor = searchParams.get("cursor") || undefined

    const result = await getPersonalizedFeed(auth.userId, limit, cursor)

    return NextResponse.json(result)
  } catch (err) {
    return handleApiError(err)
  }
}
