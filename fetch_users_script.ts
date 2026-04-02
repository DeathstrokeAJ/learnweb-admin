import { config } from "dotenv"
config()
import mongoose from "mongoose"
import User from "./lib/models/user.model"

async function fetchUsers() {
    console.log("🔍 Fetching All Users...")
    try {
        const uri = process.env.MONGODB_URI
        if (!uri) {
            console.error("❌ MONGODB_URI not found in .env")
            process.exit(1)
        }
        await mongoose.connect(uri)
        console.log("✅ Connected to Database")

        const users = await User.find({}, 'username email passwordHash role')
        
        console.log("\n👤 User List:")
        console.log("--------------------------------------------------")
        users.forEach(u => {
            console.log(`Username: ${u.username}`)
            console.log(`Email:    ${u.email}`)
            console.log(`Hash:     ${u.passwordHash}`)
            console.log(`Role:     ${u.role}`)
            console.log("--------------------------------------------------")
        })

        console.log(`\nTotal Users: ${users.length}`)

    } catch (err) {
        console.error("❌ Error:", err)
    } finally {
        await mongoose.disconnect()
        process.exit(0)
    }
}

fetchUsers()
