const mongoose = require('mongoose');

const uri = "mongodb+srv://adithya224416101_db_user:learnweb2910@learnweb.tw1py8j.mongodb.net/";
const usernames = ["dr_neural", "quantum_scholar", "cyber_researcher", "philosophy_mind", "ai_ethicist", "astro_physicist", "algo_master", "voyager_09"];

const conversations = {
    "dr_neural-ai_ethicist": [
        "Elena, I've been thinking about the alignment problem in large language models. How do we encode human values into objective functions?",
        "That's the million-dollar question, Dr. Neural. I think the challenge is that 'human values' aren't a static set of rules.",
        "Exactly. If we use RLHF, we're essentially just mimicking the statistical average of human bias.",
        "A better approach might be Inverse Reinforcement Learning, where the AI observes human behavior.",
        "True. We might need a constitutional approach, similar to Anthropic's."
    ],
    "quantum_scholar-cyber_researcher": [
        "Have you seen the latest benchmarks on Shor's algorithm? We're getting closer to the critical qubit threshold.",
        "I've been following it closely. The security community is pivoting to Post-Quantum Cryptography faster than ever.",
        "Lattice-based is promising, but the key sizes are significantly larger.",
        "That's a valid concern. We might need hybrid systems for a while.",
        "Definitely. The transition period is going to be the most vulnerable time."
    ],
    "astro_physicist-algo_master": [
        "I'm running a simulation of galaxy formation, but the N-body problem is killing my compute budget.",
        "You should look into using Fast Multipole Methods (FMM). It improves complexity to O(N).",
        "O(N)? That sounds like a game-changer. Is it stable?",
        "It is, but the implementation is complex. I can help you with a CUDA version.",
        "That would be amazing! It would validate my latest theory."
    ],
    "philosophy_mind-dr_neural": [
        "Dr. Neural, do you believe that a sufficiently complex neural network can ever possess true subjective experience?",
        "From a functionalist perspective, if it behaves exactly like a conscious system, we have no reason to deny it consciousness.",
        "But behavior isn't everything. A 'philosophical zombie' could display all the signs.",
        "True. But if we can map every synaptic firing, does the 'ghost in the machine' vanish?",
        "Emergence is a popular theory, but it doesn't explain the 'Hard Problem'."
    ],
    "voyager_09-cyber_researcher": [
        "I've been looking into Decentralized Identity. Do you think it can replace Google/Facebook OAuth?",
        "Conceptually, yes. But the user experience is still a major barrier.",
        "What about Social Recovery? If you lose your key, your trusted circle can help.",
        "Social Recovery is a step forward, but the trust model is tricky.",
        "Indeed. We need a balance between sovereign control and fail-safe recovery."
    ]
};

const genericMessages = [
    "Hey! I saw your recent post. Really interesting stuff.",
    "Thanks! I've been working on it for a while. Any feedback?",
    "I think you're onto something, but have you considered the scalability issues?",
    "Good point. I'll need to refactor the data layer.",
    "Let's catch up later this week to discuss it."
];

async function seed() {
    try {
        await mongoose.connect(uri);
        console.log("Connected to MongoDB");

        const User = mongoose.connection.db.collection('users');
        const ChatRoom = mongoose.connection.db.collection('chatrooms');
        const Message = mongoose.connection.db.collection('messages');

        const userDocs = await User.find({ username: { $in: usernames } }).toArray();
        const userMap = new Map(userDocs.map(u => [u.username, u]));

        for (let i = 0; i < usernames.length; i++) {
            for (let j = i + 1; j < usernames.length; j++) {
                const u1Name = usernames[i], u2Name = usernames[j];
                const u1 = userMap.get(u1Name), u2 = userMap.get(u2Name);
                if (!u1 || !u2) continue;

                let room = await ChatRoom.findOne({ participants: { $all: [u1._id, u2._id] }, type: "direct" });
                if (!room) {
                    const result = await ChatRoom.insertOne({ participants: [u1._id, u2._id], type: "direct", createdAt: new Date(), updatedAt: new Date() });
                    room = { _id: result.insertedId };
                }

                const pairKey = `${u1Name}-${u2Name}`, revPairKey = `${u2Name}-${u1Name}`;
                const msgs = conversations[pairKey] || conversations[revPairKey] || genericMessages;

                for (let k = 0; k < msgs.length; k++) {
                    const sender = k % 2 === 0 ? u1 : u2;
                    const content = msgs[k];
                    const exists = await Message.findOne({ roomId: room._id, content: content, senderId: sender._id });
                    if (!exists) {
                        const msgResult = await Message.insertOne({ roomId: room._id, senderId: sender._id, content: content, type: "text", readBy: [u1._id, u2._id], createdAt: new Date(Date.now() - (msgs.length - k) * 60000), updatedAt: new Date() });
                        await ChatRoom.updateOne({ _id: room._id }, { $set: { lastMessage: msgResult.insertedId, lastMessageAt: new Date() } });
                    }
                }
                console.log(`Pushed for ${u1Name}-${u2Name}`);
            }
        }
        console.log("Done!");
    } catch (err) { console.error(err); } finally { await mongoose.disconnect(); process.exit(0); }
}
seed();
