import mongoose, { Schema, type Document } from "mongoose"

export interface IMessage extends Document {
    _id: mongoose.Types.ObjectId
    roomId: mongoose.Types.ObjectId
    senderId: mongoose.Types.ObjectId
    content: string
    type: "text" | "image" | "post_share"
    metadata?: {
        postId?: string
        postTitle?: string
        postImage?: string
    }
    readBy: mongoose.Types.ObjectId[]
    createdAt: Date
    updatedAt: Date
}

const MessageSchema = new Schema<IMessage>(
    {
        roomId: { type: Schema.Types.ObjectId, ref: "ChatRoom", required: true },
        senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, required: true },
        type: { type: String, enum: ["text", "image", "post_share"], default: "text" },
        metadata: {
            postId: { type: String },
            postTitle: { type: String },
            postImage: { type: String },
        },
        readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    },
    { timestamps: true }
)

MessageSchema.index({ roomId: 1, createdAt: -1 })

export const Message = mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema)
export default Message
