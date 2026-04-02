import { NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import AuditLog from "@/lib/models/audit-log.model"
import { requireRole, handleApiError } from "@/lib/middleware/auth"

export async function GET() {
    try {
        await requireRole("MODERATOR", "SUPER_ADMIN")
        await connectDB()

        const activities = await AuditLog.find({})
            .sort({ createdAt: -1 })
            .limit(15)
            .populate("performedBy", "username avatar")
            .lean()

        return NextResponse.json(activities)
    } catch (err) {
        return handleApiError(err)
    }
}
