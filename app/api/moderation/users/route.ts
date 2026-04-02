import { NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import User from "@/lib/models/user.model"
import { requireRole, handleApiError } from "@/lib/middleware/auth"

export async function GET() {
    try {
        await requireRole("MODERATOR", "SUPER_ADMIN")
        await connectDB()

        // Fetch users with high risk scores or recent violations
        const highRiskUsers = await User.find({
            $or: [
                { riskScore: { $gt: 50 } },
                { "reputation.strikes": { $gt: 0 } }
            ]
        })
            .sort({ riskScore: -1 })
            .select("-password")

        return NextResponse.json(highRiskUsers)
    } catch (err) {
        return handleApiError(err)
    }
}

export async function PATCH(request: Request) {
    try {
        await requireRole("MODERATOR", "SUPER_ADMIN")
        await connectDB()

        const { userId, action, reason } = await request.json()

        let update = {}
        if (action === "suspend") {
            update = { status: "suspended", suspensionReason: reason }
        } else if (action === "warn") {
            update = { $inc: { "reputation.strikes": 1 } }
        } else if (action === "clear") {
            update = { riskScore: 0, "reputation.strikes": 0 }
        }

        const user = await User.findByIdAndUpdate(userId, update, { new: true })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        return NextResponse.json({ message: `User ${action}ed successfully`, user })
    } catch (err) {
        return handleApiError(err)
    }
}
