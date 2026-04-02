import mongoose, { Schema, type Document } from "mongoose"

export interface IChatRoom extends Document {
    _id: mongoose.Types.ObjectId
    participants: mongoose.Types.ObjectId[]
    type: "direct" | "group"
    name?: string
    lastMessage?: mongoose.Types.ObjectId
    lastMessageAt?: Date
    createdAt: Date
    updatedAt: Date
}

const ChatRoomSchema = new Schema<IChatRoom>(
    {
        participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
        type: { type: String, enum: ["direct", "group"], default: "direct" },
        name: { type: String },
        lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },
        lastMessageAt: { type: Date },
    },
    { timestamps: true }
)

ChatRoomSchema.index({ participants: 1 })
ChatRoomSchema.index({ lastMessageAt: -1 })

export const ChatRoom = mongoose.models.ChatRoom || mongoose.model<IChatRoom>("ChatRoom", ChatRoomSchema)
export default ChatRoom
