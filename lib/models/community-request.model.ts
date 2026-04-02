import mongoose, { Schema, type Document } from "mongoose"

export type CommunityRequestStatus = "pending" | "approved" | "rejected" | "auto_rejected"

export interface ICommunityRequest extends Document {
    _id: mongoose.Types.ObjectId
    name: string
    slug: string
    description: string
    purpose: string
    status: CommunityRequestStatus
    requestedBy: mongoose.Types.ObjectId
    reviewedBy?: mongoose.Types.ObjectId
    reviewNote?: string
    communityId?: mongoose.Types.ObjectId
    createdAt: Date
    updatedAt: Date
}

const CommunityRequestSchema = new Schema<ICommunityRequest>(
    {
        name: { type: String, required: true, trim: true, maxlength: 100 },
        slug: { type: String, required: true, lowercase: true },
        description: { type: String, required: true, maxlength: 1000 },
        purpose: { type: String, required: true, maxlength: 1000 },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected", "auto_rejected"],
            default: "pending",
        },
        requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
        reviewNote: { type: String },
        communityId: { type: Schema.Types.ObjectId, ref: "Community" },
    },
    { timestamps: true }
)

CommunityRequestSchema.index({ slug: 1 })
CommunityRequestSchema.index({ status: 1 })
CommunityRequestSchema.index({ requestedBy: 1 })

export const CommunityRequest =
    mongoose.models.CommunityRequest || mongoose.model<ICommunityRequest>("CommunityRequest", CommunityRequestSchema)

export default CommunityRequest
