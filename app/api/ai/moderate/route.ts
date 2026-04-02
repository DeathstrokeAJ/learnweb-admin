import { NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import Post from "@/lib/models/post.model"
import ModerationTicket from "@/lib/models/moderation-ticket.model"
import SystemConfig from "@/lib/models/system-config.model"
import { moderateContent, shouldEscalateToAI } from "@/lib/ai/moderation"
import { moderateWithAI } from "@/lib/ai/openrouter"
import { requireAuth, handleApiError } from "@/lib/middleware/auth"

export async function POST(request: Request) {
  try {
    const auth = await requireAuth()
    const body = await request.json()
    const { postId } = body

    if (!postId) {
      return NextResponse.json({ error: "postId required" }, { status: 400 })
    }

    await connectDB()

    const post = await Post.findById(postId)
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Get system config for thresholds
    let config = await SystemConfig.findOne({ key: "global" })
    if (!config) {
      config = await SystemConfig.create({ key: "global" })
    }

    // Step 1: Rule-based moderation
    let result = moderateContent(post.content, post.title)

    // Step 2: If borderline and AI moderation enabled, escalate to OpenRouter
    if (config.enableAIModeration && shouldEscalateToAI(result)) {
      const aiResult = await moderateWithAI(post.content, post.title)
      if (aiResult) {
        // Blend both results, preferring AI scores
        result = {
          toxicityScore: aiResult.toxicityScore * 0.7 + result.toxicityScore * 0.3,
          spamScore: aiResult.spamScore * 0.7 + result.spamScore * 0.3,
          nsfwScore: aiResult.nsfwScore * 0.7 + result.nsfwScore * 0.3,
          overallRisk: aiResult.overallRisk * 0.7 + result.overallRisk * 0.3,
          flags: [...new Set([...result.flags, ...aiResult.flags])],
          moderatedBy: "blended",
        }
      }
    }

    // Step 3: Update post with moderation results
    post.riskScore = result.overallRisk
    post.aiModerationDetails = {
      ...result,
      moderatedAt: new Date(),
    }

    // Step 4: Apply thresholds
    if (result.overallRisk >= config.autoRemoveThreshold) {
      post.status = "removed"
    } else if (result.overallRisk >= config.autoFlagThreshold) {
      post.status = "flagged"

      // Create moderation ticket
      const priority =
        result.overallRisk >= 0.8 ? "critical" :
        result.overallRisk >= 0.6 ? "high" :
        result.overallRisk >= 0.4 ? "medium" : "low"

      await ModerationTicket.create({
        postId: post._id,
        reportedUserId: post.userId,
        communityId: post.communityId,
        reason: `AI moderation flagged: ${result.flags.join(", ")}`,
        category: result.flags[0] || "general",
        aiScore: result.overallRisk,
        aiDetails: result,
        priority,
        status: "open",
      })
    } else {
      post.status = "approved"
    }

    await post.save()

    return NextResponse.json({
      post: post.toJSON(),
      moderation: result,
      decision: post.status,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
