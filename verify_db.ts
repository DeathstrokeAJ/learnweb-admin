import { config } from "dotenv"
config()
import mongoose from "mongoose"
import Post from "./lib/models/post.model"
import Community from "./lib/models/community.model"
import User from "./lib/models/user.model"

async function verify() {
    console.log("🔍 Verifying Database Content...")
    try {
        const uri = process.env.MONGODB_URI
        if (!uri) {
            console.error("❌ MONGODB_URI not found in .env")
            process.exit(1)
        }
        console.log(`📡 Connecting to: ${uri.split('@')[1]}`) // Log only the host part for safety
        await mongoose.connect(uri)
        console.log("✅ Connected!")

        const postCount = await Post.countDocuments()
        const userCount = await User.countDocuments()
        const communityCount = await Community.countDocuments()

        console.log(`📊 Stats:`)
        console.log(`   - Posts: ${postCount}`)
        console.log(`   - Users: ${userCount}`)
        console.log(`   - Communities: ${communityCount}`)

        console.log("\n📑 Sample Posts (Top 5):")
        const posts = await Post.find().limit(5).select('title tags userId')
        posts.forEach(p => {
            console.log(`   - [${p.title}] (Tags: ${p.tags.join(', ')})`)
        })

        console.log("\n👤 Voyager User:")
        const voyager = await User.findOne({ username: 'voyager_09' })
        if (voyager) {
            console.log(`   - Found: ${voyager.username} (${voyager.email})`)
        } else {
            console.log("   - NOT FOUND: voyager_09")
        }

    } catch (err) {
        console.error("❌ Error:", err)
    } finally {
        await mongoose.disconnect()
        process.exit(0)
    }
}

verify()
