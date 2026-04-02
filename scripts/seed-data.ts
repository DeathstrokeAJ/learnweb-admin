
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../lib/models/user.model";
import Community from "../lib/models/community.model";
import Post from "../lib/models/post.model";
import { hashPassword } from "../lib/auth/password";

dotenv.config({ path: ".env" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("Please define the MONGODB_URI environment variable inside .env");
    process.exit(1);
}

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI as string);
        console.log("Connected to MongoDB");

        const timestamp = Date.now();

        // Hash the password once
        const passwordHash = await hashPassword("password123");

        const usersData = [
            { username: `dev_guru_${timestamp}`, email: `guru${timestamp}@example.com`, displayName: "Dev Guru", role: "USER", skillLevel: "advanced" },
            { username: `code_ninja_${timestamp}`, email: `ninja${timestamp}@example.com`, displayName: "Code Ninja", role: "USER", skillLevel: "intermediate" },
            { username: `newbie_coder_${timestamp}`, email: `newbie${timestamp}@example.com`, displayName: "Newbie Coder", role: "USER", skillLevel: "beginner" },
            { username: `tech_lead_${timestamp}`, email: `lead${timestamp}@example.com`, displayName: "Tech Lead", role: "USER", skillLevel: "advanced" },
            { username: `bug_hunter_${timestamp}`, email: `hunter${timestamp}@example.com`, displayName: "Bug Hunter", role: "USER", skillLevel: "intermediate" },
        ];

        const createdUsers = [];
        for (const userData of usersData) {
            const user = await User.create({ ...userData, passwordHash });
            createdUsers.push(user);
        }
        console.log(`Created ${createdUsers.length} users`);

        // Pick 2 users to be community admins
        const admin1 = createdUsers[0];
        const admin2 = createdUsers[3];

        const communitiesData = [
            {
                name: `Web Dev Wizards ${timestamp}`,
                slug: `web-dev-wizards-${timestamp}`,
                description: "A place for all things web development.",
                createdBy: admin1._id,
                adminIds: [admin1._id],
                status: "active",
            },
            {
                name: `Mobile App Masters ${timestamp}`,
                slug: `mobile-app-masters-${timestamp}`,
                description: "Discussing Flutter, React Native, and native development.",
                createdBy: admin2._id,
                adminIds: [admin2._id],
                status: "active",
            },
        ];

        const createdCommunities = [];
        for (const commData of communitiesData) {
            const community = await Community.create(commData);
            createdCommunities.push(community);
        }
        console.log(`Created ${createdCommunities.length} communities`);

        const postTypes = ["discussion", "question", "tip", "challenge"];
        const postsData = [];

        for (const user of createdUsers) {
            for (let i = 0; i < 4; i++) {
                const community = createdCommunities[i % 2]; // Alternate communities
                const type = postTypes[i % postTypes.length]; // Cycle types

                postsData.push({
                    userId: user._id,
                    communityId: community._id,
                    postType: type,
                    title: `${type.toUpperCase()}: Topic ${i + 1} by ${user.displayName}`,
                    content: `This is a sample ${type} post content to populate the database. It is text-only and requires no external media.`,
                    status: "approved",
                    difficulty: user.skillLevel,
                    tags: ["seed", type, "test"],
                });
            }
        }

        const createdPosts = await Post.insertMany(postsData);
        console.log(`Created ${createdPosts.length} posts`);

        // Update community post counts
        for (const community of createdCommunities) {
            const count = await Post.countDocuments({ communityId: community._id });
            await Community.findByIdAndUpdate(community._id, { postCount: count });
        }
        console.log("Updated community post counts");

        console.log("Seeding complete! You can login with 'password123' for any created user.");
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
}

seed();
