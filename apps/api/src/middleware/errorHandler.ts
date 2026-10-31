import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/errors";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({
    error: { code: "not_found", message: "The requested endpoint does not exist." },
  });
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "validation_error",
        message: "The request was invalid.",
        fields: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
    return;
  }

  if (error instanceof AppError) {
    if (error.status >= 500) {
      console.warn(`[api] ${error.code}`);
    }
    res.status(error.status).json({
      error: { code: error.code, message: error.message },
    });
    return;
  }

  console.error("[api] unhandled error", error instanceof Error ? error.name : "unknown");
  res.status(500).json({
    error: {
      code: "internal_error",
      message: "Something went wrong while processing this request.",
    },
  });
}
