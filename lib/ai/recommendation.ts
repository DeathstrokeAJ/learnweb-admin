import redis from "@/lib/db/redis"
import Post, { type IPost } from "@/lib/models/post.model"
import User, { type IUser } from "@/lib/models/user.model"

interface ScoredPost {
  post: IPost
  score: number
}

// Jaccard similarity between two sets of tags
function jaccardSimilarity(setA: string[], setB: string[]): number {
  if (setA.length === 0 && setB.length === 0) return 0
  const a = new Set(setA.map((s) => s.toLowerCase()))
  const b = new Set(setB.map((s) => s.toLowerCase()))
  const intersection = new Set([...a].filter((x) => b.has(x)))
  const union = new Set([...a, ...b])
  return union.size > 0 ? intersection.size / union.size : 0
}

// Difficulty alignment score
function difficultyAlignment(postDifficulty: string, userLevel: string): number {
  const levels = { beginner: 0, intermediate: 1, advanced: 2 }
  const postLevel = levels[postDifficulty as keyof typeof levels] ?? 0
  const userLevelNum = levels[userLevel as keyof typeof levels] ?? 0
  const diff = Math.abs(postLevel - userLevelNum)

  // Perfect match = 1.0, one level off = 0.6, two levels off = 0.2
  return diff === 0 ? 1.0 : diff === 1 ? 0.6 : 0.2
}

// Engagement weight based on likes, comments, shares
function engagementWeight(post: IPost): number {
  const likeWeight = Math.log2(1 + (post.likes || 0)) * 0.4
  const commentWeight = Math.log2(1 + (post.commentCount || 0)) * 0.35
  const shareWeight = Math.log2(1 + (post.shares || 0)) * 0.25
  return Math.min(likeWeight + commentWeight + shareWeight, 1)
}

// Recency decay: newer posts score higher
function recencyScore(createdAt: Date): number {
  const hoursOld = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60)
  // Posts lose relevance over time, 50% at ~48 hours
  return 1 / (1 + hoursOld / 48)
}

export async function getPersonalizedFeed(
  userId: string,
  limit: number = 20,
  cursor?: string
): Promise<{ posts: IPost[]; nextCursor: string | null }> {
  // Try Redis cache first
  const cacheKey = `feed:${userId}:${cursor || "start"}`
  try {
    const cached = await redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }
  } catch {
    // Cache miss, continue
  }


  // Fetch user profile for personalization
  const user = await User.findById(userId).lean() as IUser | null

  // Build query: approved posts
  const query: Record<string, unknown> = { status: "approved" }
  if (cursor) {
    query._id = { $lt: cursor }
  }

  // Fallback for missing user (e.g. after DB wipe)
  if (!user) {
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("userId", "username displayName avatar email role skillLevel interests riskScore")
      .populate("communityId", "name slug icon")
      .lean() as IPost[]

    return {
      posts: posts.map(p => ({ ...p, isLiked: false, isBookmarked: false })),
      nextCursor: posts.length === limit ? posts[posts.length - 1]?._id?.toString() || null : null
    }
  }

  // Build query: approved posts from joined communities or all if no communities
  if (user.joinedCommunities && user.joinedCommunities.length > 0) {
    query.communityId = { $in: user.joinedCommunities }
  }

  // Fetch more than needed for scoring
  const candidatePosts = await Post.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 3)
    .populate("userId", "username displayName avatar email role skillLevel interests riskScore")
    .populate("communityId", "name slug icon")
    .lean() as IPost[]

  // Score each post
  const scored: ScoredPost[] = candidatePosts.map((post) => {
    const tagSim = jaccardSimilarity(post.tags || [], user.interests || [])
    const diffAlign = difficultyAlignment(post.difficulty || "beginner", user.skillLevel || "beginner")
    const engagement = engagementWeight(post)
    const recency = recencyScore(post.createdAt)
    const toxicityPenalty = (post.riskScore || 0) * 0.5

    // Final weighted score
    const score =
      engagement * 0.25 +
      tagSim * 0.25 +
      diffAlign * 0.2 +
      recency * 0.2 -
      toxicityPenalty * 0.1

    return { post, score }
  })

  // Sort by score descending, then take limit
  scored.sort((a, b) => b.score - a.score)
  const topPosts = scored.slice(0, limit).map((s) => s.post)

  const nextCursor = topPosts.length === limit
    ? topPosts[topPosts.length - 1]?._id?.toString() || null
    : null

  const hydratedPosts = topPosts.map(post => {
    const p = { ...post } as any
    p.isLiked = post.likedBy?.some(id => id.toString() === userId) || false
    p.isBookmarked = post.bookmarkedBy?.some(id => id.toString() === userId) || false
    return p
  })

  const result = { posts: hydratedPosts, nextCursor }

  // Cache for 5 minutes
  try {
    await redis.setex(cacheKey, 300, JSON.stringify(result))
  } catch {
    // Cache write failure is non-critical
  }

  return result
}
