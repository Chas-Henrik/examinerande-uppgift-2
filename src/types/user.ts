// src/types/user.ts
import { UserType } from '../models/user.model.js';

export type AuthUserType = { 
	_id: string; 
	userLevel: number; 
}

export enum UserLevel { 
	NONE = 0, 
	DEVELOPER = 10, 
	ADMIN = 20
}

type UserApiOK = { ok: true; message?: string; user?: Partial<UserType>; users?: Partial<UserType>[]};
type UserApiErr = { ok: false; message: string; error?: string | object };
export type UserApiResponse = UserApiOK | UserApiErr;