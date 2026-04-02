import { config } from "dotenv"
config() // Load .env

import mongoose from "mongoose"
import connectDB from "../lib/db/mongodb"
import Post from "../lib/models/post.model"
import Community from "../lib/models/community.model"

async function deleteDemoPosts() {
    console.log("🗑️ Deleting Demo Posts...")

    try {
        if (!process.env.MONGODB_URI) {
            process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/listing-app"
        }

        await connectDB()
        console.log("✅ Connected to MongoDB")

        // Find demo posts first to handle community post count updates
        const demoPosts = await Post.find({ tags: "demo" })

        if (demoPosts.length === 0) {
            console.log("ℹ️ No demo posts found to delete.")
            return
        }

        console.log(`Found ${demoPosts.length} demo posts.`)

        let deletedCount = 0

        for (const post of demoPosts) {
            // Delete the post
            await Post.deleteOne({ _id: post._id })

            // Decrement community post count if applicable
            if (post.communityId) {
                await Community.findByIdAndUpdate(post.communityId, { $inc: { postCount: -1 } })
            }

            deletedCount++
        }

        console.log(`✅ Successfully deleted ${deletedCount} demo posts and updated community counts!`)

    } catch (error) {
        console.error("❌ Deletion failed:", error)
    } finally {
        await mongoose.disconnect()
        process.exit(0)
    }
}

deleteDemoPosts()
