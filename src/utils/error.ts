// src/utils/error.ts

export class ApiError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
// e.g. throw new ApiError(404, "Project not found")
