import { PrismaClient } from '@prisma/client';
import { DateTime } from 'luxon';
import TimezoneService from './TimezoneService';
import { BOOKING_CONFIG } from '../config/constants';

const prisma = new PrismaClient();

interface TimeSlot {
  startTimeUtc: string;
  endTimeUtc: string;
  startTimeLocal: string;
  endTimeLocal: string;
  mentorId?: string;
  mentorName?: string;
}

class AvailabilityService {
  async getAvailableSlots(
    date: string,
    subjectId: string,
    _parentTimezone: string
  ): Promise<TimeSlot[]> {
    // Get all mentors who teach this subject
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
        mentorCourses: {
          include: {
            course: true,
          },
        },
      },
    });

    const allSlots: TimeSlot[] = [];

    for (const mentor of mentors) {
      const mentorSlots = await this.getMentorAvailableSlots(
        mentor.id,
        date,
        mentor.user.timezone
      );

      allSlots.push(...mentorSlots.map(slot => ({
        ...slot,
        mentorId: mentor.id,
        mentorName: `${mentor.firstName} ${mentor.lastName}`,
      })));
    }

    // Sort by start time
    return allSlots.sort((a, b) => 
      new Date(a.startTimeUtc).getTime() - new Date(b.startTimeUtc).getTime()
    );
  }

  async getMentorAvailableSlots(
    mentorId: string,
    date: string,
    timezone: string
  ): Promise<TimeSlot[]> {
    const mentor = await prisma.mentorProfile.findUnique({
      where: { id: mentorId },
      include: {
        user: true,
        availability: true,
        bookings: {
          where: {
            status: 'CONFIRMED',
          },
        },
      },
    });

    if (!mentor || !mentor.active) {
      return [];
    }

    // Generate slots for this mentor
    const slots = await this.generateSlotsForMentor(mentor, date, timezone);

    // Filter by existing bookings
    const filteredByBookings = await this.filterByExistingBookings(slots, mentorId);

    // Filter by daily capacity
    const filteredByCapacity = await this.filterByDailyCapacity(
      filteredByBookings,
      mentorId,
      timezone
    );

    // Apply minimum notice
    const finalSlots = this.applyMinimumNotice(filteredByCapacity);

    return finalSlots;
  }

  private async generateSlotsForMentor(
    mentor: any,
    date: string,
    mentorTimezone: string
  ): Promise<TimeSlot[]> {
    const dayOfWeek = DateTime.fromISO(date, { zone: mentorTimezone }).weekday;
    
    const availability = mentor.availability.find(
      (a: any) => a.dayOfWeek === dayOfWeek
    );

    if (!availability) {
      return [];
    }

    const slots: TimeSlot[] = [];
    let current = DateTime.fromISO(`${date}T${availability.startTime}`, {
      zone: mentorTimezone,
    });
    const end = DateTime.fromISO(`${date}T${availability.endTime}`, {
      zone: mentorTimezone,
    });

    while (current.plus({ minutes: BOOKING_CONFIG.CLASS_DURATION_MINUTES }) <= end) {
      const slotEnd = current.plus({ minutes: BOOKING_CONFIG.CLASS_DURATION_MINUTES });

      slots.push({
        startTimeUtc: current.toUTC().toISO()!,
        endTimeUtc: slotEnd.toUTC().toISO()!,
        startTimeLocal: current.toISO()!,
        endTimeLocal: slotEnd.toISO()!,
      });

      current = current.plus({ minutes: BOOKING_CONFIG.SLOT_INTERVAL_MINUTES });
    }

    return slots;
  }

  private async filterByExistingBookings(
    slots: TimeSlot[],
    mentorId: string
  ): Promise<TimeSlot[]> {
    const bookings = await prisma.booking.findMany({
      where: {
        mentorId,
        status: 'CONFIRMED',
      },
    });

    return slots.filter(slot => {
      const slotStart = new Date(slot.startTimeUtc);
      const slotEnd = new Date(slot.endTimeUtc);

      return !bookings.some(booking => {
        const bookingStart = booking.startTimeUtc;
        const bookingEnd = booking.endTimeUtc;

        return slotStart < bookingEnd && slotEnd > bookingStart;
      });
    });
  }

  private async filterByDailyCapacity(
    slots: TimeSlot[],
    mentorId: string,
    mentorTimezone: string
  ): Promise<TimeSlot[]> {
    if (slots.length === 0) return [];

    // Group slots by local date
    const slotsByDate = new Map<string, TimeSlot[]>();

    for (const slot of slots) {
      const localDate = DateTime.fromISO(slot.startTimeUtc, { zone: 'utc' })
        .setZone(mentorTimezone)
        .toISODate();

      if (localDate) {
        if (!slotsByDate.has(localDate)) {
          slotsByDate.set(localDate, []);
        }
        slotsByDate.get(localDate)!.push(slot);
      }
    }

    // Check capacity for each date
    const validSlots: TimeSlot[] = [];

    for (const [localDate, dateSlots] of slotsByDate) {
      const { start, end } = TimezoneService.getLocalDayBoundaries(
        localDate,
        mentorTimezone
      );

      const bookingCount = await prisma.booking.count({
        where: {
          mentorId,
          startTimeUtc: {
            gte: start,
            lte: end,
          },
          status: 'CONFIRMED',
        },
      });

      if (bookingCount < BOOKING_CONFIG.MAX_DAILY_TRIALS) {
        validSlots.push(...dateSlots);
      }
    }

    return validSlots;
  }

  private applyMinimumNotice(slots: TimeSlot[]): TimeSlot[] {
    const now = DateTime.now();
    const minTime = now.plus({ hours: BOOKING_CONFIG.MIN_BOOKING_NOTICE_HOURS });

    return slots.filter(slot => {
      const slotStart = DateTime.fromISO(slot.startTimeUtc);
      return slotStart >= minTime;
    });
  }
}

export default new AvailabilityService();
