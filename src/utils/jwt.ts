import dotenv from "dotenv";
import jwt from 'jsonwebtoken';

const result = dotenv.config();

if (result.error) {
    console.error('Failed to load .env file:', result.error);
    process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;

export function signToken(payload: object): string {
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
    }
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

export function verifyToken(token: string): any {
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
    }
    return jwt.verify(token, JWT_SECRET);
}
