import { NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import Media from "@/lib/models/media.model"
import { requireAuth, handleApiError } from "@/lib/middleware/auth"

export async function POST(request: Request) {
    try {
        const auth = await requireAuth()
        await connectDB()

        const formData = await request.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
        }

        const buffer = Buffer.from(await file.arrayBuffer())

        const media = await Media.create({
            filename: file.name,
            mimetype: file.type,
            data: buffer,
            uploadedBy: auth.userId,
        })

        // Return the URL to access the media
        // Assuming the API is hosted at /api
        const url = `/api/media/${media._id}`

        return NextResponse.json({ url, mediaId: media._id }, { status: 201 })
    } catch (err) {
        return handleApiError(err)
    }
}
