import { faker } from "@faker-js/faker";
import { connectDB } from "../db.js";      
import { User } from "../models/user.model.js";
import { Task } from "../models/task.model.js";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { UserType } from "../models/user.model.js";

const UserCount = 5;
const TaskCount = 10;

function getRandomUserId(users: UserType[]) : string | null {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const userId = (Math.random() < 0.3) ? null : randomUser?._id.toString() || null; // 30% chance of unassigned task

    return userId;
}

function buildAdmin() {
    return {
        name: "Admin User",
        email: "admin@example.com",
        password: "topsecret", // Password will be hashed in pre-save hook in user model
        userLevel: 20
    };
}

async function buildUser() {
    return {
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        password: await bcrypt.hash("topsecret", 10),
        userLevel: 10
    };
}

function buildTask(users: UserType[]) {
    return {
        title: faker.company.catchPhrase(),
        description: faker.hacker.phrase(),
        status: faker.helpers.arrayElement(['to-do', 'in progress', 'blocked']),
        assignedTo: getRandomUserId(users),
    };
}

async function seedDB() {
    await connectDB();

    // clean existing collections
    await User.deleteMany({});
    console.log("🧹 DB users cleaned");

    await Task.deleteMany({});
    console.log("🧹 DB tasks cleaned");

    // generate admin user
    const admin = buildAdmin();
    await User.create(admin);
    console.log("🌱 1 admin user seeded!");

    // generate users
    const users = await Promise.all(Array.from({ length: UserCount }, buildUser));
    const insertedUsers = await User.insertMany(users);
    console.log(`🌱 ${UserCount} users seeded!`);

    // generate tasks
    const tasks = Array.from({ length: TaskCount }, () => buildTask(insertedUsers));
    const insertedTasks = await Task.insertMany(tasks);
    console.log(`🌱 ${TaskCount} tasks seeded!`);

    await mongoose.disconnect();
    console.log(`👋 Seed complete. AdminUsers: 1, RegularUsers: ${insertedUsers.length}, Tasks: ${insertedTasks.length}`);
}

seedDB().catch((err) => {
    console.error("❌ Seed fail:", err);
    process.exit(1);
});

// To run this script, use the command: node examinerande-uppgift-2/src/scripts/seed.js