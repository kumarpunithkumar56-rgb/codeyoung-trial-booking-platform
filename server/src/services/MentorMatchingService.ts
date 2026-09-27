import { PrismaClient } from '@prisma/client';
import { DateTime } from 'luxon';
import TimezoneService from './TimezoneService';
import { BOOKING_CONFIG } from '../config/constants';

const prisma = new PrismaClient();

class MentorMatchingService {
  async findAvailableMentor(
    subjectId: string,
    startTimeUtc: Date,
    endTimeUtc: Date,
    _parentTimezone: string
  ): Promise<any | null> {
    const mentors = await prisma.mentorProfile.findMany({
      where: {
        active: true,
        mentorCourses: {
          some: {
            courseId: subjectId,
          },
        },
      },
      include: {
        user: true,
        availability: true,
        bookings: {
          where: {
            status: 'CONFIRMED',
            startTimeUtc: { lte: endTimeUtc },
            endTimeUtc: { gte: startTimeUtc },
          },
        },
      },
    });

    const availableMentors = mentors.filter(m => m.bookings.length === 0);

    const mentorsWithCapacity = [];
    for (const mentor of availableMentors) {
      const localDate = DateTime.fromJSDate(startTimeUtc, { zone: mentor.user.timezone })
        .toISODate();
      
      if (!localDate) continue;

      const capacity = await this.getMentorCapacityStatus(
        mentor.id,
        localDate,
        mentor.user.timezone
      );

      if (capacity.current < capacity.max) {
        mentorsWithCapacity.push(mentor);
      }
    }

    if (mentorsWithCapacity.length === 0) {
      return null;
    }

    return mentorsWithCapacity.sort((a, b) => a.id.localeCompare(b.id))[0];
  }

  private async getMentorCapacityStatus(
    mentorId: string,
    localDate: string,
    mentorTimezone: string
  ): Promise<{ current: number; max: number }> {
    const { start, end } = TimezoneService.getLocalDayBoundaries(localDate, mentorTimezone);

    const current = await prisma.booking.count({
      where: {
        mentorId,
        startTimeUtc: {
          gte: start,
          lte: end,
        },
        status: 'CONFIRMED',
      },
    });

    return {
      current,
      max: BOOKING_CONFIG.MAX_DAILY_TRIALS,
    };
  }
}

export default new MentorMatchingService();
