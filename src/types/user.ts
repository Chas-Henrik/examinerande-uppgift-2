import { UserType } from '../models/user.model.js';

export enum UserLevel { 
	NONE = 0, 
	DEVELOPER = 10, 
	ADMIN = 20
}

type UserApiOK = { ok: true; message?: string; user?: UserType; users?: UserType[]};
type UserApiErr = { ok: false; message: string; error?: string | object };
export type UserApiResponse = UserApiOK | UserApiErr;