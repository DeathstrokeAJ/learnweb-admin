import mongoose, { Schema, type Document } from "mongoose"

export type TicketStatus = "pending" | "in_review" | "resolved" | "escalated" | "approved" | "dismissed" | "actioned"
export type TicketSeverity = "low" | "medium" | "high" | "critical"

export interface IModerationTicket extends Document {
  _id: mongoose.Types.ObjectId
  postId: mongoose.Types.ObjectId
  reportedUserId: mongoose.Types.ObjectId
  reportedBy?: mongoose.Types.ObjectId
  communityId?: mongoose.Types.ObjectId
  reason: string
  content: string
  type: string
  status: TicketStatus
  severity: TicketSeverity
  aiAnalysis?: {
    score: number
    labels: string[]
  }
  reviewedBy?: mongoose.Types.ObjectId
  reviewedAt?: Date
  action?: string
  actionNote?: string
  createdAt: Date
  updatedAt: Date
}

const ModerationTicketSchema = new Schema<IModerationTicket>(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    reportedUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reportedBy: { type: Schema.Types.ObjectId, ref: "User" },
    communityId: { type: Schema.Types.ObjectId, ref: "Community" },
    reason: { type: String, required: true, maxlength: 500 },
    content: { type: String, required: true },
    type: { type: String, default: "content_manual" },
    status: { type: String, enum: ["pending", "in_review", "resolved", "escalated", "approved", "dismissed", "actioned"], default: "pending" },
    severity: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
    aiAnalysis: {
      score: { type: Number, default: 0 },
      labels: [{ type: String }],
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    action: { type: String },
    actionNote: { type: String, maxlength: 500 },
  },
  { timestamps: true }
)

ModerationTicketSchema.index({ status: 1, severity: -1, createdAt: -1 })
ModerationTicketSchema.index({ postId: 1 })
ModerationTicketSchema.index({ reportedUserId: 1 })
ModerationTicketSchema.index({ communityId: 1, status: 1 })

export const ModerationTicket = mongoose.models.ModerationTicket || mongoose.model<IModerationTicket>("ModerationTicket", ModerationTicketSchema)
export default ModerationTicket
