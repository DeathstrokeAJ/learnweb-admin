import mongoose, { Schema, type Document } from "mongoose"

export interface IAuditLog extends Document {
  _id: mongoose.Types.ObjectId
  performedBy: mongoose.Types.ObjectId
  action: string
  targetType: "user" | "post" | "community" | "ticket" | "config"
  targetId: mongoose.Types.ObjectId
  details: Record<string, unknown>
  ipAddress?: string
  createdAt: Date
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    targetType: { type: String, enum: ["user", "post", "community", "ticket", "config"], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    details: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

AuditLogSchema.index({ performedBy: 1, createdAt: -1 })
AuditLogSchema.index({ targetType: 1, targetId: 1 })

export const AuditLog = mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema)
export default AuditLog
