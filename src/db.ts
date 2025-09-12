import mongoose from "mongoose"; //med "type":"module"
import dotenv from "dotenv";
dotenv.config();

export async function connectDB() {
    if (!process.env.MONGODB_URI) throw new Error("Missing MONGODB_URI");
    await mongoose.connect(process.env.MONGODB_URI, {
        dbName: "trulloDatabase", 
    });
    console.log("MongoDB connected");
}
