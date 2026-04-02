import mongoose, { Schema, type Document } from "mongoose"

export type NotificationType =
  | "moderation_alert"
  | "ticket_resolved"
  | "new_report"
  | "role_change"
  | "community_approval"
  | "system_alert"
  | "strike_issued"
  | "user_banned"

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  type: NotificationType
  title: string
  message: string
  link?: string
  metadata?: Record<string, unknown>
  isRead: boolean
  createdAt: Date
  updatedAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["moderation_alert", "ticket_resolved", "new_report", "role_change", "community_approval", "system_alert", "strike_issued", "user_banned"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    metadata: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
)

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 })

export const Notification = mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema)
export default Notification
