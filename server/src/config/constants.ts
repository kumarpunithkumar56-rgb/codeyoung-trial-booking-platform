// Business rule constants for Codeyoung Trial Booking Platform

export const BOOKING_CONFIG = {
  // Maximum trial classes per mentor per local calendar day
  MAX_DAILY_TRIALS: 2,
  
  // Duration of each trial class in minutes
  CLASS_DURATION_MINUTES: 45,
  
  // Interval between available time slots in minutes
  SLOT_INTERVAL_MINUTES: 30,
  
  // Minimum notice required before booking (in hours)
  MIN_BOOKING_NOTICE_HOURS: 2,
  
  // How far in advance parents can book (in days)
  MAX_ADVANCE_BOOKING_DAYS: 30,
} as const;

export const AUTH_CONFIG = {
  // JWT token expiration
  TOKEN_EXPIRY: '7d',
  
  // Password reset token expiry (in milliseconds)
  RESET_TOKEN_EXPIRY_MS: 60 * 60 * 1000, // 1 hour
  
  // Bcrypt salt rounds
  SALT_ROUNDS: 10,
} as const;

export const RATE_LIMIT_CONFIG = {
  // Auth endpoints
  AUTH_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  AUTH_MAX_REQUESTS: 5,
  
  // General API
  API_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  API_MAX_REQUESTS: 100,
} as const;

export const SUPPORTED_TIMEZONES = [
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'America/Denver',
  'Europe/London',
  'Europe/Paris',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Tokyo',
  'Australia/Sydney',
] as const;

export const SUBJECTS = [
  { id: 'coding-basics', name: 'Coding Basics', description: 'Introduction to programming concepts' },
  { id: 'python', name: 'Python Programming', description: 'Learn Python from scratch' },
  { id: 'web-dev', name: 'Web Development', description: 'HTML, CSS, and JavaScript' },
  { id: 'math', name: 'Mathematics', description: 'Math concepts and problem solving' },
  { id: 'science', name: 'Science', description: 'Scientific concepts and experiments' },
  { id: 'robotics', name: 'Robotics', description: 'Build and program robots' },
] as const;
