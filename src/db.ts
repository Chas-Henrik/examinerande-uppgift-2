// src/db.ts

import mongoose from "mongoose";
import config from "./config.js";
import { User, Project, Task } from "./models";

export async function connectDB() {
    if (!config.dbUri) throw new Error("Missing MONGODB_URI env variable");
    await mongoose.connect(config.dbUri);
    // Ensure Mongoose Indexes Are Created
    await Promise.all([
      User.init(),
      Project.init(),
      Task.init(),
    ]);
    console.log("MongoDB connected");
}

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});
