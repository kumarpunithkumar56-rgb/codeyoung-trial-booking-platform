import { Router } from 'express';
import AvailabilityService from '../services/AvailabilityService';
import { z } from 'zod';

const router = Router();

const availabilitySlotsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timezone: z.string(),
  subjectId: z.string().optional(),
  mentorId: z.string().optional(),
});

router.get('/slots', async (req, res, next) => {
  try {
    const params = availabilitySlotsSchema.parse(req.query);

    let slots = [];
    if (params.mentorId) {
      slots = await AvailabilityService.getMentorAvailableSlots(
        params.mentorId,
        params.date,
        params.timezone
      );
    } else if (params.subjectId) {
      slots = await AvailabilityService.getAvailableSlots(
        params.date,
        params.subjectId,
        params.timezone
      );
    } else {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Either subjectId or mentorId is required',
        statusCode: 400,
      });
    }

    return res.json({
      success: true,
      data: slots,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Invalid query parameters',
        details: error.errors,
        statusCode: 400,
      });
    }
    return next(error);
  }
});

export default router;
