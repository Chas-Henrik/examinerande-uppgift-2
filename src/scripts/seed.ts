// src/scripts/seed.ts

import "../loadEnv.js"; // Always first
import { faker } from "@faker-js/faker";
import { connectDB } from "../db.js";      
import { User, UserType } from "../models/user.model.js";
import { Project, ProjectType } from "../models/project.model.js";
import { Task } from "../models/task.model.js";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

const UserCount = 5;
const TaskCount = 20;
const ProjectCount = 3;

function getRandomUserId(users: UserType[]): string | undefined {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const userId = randomUser?._id.toString();
    return userId;
}

function getRandomUserIdOrNull(users: UserType[]): string | null {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const userId = (Math.random() < 0.3) ? null : randomUser?._id.toString() || null; // 30% chance of unassigned task

    return userId;
}

function getRandomProjectIdOrNull(projects: ProjectType[]): string | null {
    const randomProject = projects[Math.floor(Math.random() * projects.length)];
    const projectId = (Math.random() < 0.2) ? null : randomProject?._id.toString() || null; // 20% chance of unassigned project

    return projectId;
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

function buildProject(users: UserType[]) {
    return {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        owner: getRandomUserId(users),
    };
}

function buildTask(users: UserType[], projects: ProjectType[]) {
    return {
        title: faker.company.catchPhrase(),
        description: faker.hacker.phrase(),
        status: faker.helpers.arrayElement(['to-do', 'in progress', 'blocked']),
        assignedTo: getRandomUserIdOrNull(users),
        project: getRandomProjectIdOrNull(projects),
    };
}

async function seedDB() {
    await connectDB();

    // clean existing collections
    await Task.deleteMany({});
    console.log("🧹 DB tasks cleaned");

    await Project.deleteMany({});
    console.log("🧹 DB projects cleaned");

    await User.deleteMany({});
    console.log("🧹 DB users cleaned");

    // generate admin user
    const admin = buildAdmin();
    await User.create(admin);
    console.log("🌱 1 admin user seeded!");

    // generate users
    const users = await Promise.all(Array.from({ length: UserCount }, buildUser));
    const insertedUsers = await User.insertMany(users);
    console.log(`🌱 ${UserCount} users seeded!`);

    // generate projects
    const projects =  Array.from({ length: ProjectCount }, () => buildProject(insertedUsers));
    const insertedProjects = await Project.insertMany(projects);
    const insertedProjectsPlain: ProjectType[] = insertedProjects.map(p => p.toObject());
    console.log(`🌱 ${ProjectCount} projects seeded!`);

    // generate tasks
    const tasks = Array.from({ length: TaskCount }, () => buildTask(insertedUsers, insertedProjectsPlain));
    const insertedTasks = await Task.insertMany(tasks);
    console.log(`🌱 ${TaskCount} tasks seeded!`);

    await mongoose.disconnect();
    console.log(`👋 Seed complete. AdminUsers: 1, RegularUsers: ${insertedUsers.length}, Projects: ${insertedProjects.length}, Tasks: ${insertedTasks.length}`);
}

seedDB().catch((err) => {
    console.error("❌ Seed fail:", err);
    process.exit(1);
});

// To run this script, use the command: npm run seed
// Make sure you have a "seed" script defined in your package.json that points to this file.
// Example package.json script entry:
// "scripts": {
//     "seed": "tsx src/scripts/seed.ts"
// }