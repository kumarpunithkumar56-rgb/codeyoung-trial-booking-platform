import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (_req, res, next) => {
  try {
    const courses = await prisma.course.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    res.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
