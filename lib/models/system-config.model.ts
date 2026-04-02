import mongoose, { Schema, type Document } from "mongoose"

export interface ISystemConfig extends Document {
  _id: mongoose.Types.ObjectId
  key: string
  riskThreshold: number
  autoFlagThreshold: number
  autoRemoveThreshold: number
  enableAIModeration: boolean
  enableRecommendations: boolean
  enableRealtime: boolean
  maxStrikesBeforeBan: number
  difficultyDistribution: {
    beginner: number
    intermediate: number
    advanced: number
  }
  feedCacheTTL: number
  updatedBy: mongoose.Types.ObjectId
  updatedAt: Date
}

const SystemConfigSchema = new Schema<ISystemConfig>(
  {
    key: { type: String, default: "global", unique: true },
    riskThreshold: { type: Number, default: 0.7, min: 0, max: 1 },
    autoFlagThreshold: { type: Number, default: 0.5, min: 0, max: 1 },
    autoRemoveThreshold: { type: Number, default: 0.9, min: 0, max: 1 },
    enableAIModeration: { type: Boolean, default: true },
    enableRecommendations: { type: Boolean, default: true },
    enableRealtime: { type: Boolean, default: true },
    maxStrikesBeforeBan: { type: Number, default: 3 },
    difficultyDistribution: {
      beginner: { type: Number, default: 0.4 },
      intermediate: { type: Number, default: 0.4 },
      advanced: { type: Number, default: 0.2 },
    },
    feedCacheTTL: { type: Number, default: 300 },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
)

export const SystemConfig = mongoose.models.SystemConfig || mongoose.model<ISystemConfig>("SystemConfig", SystemConfigSchema)
export default SystemConfig
