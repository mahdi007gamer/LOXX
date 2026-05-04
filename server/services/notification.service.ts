import prisma from "../utils/prisma.js";

export class NotificationService {
  static async createNotification(userId: string, type: string, data: any, senderId?: string) {
    return prisma.notification.create({
      data: {
        userId,
        type,
        data: JSON.stringify(data),
        senderId
      }
    });
  }

  static async getNotifications(userId: string) {
    const notifications = await prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: "desc" }
    });

    return notifications.map(n => ({
      ...n,
      data: n.data ? JSON.parse(n.data) : null
    }));
  }

  static async markAsRead(userId: string, ids?: string[], all?: boolean) {
    if (all) {
      return prisma.notification.updateMany({
        where: { userId },
        data: { isRead: true }
      });
    }

    return prisma.notification.updateMany({
      where: { userId, id: { in: ids } },
      data: { isRead: true }
    });
  }
}
