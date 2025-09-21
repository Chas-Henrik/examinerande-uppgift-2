// src/utils/jwt.ts

import dotenv from "dotenv";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export type JwtPayload = { 
	_id: string; 
	userLevel: number 
};

export function signToken(payload: JwtPayload): string {
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
    }
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

export function verifyToken(token: string): JwtPayload  {
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
    }
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
