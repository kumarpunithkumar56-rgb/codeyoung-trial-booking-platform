import { z } from 'zod';
import { BOOKING_CONFIG } from '../config/constants';

export const createBookingSchema = z.object({
  mentorId: z.string().uuid('Invalid mentor ID').optional().or(z.literal('')),
  courseId: z.string().uuid('Invalid course ID'),
  childName: z.string().min(1).max(100),
  childAge: z.number().int().min(4).max(18),
  childGrade: z.string().min(1).max(20),
  startTimeUtc: z.string().datetime(),
  parentTimezone: z.string(),
  mentorTimezone: z.string().optional(),
}).refine(
  (data) => {
    const startTime = new Date(data.startTimeUtc);
    const minTime = new Date(Date.now() + BOOKING_CONFIG.MIN_BOOKING_NOTICE_HOURS * 60 * 60 * 1000);
    return startTime >= minTime;
  },
  'Booking must be at least 2 hours in advance'
);
