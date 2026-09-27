import { PrismaClient, NotificationType, Notification } from '@prisma/client';

const prisma = new PrismaClient();

class NotificationService {
  async createNotification(
    userId: string,
    type: NotificationType,
    message: string,
    metadata?: Record<string, any>
  ): Promise<Notification> {
    return prisma.notification.create({
      data: {
        userId,
        type,
        message,
        metadata: metadata ?? undefined,
      },
    });
  }

  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: {
        userId,
        read: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async markAsRead(notificationId: string): Promise<void> {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }
}

export default new NotificationService();
