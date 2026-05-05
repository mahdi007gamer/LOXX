import { Request, Response } from "express";
import prisma from "../utils/prisma.js";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        profile: {
          select: {
            avatarUrl: true,
            membershipType: true
          }
        }
      }
    });
    res.json({ status: "success", data: users });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({
      where: { id }
    });
    res.json({ status: "success", message: "User deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, role: true }
    });
    res.json({ status: "success", data: user });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const updateUserMembership = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { membershipType } = req.body; // NONE, PLUS, VIP
  try {
    const profile = await prisma.profile.update({
      where: { userId: id },
      data: { membershipType },
      select: { userId: true, membershipType: true }
    });
    res.json({ status: "success", data: profile });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const createGame = async (req: Request, res: Response) => {
  const { title, genre, bannerUrl, metadata } = req.body;
  try {
    const game = await prisma.game.create({
      data: { title, bannerUrl, metadata: metadata ? JSON.stringify(metadata) : null }
    });
    res.json({ status: "success", data: game });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const deleteGame = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.game.delete({
      where: { id }
    });
    res.json({ status: "success", message: "Game deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
