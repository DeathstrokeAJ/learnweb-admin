import { NextResponse, type NextRequest } from "next/server"
import connectDB from "@/lib/db/mongodb"
import ChatRoom from "@/lib/models/chat-room.model"
import User from "@/lib/models/user.model"
import Message from "@/lib/models/message.model"
import { requireAuth, handleApiError } from "@/lib/middleware/auth"

export async function GET(request: NextRequest) {
    try {
        const auth = await requireAuth()
        await connectDB()

        const rooms = await ChatRoom.find({ participants: auth.userId })
            .sort({ lastMessageAt: -1 })
            .populate("participants", "username displayName avatar")
            .populate({
                path: "lastMessage",
                select: "content type senderId roomId createdAt",
                populate: { path: "senderId", select: "username displayName avatar _id" }
            })
            .lean()

        return NextResponse.json(rooms)
    } catch (err) {
        return handleApiError(err)
    }
}

export async function POST(request: Request) {
    try {
        const auth = await requireAuth()
        const { participantId } = await request.json()

        if (!participantId) {
            return NextResponse.json({ error: "Participant ID is required" }, { status: 400 })
        }

        await connectDB()

        // Check if room already exists for direct messages
        const existingRoom = await ChatRoom.findOne({
            type: "direct",
            participants: { $all: [auth.userId, participantId] },
        }).populate("participants", "username displayName avatar")

        if (existingRoom) {
            return NextResponse.json(existingRoom)
        }

        // Verify participant exists
        const participant = await User.findById(participantId)
        if (!participant) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const room = await ChatRoom.create({
            participants: [auth.userId, participantId],
            type: "direct",
            lastMessageAt: new Date(),
        })

        const populated = await ChatRoom.findById(room._id)
            .populate("participants", "username displayName avatar")

        return NextResponse.json(populated, { status: 201 })
    } catch (err) {
        return handleApiError(err)
    }
}
