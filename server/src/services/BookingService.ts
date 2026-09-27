import { PrismaClient, UserRole } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import TimezoneService from './TimezoneService';
import { BOOKING_CONFIG } from '../config/constants';

const prisma = new PrismaClient();

interface CreateBookingInput {
  parentId: string;
  mentorId: string;
  courseId: string;
  childName: string;
  childAge: number;
  childGrade: string;
  startTimeUtc: Date;
  endTimeUtc: Date;
  parentTimezone: string;
  mentorTimezone: string;
}

class BookingService {
  async createBooking(data: CreateBookingInput): Promise<any> {
    return await prisma.$transaction(async (tx) => {
      // 1. Lock mentor row
      await tx.mentorProfile.findUnique({
        where: { id: data.mentorId },
        select: { id: true },
      });

      // 2. Check for overlapping bookings
      const overlapping = await tx.booking.findFirst({
        where: {
          mentorId: data.mentorId,
          status: 'CONFIRMED',
          OR: [
            {
              startTimeUtc: { lt: data.endTimeUtc },
              endTimeUtc: { gt: data.startTimeUtc },
            },
          ],
        },
      });

      if (overlapping) {
        throw new Error('SLOT_UNAVAILABLE:This time slot is no longer available');
      }

      // 3. Check daily capacity
      const localDate = TimezoneService.convertFromUTC(
        data.startTimeUtc,
        data.mentorTimezone
      ).split('T')[0];

      const { start, end } = TimezoneService.getLocalDayBoundaries(
        localDate,
        data.mentorTimezone
      );

      const dailyCount = await tx.booking.count({
        where: {
          mentorId: data.mentorId,
          startTimeUtc: {
            gte: start,
            lte: end,
          },
          status: 'CONFIRMED',
        },
      });

      if (dailyCount >= BOOKING_CONFIG.MAX_DAILY_TRIALS) {
        throw new Error('DAILY_LIMIT_REACHED:This mentor has reached daily capacity');
      }

      // 4. Create booking
      const booking = await tx.booking.create({
        data: {
          parentId: data.parentId,
          mentorId: data.mentorId,
          courseId: data.courseId,
          childName: data.childName,
          childAge: data.childAge,
          childGrade: data.childGrade,
          startTimeUtc: data.startTimeUtc,
          endTimeUtc: data.endTimeUtc,
          parentTimezone: data.parentTimezone,
          mentorTimezone: data.mentorTimezone,
          status: 'CONFIRMED',
          meetingUrl: this.generateMeetingUrl(),
        },
        include: {
          parent: {
            include: {
              user: true,
            },
          },
          mentor: {
            include: {
              user: true,
            },
          },
          course: true,
        },
      });

      return booking;
    }, {
      isolationLevel: 'Serializable',
    });
  }

  async cancelBooking(bookingId: string, userId: string, userRole: UserRole): Promise<any> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        parent: {
          include: {
            user: true,
          },
        },
        mentor: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Check authorization
    if (userRole === 'PARENT' && booking.parent.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (userRole === 'MENTOR' && booking.mentor.userId !== userId) {
      throw new Error('Unauthorized');
    }

    // Parents cannot cancel after start time
    if (userRole === 'PARENT' && new Date() > booking.startTimeUtc) {
      throw new Error('Cannot cancel booking after start time');
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    return updated;
  }

  async getBookingById(bookingId: string, userId: string, userRole: UserRole): Promise<any> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        parent: {
          include: {
            user: true,
          },
        },
        mentor: {
          include: {
            user: true,
          },
        },
        course: true,
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Check authorization
    if (userRole === 'PARENT' && booking.parent.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (userRole === 'MENTOR' && booking.mentor.userId !== userId) {
      throw new Error('Unauthorized');
    }

    return booking;
  }

  async listBookings(userId: string, userRole: UserRole, filters?: any): Promise<any[]> {
    let where: any = {};

    if (userRole === 'PARENT') {
      const profile = await prisma.parentProfile.findFirst({
        where: { userId },
      });
      where.parentId = profile?.id;
    } else if (userRole === 'MENTOR') {
      const profile = await prisma.mentorProfile.findFirst({
        where: { userId },
      });
      where.mentorId = profile?.id;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    return prisma.booking.findMany({
      where,
      include: {
        parent: {
          include: {
            user: true,
          },
        },
        mentor: {
          include: {
            user: true,
          },
        },
        course: true,
      },
      orderBy: {
        startTimeUtc: 'asc',
      },
    });
  }

  async checkDailyCapacity(
    mentorId: string,
    localDate: string,
    timezone: string
  ): Promise<number> {
    const { start, end } = TimezoneService.getLocalDayBoundaries(localDate, timezone);

    return prisma.booking.count({
      where: {
        mentorId,
        startTimeUtc: {
          gte: start,
          lte: end,
        },
        status: 'CONFIRMED',
      },
    });
  }

  private generateMeetingUrl(): string {
    const bookingId = uuidv4();
    return `https://meet.codeyoung-demo.com/trial/${bookingId}`;
  }
}

export default new BookingService();
