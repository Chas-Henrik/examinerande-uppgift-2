import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./db.js";

dotenv.config();

const app = express();
app.use(express.json());

await connectDB()
	.then(() => {
		const PORT = 3000;
		app.listen(PORT, () => {
			console.log("Server running on port: ", PORT);
		});
	})
	.catch((err) => {
		console.log("Error connecting to MongoDB");
	});