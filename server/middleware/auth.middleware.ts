import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service.ts";

import prisma from "../utils/prisma.ts";

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

export const authorizeAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ status: "error", message: "Unauthorized" });
  
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  const isAdminEmail = user?.email === "admin@loxx.ir" || user?.email === "admin@test.com";

  if (!isAdminEmail) {
    return res.status(403).json({ status: "error", message: "Admin access required" });
  }
  
  next();
};
