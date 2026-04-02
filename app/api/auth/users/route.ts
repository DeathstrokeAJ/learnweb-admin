import { NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import User from "@/lib/models/user.model"
import { handleApiError } from "@/lib/middleware/auth"

export async function GET(req: Request) {
    try {
        await connectDB()

        const { searchParams } = new URL(req.url)
        const query = searchParams.get("search")
        const limit = parseInt(searchParams.get("limit") || "5")

        if (!query) {
            return NextResponse.json({ users: [] })
        }

        const regex = new RegExp(query, "i") // case-insensitive

        const users = await User.find({
            $or: [
                { username: { $regex: regex } },
                { displayName: { $regex: regex } },
            ],
        })
            .select("username displayName avatar _id")
            .limit(limit)

        return NextResponse.json({ users })
    } catch (err) {
        return handleApiError(err)
    }
}
