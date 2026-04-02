import { config } from "dotenv"
config()
import mongoose from "mongoose"
import User from "./lib/models/user.model"
import Community from "./lib/models/community.model"
import Post from "./lib/models/post.model"
import ChatRoom from "./lib/models/chat-room.model"
import Message from "./lib/models/message.model"
import Comment from "./lib/models/comment.model"

async function cleanup() {
    console.log("🧨 Cleaning up database...")
    try {
        await mongoose.connect(process.env.MONGODB_URI!)
        console.log("✅ Connected to MongoDB")

        const results = await Promise.all([
            Post.deleteMany({}),
            Community.deleteMany({}),
            User.deleteMany({}),
            ChatRoom.deleteMany({}),
            Message.deleteMany({}),
            Comment.deleteMany({}),
        ])

        console.log("🗑️ Cleanup complete:")
        console.log(`   - Posts: ${results[0].deletedCount}`)
        console.log(`   - Communities: ${results[1].deletedCount}`)
        console.log(`   - Users: ${results[2].deletedCount}`)
        console.log(`   - ChatRooms: ${results[3].deletedCount}`)
        console.log(`   - Messages: ${results[4].deletedCount}`)
        console.log(`   - Comments: ${results[5].deletedCount}`)

    } catch (err) {
        console.error("❌ Cleanup failed:", err)
    } finally {
        await mongoose.disconnect()
        process.exit(0)
    }
}

cleanup()
