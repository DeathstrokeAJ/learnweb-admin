import { NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import Media from "@/lib/models/media.model"

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        await connectDB()

        // Validate ID format
        if (!params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return new NextResponse("Invalid ID", { status: 400 })
        }

        const media = await Media.findById(params.id)

        if (!media) {
            return new NextResponse("Media not found", { status: 404 })
        }

        // Return the image data with proper content type
        return new NextResponse(media.data, {
            headers: {
                "Content-Type": media.mimetype,
                "Content-Disposition": `inline; filename="${media.filename}"`,
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        })
    } catch (err) {
        console.error("Error serving media:", err)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
