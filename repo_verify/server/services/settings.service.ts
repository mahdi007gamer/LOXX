import prisma from "../utils/prisma.ts";

export class SettingsService {
  static async getSettings(userId: string) {
    let settings = await prisma.userSettings.findUnique({
      where: { userId }
    });

    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId }
      });
    }

    return settings;
  }

  static async updateSettings(userId: string, data: any) {
    // Only allow specific fields
    const allowedFields = [
      'receiveFriendRequests',
      'receiveLobbyInvites',
      'showMentionAlerts',
      'theme',
      'language',
      'showOnlineStatus',
      'reduceAnimations'
    ];

    const filteredData: any = {};
    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        filteredData[key] = data[key];
      }
    }

    return prisma.userSettings.upsert({
      where: { userId },
      create: { userId, ...filteredData },
      update: filteredData
    });
  }
}
