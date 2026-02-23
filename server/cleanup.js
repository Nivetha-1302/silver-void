require('dotenv').config();
const mongoose = require('mongoose');

const cleanup = async () => {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            console.error("Error: MONGO_URI not found in .env file");
            process.exit(1);
        }

        console.log("Connecting to MongoDB...");
        await mongoose.connect(uri);
        console.log("Connected successfully.");

        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();

        console.log(`Found ${collections.length} collections. Preparing to wipe data...`);

        for (let col of collections) {
            console.log(`Dropping collection: ${col.name}...`);
            await db.dropCollection(col.name);
        }

        console.log("\n✅ SUCCESS: All data has been deleted from your Atlas Database.");
        console.log("You can now start fresh with your Admin registration.");

        process.exit(0);
    } catch (err) {
        console.error("Cleanup Failed:", err);
        process.exit(1);
    }
};

cleanup();
