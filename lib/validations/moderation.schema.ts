import { z } from "zod"

export const moderateActionSchema = z.object({
  action: z.enum(["approve", "dismiss", "strike", "ban", "suspend"]),
  note: z.string().max(500).optional(),
  suspendDays: z.number().min(1).max(365).optional(),
})

export const reportContentSchema = z.object({
  postId: z.string().min(1),
  reason: z.string().min(5).max(500),
  category: z.enum(["spam", "harassment", "nsfw", "misinformation", "other"]).optional().default("other"),
})

export type ModerateActionInput = z.infer<typeof moderateActionSchema>
export type ReportContentInput = z.infer<typeof reportContentSchema>
