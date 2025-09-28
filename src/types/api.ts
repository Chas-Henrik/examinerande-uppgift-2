// src/types/api.ts

import { UserJSONType } from '../models/user.model.js';
import { TaskJSONType } from '../models/task.model.js';
import { ProjectJSONType } from '../models/project.model.js';

export type ApiDataType = ( UserJSONType | TaskJSONType | ProjectJSONType );

type ApiOK = { ok: true; message?: string; data?: ApiDataType | ApiDataType[] };
type ApiErr = { ok: false; message: string; errors?: object[] | undefined };
export type ApiResponseType = ApiOK | ApiErr;
