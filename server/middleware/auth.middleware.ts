import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service.js";

export interface AuthenticatedRequest extends Request {
  user?: { userId: string };
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ status: "error", error: { code: "AUTH_EXPIRED", message: "Missing token" } });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = AuthService.verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ status: "error", error: { code: "AUTH_EXPIRED", message: "Invalid or expired token" } });
  }
};
