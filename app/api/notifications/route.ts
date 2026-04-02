import { NextResponse, type NextRequest } from "next/server"
import connectDB from "@/lib/db/mongodb"
import Notification from "@/lib/models/notification.model"
import { requireAuth, handleApiError } from "@/lib/middleware/auth"

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth()
    await connectDB()

    const { searchParams } = request.nextUrl
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50)
    const unreadOnly = searchParams.get("unread") === "true"

    const query: Record<string, unknown> = { userId: auth.userId }
    if (unreadOnly) query.isRead = false

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      Notification.countDocuments({ userId: auth.userId, isRead: false }),
    ])

    return NextResponse.json({ notifications, unreadCount })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAuth()
    const body = await request.json()
    await connectDB()

    if (body.markAllRead) {
      await Notification.updateMany({ userId: auth.userId, isRead: false }, { isRead: true })
    } else if (body.notificationId) {
      await Notification.findByIdAndUpdate(body.notificationId, { isRead: true })
    }

    return NextResponse.json({ message: "Updated" })
  } catch (err) {
    return handleApiError(err)
  }
}
