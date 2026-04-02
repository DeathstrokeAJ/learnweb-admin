import mongoose, { Schema, type Document } from "mongoose"

export type UserRole = "USER" | "COMMUNITY_ADMIN" | "MODERATOR" | "SUPER_ADMIN"
export type SkillLevel = "beginner" | "intermediate" | "advanced"

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId
  username: string
  email: string
  passwordHash: string
  displayName: string
  avatar?: string
  bio?: string
  role: UserRole
  skillLevel: SkillLevel
  joinedCommunities: mongoose.Types.ObjectId[]
  followers: mongoose.Types.ObjectId[]
  following: mongoose.Types.ObjectId[]
  interests: string[]
  strikeCount: number
  riskScore: number
  isBanned: boolean
  isSuspended: boolean
  suspendedUntil?: Date
  lastActive: Date
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, required: true, trim: true, maxlength: 50 },
    avatar: { type: String },
    bio: { type: String, maxlength: 500 },
    role: { type: String, enum: ["USER", "COMMUNITY_ADMIN", "MODERATOR", "SUPER_ADMIN"], default: "USER" },
    skillLevel: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
    joinedCommunities: [{ type: Schema.Types.ObjectId, ref: "Community" }],
    // Social Graph
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: Schema.Types.ObjectId, ref: "User" }],
    interests: [{ type: String }],
    strikeCount: { type: Number, default: 0 },
    riskScore: { type: Number, default: 0, min: 0, max: 1 },
    isBanned: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    suspendedUntil: { type: Date },
    lastActive: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_, ret) {
        delete ret.passwordHash
        return ret
      },
    },
  }
)

// UserSchema.index({ email: 1 }) // Duplicate
// UserSchema.index({ username: 1 }) // Duplicate
UserSchema.index({ role: 1 })
UserSchema.index({ riskScore: -1 })

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema)
export default User
