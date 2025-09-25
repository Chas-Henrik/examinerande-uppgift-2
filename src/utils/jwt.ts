// src/utils/jwt.ts

import config from "../config.js";
import dotenv from "dotenv";
import jwt from 'jsonwebtoken';

const JWT_SECRET = config.jwtSecret;

export type JwtPayload = { 
	_id: string; 
	userLevel: number 
};

export function signToken(payload: JwtPayload): string {
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
    }
    return jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
}

export function verifyToken(token: string): JwtPayload  {
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
    }
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
