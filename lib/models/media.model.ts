import mongoose, { Schema, type Document } from "mongoose"

export interface IMedia extends Document {
    filename: string
    mimetype: string
    data: Buffer
    uploadedBy: mongoose.Types.ObjectId
    createdAt: Date
}

const MediaSchema = new Schema<IMedia>(
    {
        filename: { type: String, required: true },
        mimetype: { type: String, required: true },
        data: { type: Buffer, required: true },
        uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true }
)

export const Media = mongoose.models.Media || mongoose.model<IMedia>("Media", MediaSchema)
export default Media
