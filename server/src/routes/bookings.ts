import { Router } from 'express';
import BookingService from '../services/BookingService';
import NotificationService from '../services/NotificationService';
import MentorMatchingService from '../services/MentorMatchingService';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { createBookingSchema } from '../schemas/booking';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.post('/', requireAuth, requireRole('PARENT'), validateRequest(createBookingSchema), async (req: AuthRequest, res, next) => {
  try {
    const { mentorId, courseId, childName, childAge, childGrade, startTimeUtc, parentTimezone } = req.body;

    const parentProfile = await prisma.parentProfile.findFirst({
      where: { userId: req.user!.userId },
    });

    if (!parentProfile) {
      return res.status(404).json({
        success: false,
        error: 'NotFoundError',
        message: 'Parent profile not found',
        statusCode: 404,
      });
    }

    const startTime = new Date(startTimeUtc);
    const endTime = new Date(startTime.getTime() + 45 * 60 * 1000);

    let finalMentorId = mentorId;
    let finalMentorTimezone = req.body.mentorTimezone;

    if (finalMentorId) {
      const mentor = await prisma.mentorProfile.findUnique({
        where: { id: finalMentorId },
        include: { user: true },
      });

      if (!mentor || !mentor.active) {
        return res.status(404).json({
          success: false,
          error: 'NotFoundError',
          message: 'Selected mentor is not available',
          statusCode: 404,
        });
      }

      finalMentorTimezone = mentor.user.timezone;
    } else {
      const matchedMentor = await MentorMatchingService.findAvailableMentor(
        courseId,
        startTime,
        endTime,
        parentTimezone
      );

      if (!matchedMentor) {
        return res.status(409).json({
          success: false,
          error: 'NoMentorAvailable',
          message: 'No mentor is available for the selected time slot. Please choose another date or time.',
          statusCode: 409,
        });
      }

      finalMentorId = matchedMentor.id;
      finalMentorTimezone = matchedMentor.user.timezone;
    }

    const booking = await BookingService.createBooking({
      parentId: parentProfile.id,
      mentorId: finalMentorId,
      courseId,
      childName,
      childAge,
      childGrade,
      startTimeUtc: startTime,
      endTimeUtc: endTime,
      parentTimezone,
      mentorTimezone: finalMentorTimezone,
    });

    // Create notifications
    await NotificationService.createNotification(
      req.user!.userId,
      'BOOKING_CONFIRMED',
      `Your trial class for ${childName} has been confirmed!`,
      { bookingId: booking.id }
    );

    await NotificationService.createNotification(
      booking.mentor.userId,
      'BOOKING_CONFIRMED',
      `New trial class assigned: ${childName} - ${booking.course.name}`,
      { bookingId: booking.id }
    );

    return res.status(201).json({
      success: true,
      data: booking,
      message: 'Booking created successfully',
    });
  } catch (error: any) {
    return next(error);
  }
});

router.get('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const bookings = await BookingService.listBookings(req.user!.userId, req.user!.role);
    return res.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const booking = await BookingService.getBookingById(req.params.id, req.user!.userId, req.user!.role);
    return res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id/cancel', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const booking = await BookingService.cancelBooking(req.params.id, req.user!.userId, req.user!.role);

    await NotificationService.createNotification(
      req.user!.userId,
      'BOOKING_CANCELLED',
      `Booking cancelled: ${booking.childName}`,
      { bookingId: booking.id }
    );

    return res.json({
      success: true,
      data: booking,
      message: 'Booking cancelled successfully',
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
