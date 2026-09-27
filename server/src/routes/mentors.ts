import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res, next) => {
  try {
    const { subjectId } = req.query;

    const where: any = {
      active: true,
    };

    if (subjectId) {
      where.mentorCourses = {
        some: {
          courseId: subjectId as string,
        },
      };
    }

    const mentors = await prisma.mentorProfile.findMany({
      where,
      include: {
        user: true,
        mentorCourses: {
          include: {
            course: true,
          },
        },
        availability: true,
      },
    });

    res.json({
      success: true,
      data: mentors,
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const mentor = await prisma.mentorProfile.findUnique({
      where: { id: req.params.id },
      include: {
        user: true,
        mentorCourses: {
          include: {
            course: true,
          },
        },
        availability: true,
      },
    });

    if (!mentor) {
      return res.status(404).json({
        success: false,
        error: 'NotFoundError',
        message: 'Mentor not found',
        statusCode: 404,
      });
    }

    res.json({
      success: true,
      data: mentor,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
