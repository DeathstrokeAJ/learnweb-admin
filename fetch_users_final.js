const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function fetchUsers() {
    console.log("🔍 Fetching All Users...");
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.error("❌ MONGODB_URI not found in .env");
            process.exit(1);
        }
        await mongoose.connect(uri);
        console.log("✅ Connected to Database");

        // We use the collection name directly to avoid schema issues
        const users = await mongoose.connection.db.collection('users').find({}).toArray();
        
        console.log("\n👤 User List:");
        console.log("--------------------------------------------------");
        users.forEach(u => {
            console.log(`Username: ${u.username}`);
            console.log(`Email:    ${u.email}`);
            console.log(`Hash:     ${u.passwordHash || u.password}`); // Check both just in case
            console.log(`Role:     ${u.role}`);
            console.log("--------------------------------------------------");
        });

        console.log(`\nTotal Users: ${users.length}`);

    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

fetchUsers();
