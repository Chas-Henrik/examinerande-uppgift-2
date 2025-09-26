// src/db.ts
import mongoose from "mongoose";
import config from "./config.js";

export async function connectDB() {
    if (!config.dbUri) throw new Error("Missing MONGODB_URI env variable");
    await mongoose.connect(config.dbUri);
    console.log("MongoDB connected");
}

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});
