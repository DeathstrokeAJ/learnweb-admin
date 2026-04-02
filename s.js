const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const usernames = [
    "dr_neural",
    "quantum_scholar",
    "cyber_researcher",
    "philosophy_mind",
    "ai_ethicist",
    "astro_physicist",
    "algo_master",
    "voyager_09"
];

const conversations = {
    "dr_neural-ai_ethicist": [
        "Elena, I've been thinking about the alignment problem in large language models. How do we encode human values into objective functions?",
        "That's the million-dollar question, Dr. Neural. I think the challenge is that 'human values' aren't a static set of rules. They're context-dependent and often contradictory.",
        "Exactly. If we use RLHF, we're essentially just mimicking the statistical average of human bias. That feels like a temporary fix, not a solution.",
        "A better approach might be Inverse Reinforcement Learning, where the AI observes human behavior to infer underlying values. But even then, humans are far from rational.",
        "True. We might need a constitutional approach, similar to Anthropic's, but with a more dynamic, democratic process for deciding the core tenets."
    ],
    "quantum_scholar-cyber_researcher": [
        "Have you seen the latest benchmarks on Shor's algorithm for breaking RSA-2048? We're getting closer to the critical qubit threshold.",
        "I've been following it closely. The security community is pivoting to Post-Quantum Cryptography (PQC) faster than ever. Lattice-based schemes seem to be the frontrunners.",
        "Lattice-based is promising, but the key sizes are significantly larger. It's a major overhead for low-power IoT devices.",
        "That's a valid concern. We might need hybrid systems for a while—classically secure and quantum-resistant layers working together.",
        "Definitely. The transition period is going to be the most vulnerable time. If an attacker intercepts encrypted data now, they can just wait for a Q-computer to decrypt it later."
    ],
    "astro_physicist-algo_master": [
        "I'm running a simulation of galaxy formation, but the N-body problem is killing my compute budget. Any tips for optimizing the Barnes-Hut algorithm?",
        "You should look into using Fast Multipole Methods (FMM). It improves the complexity from O(N log N) to O(N) for certain gravitational interactions.",
        "O(N)? That sounds like a game-changer. Is it stable for long-term galactic evolution simulations?",
        "It is, but the implementation is much more complex. I can help you with a CUDA-accelerated version if you want to push it to the GPU.",
        "That would be amazing! If we can simulate the dark matter halo interaction with higher resolution, it would validate my latest theory."
    ],
    "philosophy_mind-dr_neural": [
        "Dr. Neural, do you believe that a sufficiently complex neural network can ever possess true subjective experience, or 'qualia'?",
        "From a functionalist perspective, if it behaves exactly like a conscious system, we have no empirical reason to deny it consciousness. But 'qualia' is harder to prove.",
        "But behavior isn't everything. A 'philosophical zombie' could display all the outward signs of consciousness without any inner life.",
        "True. But if we can map every synaptic firing to a specific cognitive state, does the 'ghost in the machine' vanish? Or does consciousness emerge from the complexity itself?",
        "Emergence is a popular theory, but it doesn't explain *why* physical processes give rise to subjective feeling. That's Chalmers' 'Hard Problem'."
    ],
    "voyager_09-cyber_researcher": [
        "I've been looking into Decentralized Identity (DID) for my latest project. Do you think it can truly replace centralized OAuth providers like Google and Facebook?",
        "Conceptually, yes. But the user experience is still a major barrier. Managing private keys is too much for the average user.",
        "What about Social Recovery? If you lose your key, your trusted circle can help you regain access without a central authority.",
        "Social Recovery is a step in the right direction. But the trust model is tricky. If your 'circle' is compromised, so is your identity.",
        "Indeed. We need a balance between sovereign control and fail-safe recovery. Maybe Zero-Knowledge Proofs can bridge the gap for privacy-preserving verification."
    ]
};

// Generic messages for other pairs
const genericMessages = [
    "Hey! I saw your recent post. Really interesting stuff.",
    "Thanks! I've been working on it for a while. Any feedback?",
    "I think you're onto something, but have you considered the scalability issues?",
    "Good point. I'll need to refactor the data layer to handle that.",
    "Let's catch up later this week to discuss it in more detail."
];

async function seedChats() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error("MONGODB_URI missing");
        await mongoose.connect(uri);
        console.log("Connected to MongoDB");

        const User = mongoose.connection.db.collection('users');
        const ChatRoom = mongoose.connection.db.collection('chatrooms');
        const Message = mongoose.connection.db.collection('messages');

        const userDocs = await User.find({ username: { $in: usernames } }).toArray();
        const userMap = new Map(userDocs.map(u => [u.username, u]));

        console.log(`Found ${userDocs.length} users`);

        for (let i = 0; i < usernames.length; i++) {
            for (let j = i + 1; j < usernames.length; j++) {
                const u1Name = usernames[i];
                const u2Name = usernames[j];
                const u1 = userMap.get(u1Name);
                const u2 = userMap.get(u2Name);

                if (!u1 || !u2) continue;

                // Create Room
                let room = await ChatRoom.findOne({
                    participants: { $all: [u1._id, u2._id] },
                    type: "direct"
                });

                if (!room) {
                    const result = await ChatRoom.insertOne({
                        participants: [u1._id, u2._id],
                        type: "direct",
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                    room = { _id: result.insertedId };
                    console.log(`Created room for ${u1Name} and ${u2Name}`);
                } else {
                    console.log(`Room already exists for ${u1Name} and ${u2Name}`);
                }

                // Create Messages
                const pairKey = `${u1Name}-${u2Name}`;
                const revPairKey = `${u2Name}-${u1Name}`;
                const msgs = conversations[pairKey] || conversations[revPairKey] || genericMessages;

                for (let k = 0; k < msgs.length; k++) {
                    const sender = k % 2 === 0 ? u1 : u2;
                    const content = msgs[k];

                    const exists = await Message.findOne({
                        roomId: room._id,
                        content: content,
                        senderId: sender._id
                    });

                    if (!exists) {
                        const msgResult = await Message.insertOne({
                            roomId: room._id,
                            senderId: sender._id,
                            content: content,
                            type: "text",
                            readBy: [u1._id, u2._id],
                            createdAt: new Date(Date.now() - (msgs.length - k) * 60000), // Spaced by 1 min
                            updatedAt: new Date()
                        });

                        // Update last message in room
                        await ChatRoom.updateOne(
                            { _id: room._id },
                            {
                                $set: {
                                    lastMessage: msgResult.insertedId,
                                    lastMessageAt: new Date()
                                }
                            }
                        );
                    }
                }
                console.log(`Added ${msgs.length} messages for ${u1Name} and ${u2Name}`);
            }
        }

        console.log("Seeding complete!");
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seedChats();
