import prisma from "../utils/prisma.js";

export class UserService {
  static async getMe(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });
  }

  static async getProfileByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
      include: { profile: true }
    });
  }

  static async updateProfile(userId: string, data: any) {
    return prisma.profile.update({
      where: { userId },
      data: {
        displayName: data.display_name,
        bio: data.bio,
        region: data.region,
        lastActivity: new Date()
      }
    });
  }
}
