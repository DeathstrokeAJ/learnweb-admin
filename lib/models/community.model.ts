import mongoose, { Schema, type Document } from "mongoose"

export type CommunityStatus = "pending" | "active" | "suspended" | "archived"

export interface ICommunity extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  slug: string
  description: string
  icon?: string
  banner?: string
  adminIds: mongoose.Types.ObjectId[]
  moderatorIds: mongoose.Types.ObjectId[]
  memberCount: number
  postCount: number
  healthScore: number
  flagRate: number
  status: CommunityStatus
  rules: string[]
  tags: string[]
  isPrivate: boolean
  requiresApproval: boolean
  category: string
  reason?: string
  memberEstimate?: number
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const CommunitySchema = new Schema<ICommunity>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    // slug: { type: String, required: true, unique: true, lowercase: true }, // Index managed by schema.index
    slug: { type: String, required: true, lowercase: true },
    description: { type: String, required: true, maxlength: 1000 },
    icon: { type: String },
    banner: { type: String },
    adminIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    moderatorIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    memberCount: { type: Number, default: 0 },
    postCount: { type: Number, default: 0 },
    healthScore: { type: Number, default: 1, min: 0, max: 1 },
    flagRate: { type: Number, default: 0, min: 0, max: 1 },
    status: { type: String, enum: ["pending", "active", "suspended", "archived"], default: "pending" },
    rules: [{ type: String }],
    tags: [{ type: String, lowercase: true }],
    isPrivate: { type: Boolean, default: false },
    requiresApproval: { type: Boolean, default: false },
    category: { type: String, default: "General" },
    reason: { type: String },
    memberEstimate: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
)

CommunitySchema.index({ slug: 1 })
CommunitySchema.index({ status: 1 })
CommunitySchema.index({ healthScore: -1 })
CommunitySchema.index({ tags: 1 })

export const Community = mongoose.models.Community || mongoose.model<ICommunity>("Community", CommunitySchema)
export default Community
