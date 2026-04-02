import { NextResponse, type NextRequest } from "next/server"
import connectDB from "@/lib/db/mongodb"
import ChatRoom from "@/lib/models/chat-room.model"
import Message from "@/lib/models/message.model"
import { requireAuth, handleApiError } from "@/lib/middleware/auth"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ roomId: string }> }
) {
    try {
        const auth = await requireAuth()
        const { roomId } = await params
        await connectDB()

        // Verify the requesting user is actually a participant in this room
        const room = await ChatRoom.findOne({
            _id: roomId,
            participants: auth.userId,
        }).lean()

        if (!room) {
            return NextResponse.json({ error: "Room not found or access denied" }, { status: 404 })
        }

        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get("limit") ?? "50")
        const before = searchParams.get("before")

        const query: Record<string, unknown> = { roomId }
        if (before) {
            query.createdAt = { $lt: new Date(before) }
        }

        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate("senderId", "username displayName avatar _id")
            .lean()

        // Return in ascending order so the client can render them top-to-bottom
        // The flutter chat bubble builder uses `reverse: true` on the ListView,
        // so descending order is actually correct — we just send them as-is.
        return NextResponse.json(messages)
    } catch (err) {
        return handleApiError(err)
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ roomId: string }> }
) {
    try {
        const auth = await requireAuth()
        const { roomId } = await params
        const { content, type = "text", metadata } = await request.json()

        if (!content) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 })
        }

        await connectDB()

        // Verify user is a participant
        const room = await ChatRoom.findOne({
            _id: roomId,
            participants: auth.userId,
        })

        if (!room) {
            return NextResponse.json({ error: "Room not found or access denied" }, { status: 404 })
        }

        const message = await Message.create({
            roomId,
            senderId: auth.userId,
            content,
            type,
            metadata,
            readBy: [auth.userId],
        })

        // Update room's lastMessage pointer
        await ChatRoom.findByIdAndUpdate(roomId, {
            lastMessage: message._id,
            lastMessageAt: message.createdAt,
        })

        const populated = await Message.findById(message._id)
            .populate("senderId", "username displayName avatar _id")
            .lean()

        return NextResponse.json(populated, { status: 201 })
    } catch (err) {
        return handleApiError(err)
    }
}
