import { config } from "dotenv"
config()

import mongoose from "mongoose"
import connectDB from "../lib/db/mongodb"
import Post from "../lib/models/post.model"
import Community from "../lib/models/community.model"
import User from "../lib/models/user.model"
import ChatRoom from "../lib/models/chat-room.model"
import Message from "../lib/models/message.model"
import Comment from "../lib/models/comment.model"
import AuditLog from "../lib/models/audit-log.model"
import ModerationTicket from "../lib/models/moderation-ticket.model"

// ----------------------------------------------------------------------------
// 1. DATA CONFIGURATION: INTELLECTUAL NETWORK
// ----------------------------------------------------------------------------

const INTELLECTUAL_USERS = [
    // Base Users (from user request)
    { username: "dr_neural", email: "neural@demo.com", displayName: "Dr. Neural", role: "MODERATOR", bio: "AI Researcher specializing in deep learning architectures.", skillLevel: "advanced", interests: ["ai", "deep-learning"], riskScore: 0, avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=dr_neural", passwordHash: "$2a$10$Ssb6V/wO5P8L6S1wBFYIMeUuAWo9EyTxqQSOkYG2yRtAyhOm2.XX6" },
    { username: "quantum_scholar", email: "quantum@demo.com", displayName: "Quantum O.", role: "USER", bio: "Ph.D. in Quantum Information Theory.", skillLevel: "advanced", interests: ["quantum-computing", "physics"], riskScore: 0, avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=quantum", passwordHash: "$2a$10$Ssb6V/wO5P8L6S1wBFYIMeUuAWo9EyTxqQSOkYG2yRtAyhOm2.XX6" },
    { username: "cyber_researcher", email: "cyber@demo.com", displayName: "Cyber Res", role: "USER", bio: "Ethical Hacker & Security Analyst.", skillLevel: "intermediate", interests: ["cyber-security", "hacking"], riskScore: 0, avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=cyber", passwordHash: "$2a$10$Ssb6V/wO5P8L6S1wBFYIMeUuAWo9EyTxqQSOkYG2yRtAyhOm2.XX6" },
    { username: "philosophy_mind", email: "mind@demo.com", displayName: "Phil Mind", role: "USER", bio: "Exploring consciousness and AI ethics.", skillLevel: "beginner", interests: ["philosophy", "ethics"], riskScore: 0, avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=mind", passwordHash: "$2a$10$Ssb6V/wO5P8L6S1wBFYIMeUuAWo9EyTxqQSOkYG2yRtAyhOm2.XX6" },

    // Expanded Users (Expert level)
    { username: "ai_ethicist", email: "ethics@demo.com", displayName: "Elena V.", role: "USER", bio: "Advocating for responsible AI development.", skillLevel: "advanced", interests: ["ai-safety", "policy"], riskScore: 0, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=elena", passwordHash: "$2a$10$Ssb6V/wO5P8L6S1wBFYIMeUuAWo9EyTxqQSOkYG2yRtAyhOm2.XX6" },
    { username: "astro_physicist", email: "astro@demo.com", displayName: "Dr. Astro", role: "USER", bio: "Simulating galaxies with Python.", skillLevel: "advanced", interests: ["astrophysics", "simulation"], riskScore: 0, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=astro", passwordHash: "$2a$10$Ssb6V/wO5P8L6S1wBFYIMeUuAWo9EyTxqQSOkYG2yRtAyhOm2.XX6" },
    { username: "algo_master", email: "algo@demo.com", displayName: "Algo Master", role: "COMMUNITY_ADMIN", bio: "Competitive programmer and algorithm enthusiast.", skillLevel: "advanced", interests: ["algorithms", "cpp"], riskScore: 0, avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=algo", passwordHash: "$2a$10$Ssb6V/wO5P8L6S1wBFYIMeUuAWo9EyTxqQSOkYG2yRtAyhOm2.XX6" },

    // Requested Admins
    { username: "adi", email: "adi@learnweb.com", displayName: "Adi (Super)", role: "SUPER_ADMIN", bio: "Platform Architect & Overlord.", skillLevel: "advanced", interests: ["system-design", "security"], riskScore: 0, avatar: "https://api.dicebear.com/7.x/initials/svg?seed=ADI", passwordHash: "$2a$10$cJMIR7nLMFY5CGTZczDNyuyvmxRhKAvwqbZzlLNqRprfWs0ba3tgK" },
    { username: "mishra", email: "mishra@learnweb.com", displayName: "Mishra (Mod)", role: "MODERATOR", bio: "Content Governance Specialist.", skillLevel: "intermediate", interests: ["ethics", "governance"], riskScore: 0, avatar: "https://api.dicebear.com/7.x/initials/svg?seed=MISHRA", passwordHash: "$2a$10$cJMIR7nLMFY5CGTZczDNyuyvmxRhKAvwqbZzlLNqRprfWs0ba3tgK" }
]

const INTELLECTUAL_COMMUNITIES = [
    // Existing Active
    {
        name: "Artificial Intelligence",
        slug: "artificial-intelligence",
        description: "The hub for AGI, Neural Networks, and ML research.",
        category: "Technology",
        reason: "Establish a central hub for AI practitioners.",
        memberEstimate: 1200,
        icon: "https://cdn-icons-png.flaticon.com/512/2103/2103633.png",
        banner: "https://miro.medium.com/v2/resize:fit:1400/1*c_fiB-YgbnMl6nntYGBMHQ.jpeg",
        status: "active",
        keywords: ["ai", "neural", "transformer", "learning"]
    },
    {
        name: "Quantum Computing",
        slug: "quantum-computing",
        description: "Exploring qubits, superposition, and quantum algorithms.",
        category: "Science",
        reason: "Democratize quantum computing knowledge.",
        memberEstimate: 450,
        icon: "https://cdn-icons-png.flaticon.com/512/3069/3069172.png",
        banner: "https://images.theconversation.com/files/371665/original/file-20201127-13-1d01q8.jpg?ixlib=rb-1.1.0&q=45&auto=format&w=1200&h=675.0&fit=crop",
        status: "active",
        keywords: ["quantum", "physics", "superposition"]
    },
    {
        name: "Cyber Security",
        slug: "cyber-security",
        description: "Network defense, cryptography, and ethical hacking.",
        category: "Security",
        reason: "Promote ethical hacking and proactive security measures.",
        memberEstimate: 800,
        icon: "https://cdn-icons-png.flaticon.com/512/2092/2092663.png",
        banner: "https://www.simplilearn.com/ice9/free_resources_article_thumb/Cyber_Security_Tutorial.jpg",
        status: "active",
        keywords: ["cyber", "security", "hack", "crypto"]
    },
    // Pending Requests
    {
        name: "Post-Quantum Cryptography",
        slug: "pq-crypto",
        status: "pending",
        category: "Security",
        reason: "Prepare the world for the impact of quantum computing on encryption.",
        memberEstimate: 300,
        description: "Preparing for the Q-Day.",
        keywords: []
    },
    {
        name: "Neuroscience & Consciousness",
        slug: "neuro-con",
        status: "pending",
        category: "Science",
        reason: "Bridge the gap between artificial neural networks and biological ones.",
        memberEstimate: 150,
        description: "Bridging biology and philosophy.",
        keywords: []
    }
]

// Extended content templates to look "real"
const POST_TEMPLATES = [
    // --- AI / ML ---
    {
        type: "discussion",
        title: "Transformer Optimization Techniques: Beyond Attention",
        content: "We all know O(n^2) attention scaling is a bottleneck. I've been experimenting with FlashAttention-2 and seeing 3x speedups on A100s. Has anyone benchmarked this against sparse attention patterns for long-context tasks? The trade-off in recall seems negligible.",
        tags: ["research", "transformer-optimization", "discussion"],
        difficulty: "advanced",
        communityKeyword: "ai",
        codeSnippet: null,
        mediaRefs: []
    },
    {
        type: "code_snippet",
        title: "Implementing LoRA (Low-Rank Adaptation) from scratch",
        content: "Here is a minimal PyTorch implementation of LoRA for linear layers. Useful for understanding how parameter-efficient fine-tuning works under the hood.",
        codeLanguage: "python",
        codeSnippet: `class LoRALayer(nn.Module):
    def __init__(self, in_dim, out_dim, rank=4, alpha=16):
        super().__init__()
        self.std_weight = nn.Linear(in_dim, out_dim)
        self.lora_A = nn.Parameter(torch.randn(in_dim, rank))
        self.lora_B = nn.Parameter(torch.zeros(rank, out_dim))
        self.scale = alpha / rank

    def forward(self, x):
        return self.std_weight(x) + (x @ self.lora_A @ self.lora_B) * self.scale`,
        tags: ["ai", "pytorch", "code-snippet"],
        difficulty: "advanced",
        communityKeyword: "ai"
    },
    {
        type: "poll",
        title: "When will we achieve AGI?",
        content: "Given the recent pace of LLM development (GPT-4, Gemini 1.5), confidence intervals are shrinking. What is your realistic timeline?",
        tags: ["agi", "poll", "future"],
        pollOptions: [
            { text: "Before 2030", votes: 42 },
            { text: "2030 - 2040", votes: 28 },
            { text: "After 2050", votes: 15 },
            { text: "Never / It's a myth", votes: 5 }
        ],
        communityKeyword: "ai"
    },

    // --- QUANTUM ---
    {
        type: "discussion",
        title: "Quantum Supremacy Experiments: Noise vs Signal",
        content: "Recent papers suggest that classical simulation of 'quantum supremacy' circuits is catching up due to better tensor network contraction methods. Are we moving the goalposts, or was the initial claim premature?",
        tags: ["quantum-supremacy", "research", "physics"],
        difficulty: "advanced",
        communityKeyword: "quantum"
    },
    {
        type: "quiz",
        title: "Quantum Gates Fundamentals",
        content: "Quick check on your understanding of basic single-qubit gates.",
        tags: ["quantum", "quiz", "basics"],
        quizOptions: [
            { text: "Hadamard Gate creates superposition", isCorrect: true, explanation: "Hadamard transforms basis states |0> and |1> into equal superpositions." },
            { text: "Pauli-X is a phase flip", isCorrect: false, explanation: "Pauli-X is a bit flip (NOT gate), Pauli-Z is the phase flip." },
            { text: "CNOT is a single qubit gate", isCorrect: false, explanation: "CNOT is a 2-qubit logic gate." }
        ],
        communityKeyword: "quantum"
    },

    // --- CYBER SECURITY ---
    {
        type: "tutorial",
        title: "Zero Knowledge Proofs: A conceptual introduction",
        content: "Explaining ZK-SNARKs without the heavy math. Imagine you have a color-blind friend and two billiard balls...",
        tags: ["zkp", "crypto", "tutorial"],
        difficulty: "intermediate",
        communityKeyword: "cyber"
    },
    {
        type: "project_showcase",
        title: "Lattice Cryptography Library in Rust",
        content: "I built a post-quantum safe encryption library based on Learning With Errors (LWE). It's not production ready but great for learning.",
        mediaRefs: ["https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1000"],
        externalUrl: "https://github.com/example/lattice-crypto",
        tags: ["crypto", "rust", "project"],
        difficulty: "advanced",
        communityKeyword: "cyber"
    },

    // --- FLAGGED / RISKY CONTENT (from user request) ---
    {
        type: "discussion",
        title: "Buy research paper fast cheap guaranteed acceptance",
        content: "Guaranteed publication in 24 hours no peer review needed. Contact me on telegram.",
        status: "flagged",
        riskState: "flagged",
        tags: ["spam", "suspicious"],
        isRisk: true
    },
    {
        type: "resource_share",
        title: "Download premium AI course free cracked version",
        content: "Click link below to bypass payment system. Fully cracked.",
        status: "flagged",
        riskState: "restricted",
        tags: ["piracy", "abuse"],
        isRisk: true
    },
    {
        type: "question",
        title: "Is cheating acceptable in competitive coding?",
        content: "Everyone does it, so why not automate solutions unfairly? It's just efficient.",
        status: "pending",
        riskState: "review",
        tags: ["ethics-warning"],
        isRisk: true
    }
]


async function seed() {
    console.log("🌱 Seeding Intellectual Network Data & Social Graph...")

    try {
        const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/listing-app"
        console.log(`📡 Connecting to: ${uri.split('@')[1] || uri}`)

        await mongoose.connect(uri)
        console.log("✅ Connected to MongoDB")

        // --------------------------------------------------------------------
        // 1. Create Users
        // --------------------------------------------------------------------
        const userMap = new Map() // username -> userDoc
        const allUserDocs = []

        for (const u of INTELLECTUAL_USERS) {
            let user = await User.findOne({ email: u.email })
            if (!user) {
                user = await User.create({
                    ...u,
                    stats: { learning: Math.floor(Math.random() * 100), shares: Math.floor(Math.random() * 20), reputation: Math.floor(Math.random() * 1000) },
                    followers: [],
                    following: [],
                    savedPosts: []
                })
                console.log(`Created user: ${u.username}`)
            } else {
                // Reset Socials? No, keep them if existing to avoid churn, or reset if requested? 
                // We'll trust the user wants additions mostly, but let's ensure defaults exist.
            }
            userMap.set(u.username, user)
            allUserDocs.push(user)
        }

        // --------------------------------------------------------------------
        // 2. Create Mutual Follows (Social Graph)
        // --------------------------------------------------------------------
        console.log("🤝 Establishing Social Connections...")
        for (const user of allUserDocs) {
            // Make every user follow 3-5 random other users
            const others = allUserDocs.filter(u => u._id.toString() !== user._id.toString())
            // Shuffle
            const shuffled = others.sort(() => 0.5 - Math.random())
            const toFollow = shuffled.slice(0, 3 + Math.floor(Math.random() * 3)) // Follow 3 to 5 users

            for (const target of toFollow) {
                // Ensure array exists
                if (!user.following) user.following = []
                if (!target.followers) target.followers = []

                if (!user.following.includes(target._id)) {
                    user.following.push(target._id)
                    await user.save()

                    if (!target.followers.includes(user._id)) {
                        target.followers.push(user._id)
                        await target.save()
                    }
                }
            }
        }
        console.log("✅ Social Graph Established.")

        // --------------------------------------------------------------------
        // 3. Create Communities
        // --------------------------------------------------------------------
        const commMap = new Map() // keyword -> communityDoc

        for (const c of INTELLECTUAL_COMMUNITIES) {
            let comm = await Community.findOne({ slug: c.slug })
            if (!comm && c.status !== 'pending') {
                // Assign a relevant admin
                let creator = userMap.get("dr_neural") // default
                if (c.slug.includes("quantum")) creator = userMap.get("quantum_scholar")
                if (c.slug.includes("cyber")) creator = userMap.get("cyber_researcher")

                comm = await Community.create({
                    ...c,
                    createdBy: creator?._id,
                    memberCount: 5 + Math.floor(Math.random() * 10), // Random members
                    postCount: 0
                })
                console.log(`Created community: ${c.name}`)
            }

            if (comm) {
                c.keywords.forEach(k => commMap.set(k, comm))
            }
        }

        // Handle pending separately if needed
        const pendingComms = INTELLECTUAL_COMMUNITIES.filter(c => c.status === 'pending')
        for (const c of pendingComms) {
            const exists = await Community.findOne({ slug: c.slug })
            if (!exists) {
                await Community.create({ ...c, createdBy: userMap.get("philosophy_mind")?._id })
            }
        }

        // --------------------------------------------------------------------
        // 4. Create Posts & Interactions (Saved/Liked)
        // --------------------------------------------------------------------
        let postCount = 0
        const createdUserPosts = new Map() // userId -> [postIds] (Strings for reference)

        for (const t of POST_TEMPLATES) {
            // Determine Author
            let author = allUserDocs[Math.floor(Math.random() * allUserDocs.length)]

            // Try to match author expertise if possible
            if (t.tags.includes("ai") && userMap.has("dr_neural")) author = userMap.get("dr_neural")
            if (t.tags.includes("quantum") && userMap.has("quantum_scholar")) author = userMap.get("quantum_scholar")
            if (t.tags.includes("cyber") && userMap.has("cyber_researcher")) author = userMap.get("cyber_researcher")
            if (t.isRisk) author = userMap.get("david_newbie") || allUserDocs[0] // risky posts by randoms

            // Determine Community
            let community = null
            if (t.communityKeyword && commMap.has(t.communityKeyword)) {
                // 70% chance to be in community, 30% general (profile post)
                if (Math.random() > 0.3) {
                    community = commMap.get(t.communityKeyword)
                }
            }

            // Check existence
            let post = await Post.findOne({ title: t.title })
            if (!post) {
                const postData: any = {
                    userId: author._id,
                    communityId: community?._id,
                    postType: t.type,
                    title: t.title,
                    content: t.content,
                    tags: t.tags,
                    difficulty: t.difficulty || 'beginner',
                    status: (t as any).status || 'approved',
                    riskState: (t as any).riskState || 'safe', // Add risk state
                    mediaRefs: (t as any).mediaRefs || [],
                    codeSnippet: (t as any).codeSnippet,
                    codeLanguage: (t as any).codeLanguage,
                    externalUrl: (t as any).externalUrl,
                    likes: (t as any).isRisk ? 0 : Math.floor(Math.random() * 150),
                    bookmarks: (t as any).isRisk ? 0 : Math.floor(Math.random() * 40),
                    commentCount: Math.floor(Math.random() * 20),
                    createdAt: new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 3))
                }

                if (t.type === 'poll') {
                    postData.pollOptions = (t as any).pollOptions.map((o: any) => ({ ...o, votedBy: [] }))
                }
                if (t.type === 'quiz') {
                    postData.quizOptions = (t as any).quizOptions
                }

                post = await Post.create(postData)
                if (community) {
                    await Community.findByIdAndUpdate(community._id, { $inc: { postCount: 1 } })
                }
                postCount++
            }

            // Track created posts for message seeding later
            if (!createdUserPosts.has(author.username)) {
                createdUserPosts.set(author.username, [])
            }
            createdUserPosts.get(author.username).push(post._id.toString())


            // ----------------------------------------------------------------
            // 5. Populate Saved Posts
            // ----------------------------------------------------------------
            if (!post.isRisk) {
                // Pick random users to have saved this post
                const randomSavers = allUserDocs.filter(u => Math.random() > 0.6) // 40% chance
                for (const saver of randomSavers) {
                    if (!saver.savedPosts) saver.savedPosts = []
                    if (!saver.savedPosts.includes(post._id)) {
                        saver.savedPosts.push(post._id)
                        await saver.save()
                        // Update bookmarks count on post
                        await Post.findByIdAndUpdate(post._id, { $inc: { bookmarks: 1 } })
                    }
                }
            }
        }

        // --------------------------------------------------------------------
        // 6. Special Handling for 'voyager_09'
        // --------------------------------------------------------------------
        console.log("🚀 Configuring 'voyager_09'...")

        let voyager = await User.findOne({ username: "voyager_09" })
        if (!voyager) {
            voyager = await User.create({
                username: "voyager_09",
                email: "voyager@demo.com", // Fallback if not exists
                displayName: "Voyager 09",
                passwordHash: "$2a$10$Ssb6V/wO5P8L6S1wBFYIMeUuAWo9EyTxqQSOkYG2yRtAyhOm2.XX6", // "password123"
                role: "USER",
                bio: "Explorer of the digital frontier.",
                skillLevel: "intermediate",
                riskScore: 0,
                followers: [],
                following: [],
                savedPosts: []
            })
            console.log("Created 'voyager_09'")
        }

        // 6a. Make voyager follow random users
        const othersToFollow = allUserDocs.filter(u => u._id.toString() !== voyager!._id.toString())
        const voyagerFollows = othersToFollow.sort(() => 0.5 - Math.random()).slice(0, 5)

        for (const target of voyagerFollows) {
            if (!voyager.following) voyager.following = []
            if (!voyager.following.includes(target._id)) {
                voyager.following.push(target._id)
                // target gets followed back? Maybe not necessarily
                if (!target.followers) target.followers = []
                if (!target.followers.includes(voyager._id)) {
                    target.followers.push(voyager._id)
                    await target.save()
                }
            }
        }

        await voyager.save()

        // 6c. Create explicit posts for voyager (My Posts)
        const voyagerPosts = [
            {
                type: "discussion",
                title: "My journey into Web3 and Decentralized Identity",
                content: "I've been exploring DID (Decentralized Identifiers) lately. It seems like the logical next step for privacy. Anyone else working with Verifiable Credentials?",
                tags: ["web3", "identity", "privacy"],
                communityKeyword: "cyber"
            },
            {
                type: "code_snippet",
                title: "Quick Python script to automate file organization",
                content: "Nothing fancy, just a script I use to clean up my Downloads folder based on file extensions.",
                codeLanguage: "python",
                codeSnippet: "import os\n# ... (imaginary code)",
                tags: ["python", "automation", "productivity"],
                communityKeyword: null // General
            }
        ]

        for (const t of voyagerPosts) {
            const exists = await Post.findOne({ title: t.title, userId: voyager._id })
            if (!exists) {
                let communityId = undefined
                if (t.communityKeyword && commMap.has(t.communityKeyword)) {
                    communityId = commMap.get(t.communityKeyword)._id
                }

                await Post.create({
                    userId: voyager._id,
                    communityId,
                    postType: t.type,
                    title: t.title,
                    content: t.content,
                    tags: t.tags,
                    status: "approved",
                    likes: Math.floor(Math.random() * 20),
                    commentCount: Math.floor(Math.random() * 5),
                    createdAt: new Date()
                })

                if (communityId) {
                    await Community.findByIdAndUpdate(communityId, { $inc: { postCount: 1 } })
                }
            }
        }

        // --------------------------------------------------------------------
        // 6.5. Seed Likes and Comments for REAL interactions
        // --------------------------------------------------------------------
        console.log("📝 Seeding Likes and Comments...")
        const allPosts = await Post.find({})
        const commentPool = [
            "This is really insightful! Thanks for sharing.",
            "I've been looking into this as well. Great points.",
            "Could you elaborate more on the trade-offs?",
            "Amazing work. The technical detail is top-notch.",
            "I disagree with the second point, but overall a solid read.",
            "Transformers are indeed the future of this field!",
            "Lattice-based crypto is so fascinating but hard to grasp. Good intro.",
            "FlashAttention-2 really is a game changer for memory efficiency."
        ]

        for (const post of allPosts) {
            // Seed 1-4 Likes
            const numLikes = 1 + Math.floor(Math.random() * 4)
            const likers = allUserDocs
                .filter(u => u._id.toString() !== post.userId.toString())
                .sort(() => 0.5 - Math.random())
                .slice(0, numLikes)

            post.likedBy = likers.map(u => u._id)
            post.likes = numLikes

            // Seed 2 Comments
            const numComments = 2
            const commenters = allUserDocs
                .sort(() => 0.5 - Math.random())
                .slice(0, numComments)

            for (let i = 0; i < numComments; i++) {
                await Comment.create({
                    postId: post._id,
                    userId: commenters[i]._id,
                    content: commentPool[Math.floor(Math.random() * commentPool.length)],
                    likes: Math.floor(Math.random() * 5),
                    createdAt: new Date(post.createdAt.getTime() + 1000 * 60 * (10 + i * 20))
                })
            }

            post.commentCount = numComments
            await post.save()
        }


        // --------------------------------------------------------------------
        // 7. Seed Chats & Messages (voyager_09 <-> dr_neural)
        // --------------------------------------------------------------------
        console.log("💬 Seeding Chat Messages...")

        const drNeural = userMap.get("dr_neural")
        if (drNeural) {
            // Check for existing room
            let room = await ChatRoom.findOne({
                participants: { $all: [voyager._id, drNeural._id] },
                type: "direct"
            })

            if (!room) {
                room = await ChatRoom.create({
                    participants: [voyager._id, drNeural._id],
                    type: "direct",
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
                    updatedAt: new Date()
                })
                console.log("Created ChatRoom: Voyager <-> Dr. Neural")
            }

            // Seed Messages
            const messages = [
                {
                    senderId: drNeural._id,
                    content: "Welcome to the Digital Frontier, Voyager! 🚀",
                    type: "text",
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5)
                },
                {
                    senderId: voyager._id,
                    content: "Thanks Doc! I've been reading your paper on Transformers.",
                    type: "text",
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4)
                },
                {
                    senderId: drNeural._id,
                    content: "Glad to hear it. Check this out:",
                    type: "post_share",
                    metadata: {
                        postId: createdUserPosts.get("dr_neural")?.[0] || null, // Best effort
                        postTitle: "Transformer Optimization Techniques",
                        postImage: null
                    },
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3)
                }
            ]

            for (const m of messages) {
                // Determine postId dynamically if possible
                let meta = m.metadata
                if (m.type === 'post_share' && !meta.postId) {
                    // Find a post by dr_neural to share
                    const p = await Post.findOne({ userId: drNeural._id })
                    if (p) {
                        meta = {
                            postId: p._id.toString(),
                            postTitle: p.title,
                            postImage: null
                        }
                    } else {
                        // Fallback to text if no post found
                        m.type = 'text'
                        m.content = "Check out my latest research!"
                        meta = undefined
                    }
                }

                // Avoid dupes implicitly by timestamp? Or just create. Messages are append-only.
                // We'll just create. If re-run, might duplicate messages. 
                // To avoid duplication, we can check count or lastMessage.
                const existingMsg = await Message.findOne({ roomId: room._id, content: m.content, senderId: m.senderId })
                if (!existingMsg) {
                    const msg = await Message.create({
                        roomId: room._id,
                        senderId: m.senderId,
                        content: m.content,
                        type: m.type,
                        metadata: meta,
                        readBy: [voyager._id, drNeural._id],
                        createdAt: m.createdAt
                    })

                    // Update room last message
                    room.lastMessage = msg._id
                    room.lastMessageAt = msg.createdAt
                    await room.save()
                }
            }
        }

        console.log(`✅ Successfully seeded intellectual data, voyager_09, & chat messages.`)
        console.log(`✅ Users are now following each other and have saved posts.`)

        // --------------------------------------------------------------------
        // 8. Seed Audit Logs for Dashboard "Real-time" feel
        // --------------------------------------------------------------------
        console.log("📜 Seeding Audit Logs & Tickets...")

        // Create some tickets
        const flaggedPost = await Post.findOne({ title: { $regex: /risky/i } }) || await Post.findOne({})
        if (flaggedPost) {
            await ModerationTicket.create({
                postId: flaggedPost._id,
                reportedUserId: flaggedPost.userId,
                reportedBy: allUserDocs[0]._id,
                type: "content_manual",
                reason: "Potential violation of community guidelines.",
                content: flaggedPost.content.slice(0, 100),
                severity: "high",
                status: "pending",
                aiAnalysis: { score: 0.85, labels: ["toxic"] }
            })
        }

        const actions = [
            { user: "adi", action: "admin:approve_community", type: "community", target: (await Community.findOne({ status: "active" }))?._id },
            { user: "mishra", action: "moderation:strike", type: "ticket", target: new mongoose.Types.ObjectId() },
            { user: "dr_neural", action: "moderation:dismiss", type: "ticket", target: new mongoose.Types.ObjectId() }
        ]

        for (const a of actions) {
            const actor = userMap.get(a.user)
            if (actor) {
                await AuditLog.create({
                    performedBy: actor._id,
                    action: a.action,
                    targetType: a.type,
                    targetId: a.target || actor._id,
                    details: { note: "Seeded initial activity" },
                    createdAt: new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60))
                })
            }
        }

    } catch (error) {
        console.error("❌ Seeding failed:", error)
    } finally {
        await mongoose.disconnect()
        process.exit(0)
    }
}

seed()
