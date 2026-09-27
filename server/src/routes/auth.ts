import { Router } from 'express';
import AuthenticationService from '../services/AuthenticationService';
import { validateRequest } from '../middleware/validation';
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../schemas/auth';
import { authRateLimiter } from '../middleware/security';

const router = Router();

router.post('/signup', authRateLimiter, validateRequest(signupSchema), async (req, res, next) => {
  try {
    const { email, password, role, timezone, firstName, lastName, phoneNumber, bio, photoUrl } = req.body;

    const result = await AuthenticationService.signup({
      email,
      password,
      role,
      timezone,
      profileData: {
        firstName,
        lastName,
        phoneNumber,
        bio,
        photoUrl,
      },
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Account created successfully',
    });
  } catch (error: any) {
    if (error.message === 'Email already registered') {
      return res.status(409).json({
        success: false,
        error: 'ConflictError',
        message: error.message,
        statusCode: 409,
      });
    }
    return next(error);
  }
});

router.post('/login', authRateLimiter, validateRequest(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await AuthenticationService.login(email, password);

    res.json({
      success: true,
      data: result,
      message: 'Login successful',
    });
  } catch (error: any) {
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({
        success: false,
        error: 'AuthenticationError',
        message: 'Email or password is incorrect',
        statusCode: 401,
      });
    }
    return next(error);
  }
});

router.post('/logout', async (_req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

router.post('/forgot-password', authRateLimiter, validateRequest(forgotPasswordSchema), async (req, res, next) => {
  try {
    await AuthenticationService.requestPasswordReset(req.body.email);
    res.json({
      success: true,
      message: 'Password reset instructions sent',
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/reset-password', authRateLimiter, validateRequest(resetPasswordSchema), async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    await AuthenticationService.resetPassword(token, newPassword);
    res.json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error: any) {
    if (error.message.includes('Invalid or expired')) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: error.message,
        statusCode: 400,
      });
    }
    return next(error);
  }
});

export default router;
