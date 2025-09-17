import { TaskType } from '../models/task.model.js';

type TaskApiOK = { ok: true; message?: string; task?: TaskType; tasks?: TaskType[] };
type TaskApiErr = { ok: false; message: string; error?: string };
export type TaskApiResponse = TaskApiOK | TaskApiErr;