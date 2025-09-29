// src/utils/error.ts

export class ApiError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, ApiError.prototype); // ensure instanceof works
  }
}
// e.g. throw new ApiError(404, "Project not found")
