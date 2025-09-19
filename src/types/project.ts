import { ProjectType } from '../models/project.model.js';

type ProjectApiOK = { ok: true; message?: string; project?: ProjectType; projects?: ProjectType[] };
type ProjectApiErr = { ok: false; message: string; error?: string };
export type ProjectApiResponse = ProjectApiOK | ProjectApiErr;