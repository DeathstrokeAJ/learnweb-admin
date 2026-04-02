import { config } from "dotenv"
config()
import mongoose from "mongoose"
import Post from "./lib/models/post.model"
import User from "./lib/models/user.model"

async function verify() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!)
        const drNeural = await User.findOne({ username: 'dr_neural' })
        const transformerPost = await Post.findOne({ title: /Transformer/ })
        const totalPosts = await Post.countDocuments()

        console.log("RESULT_START")
        console.log(`DR_NEURAL: ${drNeural ? 'FOUND' : 'MISSING'}`)
        console.log(`TRANSFORMER_POST: ${transformerPost ? 'FOUND' : 'MISSING'}`)
        console.log(`TOTAL_POSTS: ${totalPosts}`)
        if (transformerPost) console.log(`SAMPLE_TITLE: ${transformerPost.title}`)
        console.log("RESULT_END")
    } catch (e) {
        console.log(`ERROR: ${e.message}`)
    } finally {
        await mongoose.disconnect()
        process.exit(0)
    }
}
verify()
