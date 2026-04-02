import { NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import ModerationTicket from "@/lib/models/moderation-ticket.model"
import { requireRole, handleApiError } from "@/lib/middleware/auth"

export async function GET(request: Request) {
  try {
    await requireRole("MODERATOR", "SUPER_ADMIN")
    await connectDB()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const severity = searchParams.get("severity")

    const query: any = {}
    if (status && status !== "all") query.status = status
    if (severity && severity !== "all") query.severity = severity

    const tickets = await ModerationTicket.find(query)
      .sort({ createdAt: -1 })
      .populate("reportedUserId", "username email")
      .populate("reportedBy", "username email")

    const mappedTickets = tickets.map((t: any) => ({
      ...t.toObject(),
      reportedUser: t.reportedUserId, // Map for UI
      reporter: t.reportedBy, // Map for UI
      user: t.reportedUserId, // Frontend also expects 'user' in some places
    }))

    return NextResponse.json(mappedTickets)
  } catch (err) {
    return handleApiError(err)
  }
}
