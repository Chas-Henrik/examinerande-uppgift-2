// src/types/generic.ts

type GenericApiOK = { ok: true; message: string; data?: object | undefined };
type GenericApiErr = { ok: false; message: string; errors?: object[] | undefined };
export type GenericApiResponse = GenericApiOK | GenericApiErr;