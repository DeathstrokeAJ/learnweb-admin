import { z } from "zod"

export const createCommunitySchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  tags: z.array(z.string()).max(10).optional().default([]),
  rules: z.array(z.string()).max(20).optional().default([]),
  isPrivate: z.boolean().optional().default(false),
  requiresApproval: z.boolean().optional().default(false),
})

export const updateCommunitySchema = createCommunitySchema.partial()

export type CreateCommunityInput = z.infer<typeof createCommunitySchema>

export const createCommunityRequestSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  purpose: z.string().min(10).max(1000),
})

