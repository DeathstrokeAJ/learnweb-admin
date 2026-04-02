import { config } from "dotenv"
config()

import mongoose from "mongoose"
import connectDB from "../lib/db/mongodb"
import Post from "../lib/models/post.model"
import User from "../lib/models/user.model"

async function verify() {
    console.log("🔍 Verifying 'voyager_09' Profile Data...")

    try {
        if (!process.env.MONGODB_URI) {
            process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/listing-app"
        }

        await connectDB()

        const u = await User.findOne({ username: "voyager_09" })
        if (!u) {
            console.log("❌ User 'voyager_09' NOT FOUND found.")
            return
        }

        console.log(`✅ User Found: ${u.displayName} (@${u.username})`)
        console.log(`   ID: ${u._id}`)
        console.log(`   Following: ${u.following?.length || 0}`)
        console.log(`   Followers: ${u.followers?.length || 0}`)
        console.log(`   Saved Posts: ${u.savedPosts?.length || 0}`)

        const posts = await Post.find({ userId: u._id })
        console.log(`\n📚 Authored Posts: ${posts.length}`)
        posts.forEach(p => console.log(`   - "${p.title}" (${p.postType})`))

    } catch (error) {
        console.error("❌ Verification failed:", error)
    } finally {
        await mongoose.disconnect()
        process.exit(0)
    }
}

verify()
