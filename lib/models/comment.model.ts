import mongoose, { Schema, type Document } from "mongoose"
import "./post.model" // Ensure Post model is registered
import "./user.model" // Ensure User model is registered

export interface IComment extends Document {
  _id: mongoose.Types.ObjectId
  postId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  parentId?: mongoose.Types.ObjectId
  content: string
  likes: number
  likedBy: mongoose.Types.ObjectId[]
  isEdited: boolean
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}

const CommentSchema = new Schema<IComment>(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    parentId: { type: Schema.Types.ObjectId, ref: "Comment" },
    content: { type: String, required: true, maxlength: 2000 },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
)

CommentSchema.index({ postId: 1, createdAt: -1 })

export const Comment = mongoose.models.Comment || mongoose.model<IComment>("Comment", CommentSchema)
export default Comment
