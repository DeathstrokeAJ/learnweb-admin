import { NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import SystemConfig from "@/lib/models/system-config.model"
import { requireRole, handleApiError } from "@/lib/middleware/auth"

export async function GET() {
  try {
    await requireRole("SUPER_ADMIN")
    await connectDB()

    const config = await SystemConfig.findOne({ key: "GLOBAL_CONFIG" })

    if (!config) {
      // Return defaults if not found
      return NextResponse.json({
        key: "GLOBAL_CONFIG",
        riskThreshold: 0.7,
        autoFlagThreshold: 5,
        autoRemoveThreshold: 10,
        enableAIModeration: true,
        enableRecommendations: true,
        enableRealtime: true,
        maxStrikesBeforeBan: 3
      })
    }

    return NextResponse.json(config)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PATCH(request: Request) {
  try {
    await requireRole("SUPER_ADMIN")
    await connectDB()

    const updates = await request.json()
    const config = await SystemConfig.findOneAndUpdate(
      { key: "GLOBAL_CONFIG" },
      { $set: updates },
      { new: true, upsert: true }
    )

    return NextResponse.json({ message: "Configuration updated successfully", config })
  } catch (err) {
    return handleApiError(err)
  }
}
