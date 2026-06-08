import { Request, Response, NextFunction } from "express";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled Error:", err);
  
  const status = err.status || 500;
  const code = err.code || "INTERNAL_ERROR";
  const message = err.message || "An unexpected error occurred";

  res.status(status).json({
    status: "error",
    error: {
      code,
      message
    },
    timestamp: Date.now()
  });
};
