import { z } from "zod"

export const createPostSchema = z.object({
  communityId: z.string().optional(),
  postType: z.enum([
    "tutorial", "code_snippet", "project_showcase", "debug_help",
    "resource_share", "discussion", "poll", "challenge",
    "blog", "video", "meme", "tip", "question", "quiz",
  ]),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  mediaRefs: z.array(z.string()).optional().default([]),
  codeSnippet: z.string().max(5000).optional(),
  codeLanguage: z.string().optional(),
  externalUrl: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string()).max(10).optional().default([]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional().default("beginner"),
  pollOptions: z
    .array(z.object({ text: z.string().min(1).max(200) }))
    .min(2)
    .max(10)
    .optional(),
  quizOptions: z
    .array(
      z.object({
        text: z.string().min(1).max(200),
        isCorrect: z.boolean(),
        explanation: z.string().optional(),
      })
    )
    .min(2)
    .max(10)
    .optional(),
})

export type CreatePostInput = z.infer<typeof createPostSchema>
