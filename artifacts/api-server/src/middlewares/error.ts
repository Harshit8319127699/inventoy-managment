import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../lib/logger";

export class HttpError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ message: "Not found" });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      message: "Validation failed",
      details: err.flatten(),
    });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message, details: err.details });
    return;
  }
  // Mongoose duplicate key
  if (
    err &&
    typeof err === "object" &&
    "code" in err &&
    (err as { code: number }).code === 11000
  ) {
    res.status(409).json({
      message: "Duplicate value",
      details: (err as { keyValue?: unknown }).keyValue,
    });
    return;
  }
  // Mongoose validation error
  if (
    err &&
    typeof err === "object" &&
    "name" in err &&
    (err as { name: string }).name === "ValidationError"
  ) {
    res.status(400).json({
      message: "Validation failed",
      details: (err as { errors?: unknown }).errors,
    });
    return;
  }
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ message: "Internal server error" });
}
