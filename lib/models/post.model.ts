import mongoose, { Schema, type Document } from "mongoose"
import "./community.model" // Ensure Community model is registered

export type PostType =
  | "tutorial"
  | "code_snippet"
  | "project_showcase"
  | "debug_help"
  | "resource_share"
  | "discussion"
  | "poll"
  | "challenge"
  | "blog"
  | "video"
  | "meme"
  | "tip"
  | "question"
  | "quiz"

export type PostStatus = "pending" | "approved" | "flagged" | "removed"
export type DifficultyLevel = "beginner" | "intermediate" | "advanced"

export interface IQuizOption {
  text: string
  isCorrect: boolean
  explanation?: string
}

export interface IPost extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  communityId: mongoose.Types.ObjectId
  postType: PostType
  title: string
  content: string
  mediaRefs: string[]
  codeSnippet?: string
  codeLanguage?: string
  externalUrl?: string
  tags: string[]
  difficulty: DifficultyLevel
  status: PostStatus
  riskScore: number
  aiModerationDetails?: {
    toxicityScore: number
    spamScore: number
    nsfwScore: number
    overallRisk: number
    moderatedBy: string
    moderatedAt: Date
  }
  likes: number
  likedBy: mongoose.Types.ObjectId[]
  commentCount: number
  shares: number
  bookmarks: number
  bookmarkedBy: mongoose.Types.ObjectId[]
  engagementScore: number
  pollOptions?: { text: string; votes: number; votedBy: mongoose.Types.ObjectId[] }[]
  quizOptions?: IQuizOption[]
  isEdited: boolean
  editedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const PostSchema = new Schema<IPost>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    communityId: { type: Schema.Types.ObjectId, ref: "Community", required: false, index: true },
    postType: {
      type: String,
      enum: ["tutorial", "code_snippet", "project_showcase", "debug_help", "resource_share", "discussion", "poll", "challenge", "blog", "video", "meme", "tip", "question", "quiz"],
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true, maxlength: 10000 },
    mediaRefs: [{ type: String }],
    codeSnippet: { type: String, maxlength: 5000 },
    codeLanguage: { type: String },
    externalUrl: { type: String },
    tags: [{ type: String, lowercase: true }],
    difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
    status: { type: String, enum: ["pending", "approved", "flagged", "removed"], default: "pending" },
    riskScore: { type: Number, default: 0, min: 0, max: 1 },
    aiModerationDetails: {
      toxicityScore: Number,
      spamScore: Number,
      nsfwScore: Number,
      overallRisk: Number,
      moderatedBy: String,
      moderatedAt: Date,
    },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    commentCount: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    bookmarks: { type: Number, default: 0 },
    bookmarkedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    engagementScore: { type: Number, default: 0 },
    pollOptions: [
      {
        text: String,
        votes: { type: Number, default: 0 },
        votedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
      },
    ],
    quizOptions: [
      {
        text: { type: String, required: true },
        isCorrect: { type: Boolean, required: true },
        explanation: { type: String },
      },
    ],
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },
  },
  { timestamps: true }
)

PostSchema.index({ communityId: 1, createdAt: -1 })
PostSchema.index({ userId: 1, createdAt: -1 })
PostSchema.index({ status: 1, riskScore: -1 })
PostSchema.index({ tags: 1 })
PostSchema.index({ engagementScore: -1 })
PostSchema.index({ postType: 1, createdAt: -1 })

export const Post = mongoose.models.Post || mongoose.model<IPost>("Post", PostSchema)
export default Post
