// src/utils/user.ts
import { UserLevel } from "../types/user";

export function normalizeUserLevel(input: string | number): UserLevel | undefined {
	if (typeof input === 'string') {
		return UserLevel[input.toUpperCase() as keyof typeof UserLevel];
	}
	if (typeof input === 'number' && Object.values(UserLevel).includes(input)) {
		return input as UserLevel;
	}
	return undefined;
}