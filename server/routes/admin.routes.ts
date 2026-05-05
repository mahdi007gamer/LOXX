import { Router } from "express";
import { authenticate, authorizeAdmin } from "../middleware/auth.middleware.js";
import prisma from "../utils/prisma.js";

const router = Router();

router.get("/users", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    res.json({ status: "success", data: users });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

export default router;
