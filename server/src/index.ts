import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { helmetConfig, corsConfig, conditionalRateLimiter } from './middleware/security';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import bookingRoutes from './routes/bookings';
import mentorRoutes from './routes/mentors';
import courseRoutes from './routes/courses';
import availabilityRoutes from './routes/availability';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmetConfig);
app.use(corsConfig);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting middleware
app.use(conditionalRateLimiter);

// Health check route
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/availability', availabilityRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ Security middleware enabled`);
});

export default app;
