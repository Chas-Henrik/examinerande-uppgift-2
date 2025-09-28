// src/types/user.ts

export type AuthUserType = { 
	_id: string; 
	userLevel: number; 
}

export enum UserLevel { 
	NONE = 0, 
	DEVELOPER = 10, 
	ADMIN = 20
}
