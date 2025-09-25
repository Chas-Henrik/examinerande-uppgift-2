// src/db.ts
import mongoose from "mongoose"; //med "type":"module"
import config from "./config.js";

export async function connectDB() {
    if (!config.dbUri) throw new Error("Missing MONGODB_URI");
    await mongoose.connect(config.dbUri, {
        dbName: "trulloDatabase", 
    });
    console.log("MongoDB connected");
}
