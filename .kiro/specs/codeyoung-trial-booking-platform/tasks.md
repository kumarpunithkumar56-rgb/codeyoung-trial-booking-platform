# Implementation Plan: Codeyoung Trial Booking Platform

## Overview

This implementation plan breaks down the Codeyoung Trial Booking Platform into discrete, sequential tasks. The platform is a full-stack TypeScript application with React frontend, Express backend, PostgreSQL database, and comprehensive timezone-aware booking logic. Tasks are ordered by dependency, starting with infrastructure setup, then backend services, followed by frontend components, and concluding with testing and documentation.

**Technology Stack:** React + TypeScript + Vite (frontend), Node.js + Express + TypeScript (backend), PostgreSQL + Prisma ORM, Tailwind CSS, Luxon (timezone), Vitest + Supertest (testing)

**Critical Business Rules:**
- All timestamps stored in UTC
- Maximum 2 trial classes per mentor per local calendar day
- Double-booking prevention with database transactions
- Minimum 2-hour booking notice
- 45-minute class duration, 30-minute slot intervals

---

## Tasks

- [ ] 1. Project setup and infrastructure
  - [x] 1.1 Initialize monorepo structure with client, server, prisma directories
    - Create root package.json with workspace configuration
    - Create .gitignore excluding node_modules, .env, dist, build directories
    - Create .env.example with all required environment variables
    - Initialize Git repository
    - _Requirements: 0.4, 0.9_

  - [x] 1.2 Configure TypeScript for client and server
    - Create tsconfig.json for server with strict mode, ES2022 target
    - Create tsconfig.json for client with React JSX support
    - Install TypeScript and type definitions (@types/node, @types/react, @types/express)
    - _Requirements: 0.1, 0.2_

  - [x] 1.3 Setup Vite for frontend development
    - Initialize Vite project in client directory with React + TypeScript template
    - Configure Vite for development server with proxy to backend API
    - Install React Router DOM for client-side routing
    - _Requirements: 0.1_

  - [x] 1.4 Setup Express server with TypeScript
    - Create server/src/index.ts with Express app initialization
    - Configure Express middleware (json body parser)
    - Setup development script with tsx/ts-node for hot reload
    - Configure build script with tsc
    - _Requirements: 0.2_

  - [x] 1.5 Configure Tailwind CSS for styling
    - Install Tailwind CSS and dependencies (postcss, autoprefixer)
    - Create tailwind.config.js with responsive breakpoints (375px, 768px, 1440px)
    - Create base CSS file with Tailwind directives
    - Configure Vite to process Tailwind
    - _Requirements: 0.3, 14.1_

  - [x] 1.6 Setup security middleware (Helmet, CORS, rate limiting)
    - Install helmet, cors, express-rate-limit packages
    - Configure Helmet with CSP directives for Tailwind inline styles
    - Configure CORS with allowed origin from environment variable
    - Setup rate limiters for auth endpoints (5 req/15min) and general API (100 req/15min)
    - _Requirements: 12.1, 12.2, 12.3_

- [ ] 2. Database schema and migrations
  - [x] 2.1 Initialize Prisma ORM and PostgreSQL connection
    - Install Prisma CLI and Prisma Client
    - Initialize Prisma with postgresql provider
    - Configure DATABASE_URL in .env
    - Create initial Prisma schema file structure
    - _Requirements: 0.3, 13.4_

  - [x] 2.2 Define core Prisma schema models
    - Create User model with email, passwordHash, role enum, timezone fields
    - Create ParentProfile and MentorProfile models with foreign keys to User
    - Create Course model with name, description, durationMinutes
    - Create MentorCourse join table for many-to-many relationship
    - Create MentorAvailability model with dayOfWeek, time ranges, timezone
    - Create Booking model with all required fields including UTC timestamps
    - Create Notification model with type enum and user relationship
    - Define enums: UserRole (PARENT, MENTOR, ADMIN), BookingStatus (CONFIRMED, CANCELLED, COMPLETED), NotificationType
    - _Requirements: 13.1, 13.2, 13.3, 13.6_

  - [x] 2.3 Add database indexes for query optimization
    - Add index on User.email (unique constraint provides this)
    - Add composite index on Booking (mentorId, startTimeUtc, status)
    - Add index on Booking.startTimeUtc for date range queries
    - Add index on MentorProfile.active for availability queries
    - Add composite index on Notification (userId, read)
    - Add indexes on MentorCourse (mentorId, courseId)
    - _Requirements: 13.5_

  - [ ] 2.4 Run initial Prisma migration and generate client
    - Run prisma migrate dev to create initial migration
    - Generate Prisma Client with prisma generate
    - Verify database schema created correctly
    - _Requirements: 13.4_

- [ ] 3. Core backend services - Timezone handling
  - [x] 3.1 Implement TimezoneService with Luxon
    - Install Luxon and @types/luxon
    - Create server/src/services/TimezoneService.ts
    - Implement convertToUTC(localTime: string, timezone: string): Date
    - Implement convertFromUTC(utcTime: Date, timezone: string): string
    - Implement formatInTimezone(utcTime: Date, timezone: string, format: string): string
    - Implement getLocalDayBoundaries(date: string, timezone: string): { start: Date, end: Date }
    - Implement validateTimezone(timezone: string): boolean
    - Implement isDSTActive(date: Date, timezone: string): boolean
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

  - [ ]* 3.2 Write unit tests for TimezoneService
    - Test convertToUTC with America/New_York timezone
    - Test convertFromUTC round-trip consistency
    - Test DST spring forward transition (March 10, 2024 at 2:00 AM)
    - Test DST fall back transition (November 3, 2024 at 2:00 AM)
    - Test getLocalDayBoundaries with midnight UTC crossing (Asia/Kolkata)
    - Test timezone validation with valid and invalid IANA identifiers
    - _Requirements: 16.1, 16.2, 16.3_

  - [ ]* 3.3 Write property test for timezone conversion accuracy
    - **Property 6: Timezone Conversion Accuracy**
    - **Validates: Requirements 2.2, 2.4, 6.4**
    - Use fast-check to generate random dates and timezones
    - Verify round-trip conversion (UTC → local → UTC) preserves original timestamp
    - Test with 100+ iterations across 5 major timezones

- [ ] 4. Core backend services - Authentication
  - [x] 4.1 Implement AuthenticationService with bcrypt and JWT
    - Install bcrypt, jsonwebtoken, and type definitions
    - Create server/src/services/AuthenticationService.ts
    - Implement signup(email, password, role, timezone, profileData): Promise<{ user, token }>
    - Implement login(email, password): Promise<{ user, token }>
    - Implement logout(userId): Promise<void>
    - Implement requestPasswordReset(email): Promise<void>
    - Implement resetPassword(token, newPassword): Promise<void>
    - Implement validateToken(token): Promise<User>
    - Implement private methods: hashPassword, comparePassword, generateToken, generateResetToken
    - Use bcrypt with 10 salt rounds, JWT with 7-day expiration
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

  - [ ]* 4.2 Write property test for password hashing security
    - **Property 1: Password Hashing Security**
    - **Validates: Requirements 1.1, 1.2**
    - Generate random passwords with fast-check
    - Verify hashed password is never equal to plaintext
    - Verify hashed password successfully verifies against original
    - Test with 100+ iterations

  - [ ]* 4.3 Write property test for session invalidation
    - **Property 2: Session Invalidation on Logout**
    - **Validates: Requirements 1.3**
    - Create authenticated session, logout, attempt to use token
    - Verify token no longer grants access to protected endpoints

  - [ ]* 4.4 Write property test for password reset token expiration
    - **Property 4: Password Reset Token Expiration**
    - **Validates: Requirements 1.5**
    - Generate reset token with expiration
    - Verify expired tokens are rejected
    - Verify non-expired tokens work correctly

- [ ] 5. Core backend services - Availability and slot generation
  - [x] 5.1 Implement AvailabilityService
    - Create server/src/services/AvailabilityService.ts
    - Implement getAvailableSlots(date, subjectId, parentTimezone): Promise<AvailableSlot[]>
    - Implement getMentorAvailableSlots(mentorId, date, timezone): Promise<TimeSlot[]>
    - Implement private generateSlotsForMentor(mentor, date, timezone): Promise<TimeSlot[]>
    - Implement private filterByExistingBookings(slots, mentorId): Promise<TimeSlot[]>
    - Implement private filterByDailyCapacity(slots, mentorId, timezone): Promise<TimeSlot[]>
    - Implement private applyMinimumNotice(slots): TimeSlot[] (2-hour minimum)
    - Generate 30-minute interval slots within mentor availability hours
    - Each slot duration is 45 minutes
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 5.6_

  - [ ]* 5.2 Write unit tests for slot generation
    - Test 30-minute interval generation within working hours
    - Test filtering slots less than 2 hours from current time
    - Test exclusion of slots with existing bookings
    - Test daily capacity filtering (exclude all slots when mentor at 2/2)

  - [ ]* 5.3 Write property tests for availability service
    - **Property 15: Slot Interval Consistency**
    - **Validates: Requirements 5.2**
    - Verify consecutive slots are exactly 30 minutes apart
    
    - **Property 16: Fixed Class Duration**
    - **Validates: Requirements 5.3**
    - Verify all slots have 45-minute duration
    
    - **Property 18: Booked Slot Exclusion**
    - **Validates: Requirements 5.5**
    - Create booking, verify that exact slot not in available slots
    
    - **Property 19: Minimum Booking Notice**
    - **Validates: Requirements 5.6**
    - Verify all returned slots start at least 2 hours in future

- [ ] 6. Checkpoint - Core services validation
  - Ensure all tests pass for TimezoneService, AuthenticationService, AvailabilityService
  - Verify database schema is correct and migrations run
  - Ask the user if questions arise

- [ ] 7. Core backend services - Booking management
  - [x] 7.1 Implement MentorMatchingService
    - Create server/src/services/MentorMatchingService.ts
    - Implement findAvailableMentor(subjectId, startTimeUtc, endTimeUtc, parentTimezone): Promise<Mentor | null>
    - Filter mentors by subject, no overlapping bookings, and daily capacity
    - Use deterministic selection: sort by ID and return first available
    - _Requirements: 6.5_

  - [x] 7.2 Implement BookingService with transaction logic
    - Create server/src/services/BookingService.ts
    - Implement createBooking(bookingData): Promise<Booking> with Prisma transaction
    - Use serializable isolation level for transaction
    - Lock mentor row, check overlapping bookings, validate daily capacity
    - Generate meeting URL (mock implementation: https://meet.example.com/{uuid})
    - Implement cancelBooking(bookingId, userId, userRole): Promise<Booking>
    - Implement getBookingById(bookingId, userId, userRole): Promise<Booking>
    - Implement listBookings(userId, userRole, filters): Promise<Booking[]>
    - Implement validateBookingSlot(mentorId, startTimeUtc, endTimeUtc): Promise<boolean>
    - Implement checkDailyCapacity(mentorId, localDate, timezone): Promise<number>
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 3.1, 3.2, 11.1, 11.2_

  - [ ]* 7.3 Write unit tests for BookingService daily capacity
    - Test counting bookings in mentor local day, not UTC day
    - Create bookings at 11 PM and 1 AM local time (same UTC day, different local days)
    - Verify capacity calculated per local calendar day

  - [ ]* 7.4 Write property tests for booking business logic
    - **Property 9: Daily Capacity Limit Enforcement**
    - **Validates: Requirements 3.1**
    - Verify mentor cannot have more than 2 CONFIRMED bookings per local day
    
    - **Property 10: Timezone-Based Daily Calculation**
    - **Validates: Requirements 3.2**
    - Test bookings before/after midnight UTC but same local day
    - Verify capacity based on mentor's local calendar day
    
    - **Property 12: Cancellation Releases Capacity**
    - **Validates: Requirements 3.4, 11.2**
    - Book to capacity, cancel one, verify slots become available
    
    - **Property 14: Double-Booking Prevention**
    - **Validates: Requirements 4.2, 4.3, 4.4**
    - Simulate concurrent booking attempts for same slot
    - Verify at most one succeeds

- [ ] 8. Core backend services - Notifications
  - [x] 8.1 Implement NotificationService
    - Create server/src/services/NotificationService.ts
    - Implement createNotification(userId, type, message, metadata): Promise<Notification>
    - Implement getUnreadNotifications(userId): Promise<Notification[]>
    - Implement markAsRead(notificationId): Promise<void>
    - Support notification types: BOOKING_CONFIRMED, BOOKING_CANCELLED, PASSWORD_RESET
    - _Requirements: 7.4, 7.5, 11.5_

  - [ ]* 8.2 Write property test for notification creation
    - **Property 25: Notification Creation on Booking**
    - **Validates: Requirements 7.4, 7.5**
    - Create booking, verify exactly 2 notifications (one for parent, one for mentor)
    
    - **Property 35: Cancellation Notification Creation**
    - **Validates: Requirements 11.5**
    - Cancel booking, verify exactly 2 notifications for affected parties

- [ ] 9. Backend middleware and validation
  - [x] 9.1 Implement authentication middleware
    - Create server/src/middleware/requireAuth.ts
    - Extract JWT from Authorization header
    - Verify token validity using AuthenticationService
    - Attach user to request object (req.user)
    - Return 401 if token missing or invalid
    - _Requirements: 1.4, 1.6_

  - [x] 9.2 Implement authorization middleware
    - Create server/src/middleware/requireRole.ts
    - Create requireRole(allowedRoles: UserRole[]) factory function
    - Check if req.user.role is in allowedRoles
    - Return 403 if user lacks required role
    - _Requirements: 1.4, 1.6_

  - [x] 9.3 Implement input validation with Zod
    - Install zod package
    - Create server/src/middleware/validateRequest.ts factory function
    - Create validation schemas in server/src/schemas/
    - Define signupSchema (email, password rules, timezone validation)
    - Define loginSchema
    - Define createBookingSchema (child details, times, timezone validation)
    - Define passwordResetSchema
    - Return 400 with detailed validation errors on failure
    - _Requirements: 12.4, 6.1_

  - [x] 9.4 Implement centralized error handling middleware
    - Create server/src/middleware/errorHandler.ts
    - Define custom error classes: ValidationError, AuthenticationError, AuthorizationError, NotFoundError, BusinessLogicError
    - Log errors with stack traces (never expose to client)
    - Map error types to HTTP status codes
    - Return consistent JSON error response format
    - Sanitize error messages to prevent sensitive data exposure
    - _Requirements: 12.5_

  - [ ]* 9.5 Write property test for role-based authorization
    - **Property 3: Role-Based Authorization**
    - **Validates: Requirements 1.4, 1.6, 8.6, 10.5**
    - Test parent, mentor, admin accessing various endpoints
    - Verify unauthorized roles receive 401 or 403
    
    - **Property 26: Mentor Data Isolation**
    - **Validates: Requirements 8.1, 8.6**
    - Verify mentor can only access their own bookings
    
    - **Property 31: Parent Data Isolation**
    - **Validates: Requirements 10.5**
    - Verify parent can only access their own bookings
    
    - **Property 34: Admin Unrestricted Cancellation**
    - **Validates: Requirements 11.4**
    - Verify admin can cancel any booking regardless of time/status

- [x] 10. Configuration and constants
  - [x] 10.1 Create configuration constants file
    - Create server/src/config/constants.ts
    - Define BOOKING_CONFIG (MAX_DAILY_TRIALS: 2, CLASS_DURATION_MINUTES: 45, SLOT_INTERVAL_MINUTES: 30, MIN_BOOKING_NOTICE_HOURS: 2)
    - Define AUTH_CONFIG (TOKEN_EXPIRY: '7d', RESET_TOKEN_EXPIRY_MS, SALT_ROUNDS: 10)
    - Define RATE_LIMIT_CONFIG
    - Define SUPPORTED_TIMEZONES array with 10 IANA identifiers
    - Define SUBJECTS array with 6 course subjects
    - Export as const for type safety
    - _Requirements: All business rules_

- [ ] 11. API routes - Authentication
  - [x] 11.1 Implement authentication routes
    - Create server/src/routes/auth.ts
    - POST /api/auth/signup - validate with signupSchema, call AuthenticationService.signup
    - POST /api/auth/login - validate with loginSchema, call AuthenticationService.login
    - POST /api/auth/logout - require authentication, call AuthenticationService.logout
    - POST /api/auth/forgot-password - validate email, call AuthenticationService.requestPasswordReset
    - POST /api/auth/reset-password - validate token and password, call AuthenticationService.resetPassword
    - Return consistent success response format with user data and token
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

  - [ ]* 11.2 Write integration tests for authentication flow
    - Test POST /api/auth/signup with valid data returns 201 and token
    - Test POST /api/auth/login with valid credentials returns token
    - Test POST /api/auth/login with invalid credentials returns 401
    - Test POST /api/auth/logout invalidates token
    - Test protected endpoint access with invalid token returns 401
    - _Requirements: 16.8_

- [ ] 12. API routes - Courses and mentors
  - [x] 12.1 Implement courses and mentors routes
    - Create server/src/routes/courses.ts
    - GET /api/courses - return all courses with id, name, description
    - Create server/src/routes/mentors.ts
    - GET /api/mentors - return active mentors with optional subject filter
    - GET /api/mentors/:id - return mentor details with availability and subjects
    - _Requirements: 6.2, 5.7_

- [ ] 13. API routes - Availability
  - [x] 13.1 Implement availability routes
    - Create server/src/routes/availability.ts
    - GET /api/availability/slots?mentorId=X&date=Y&timezone=Z&subject=S
    - Validate query parameters with Zod schema
    - Call AvailabilityService.getAvailableSlots or getMentorAvailableSlots
    - Return slots with startTimeUtc, endTimeUtc, startTimeLocal, endTimeLocal
    - Return 409 error when no mentors available for requested time
    - _Requirements: 5.1, 5.2, 5.5, 5.6, 5.7, 6.6_

  - [ ]* 13.2 Write property tests for availability queries
    - **Property 17: Availability Timezone Storage**
    - **Validates: Requirements 5.4**
    - Verify all mentor availability records include valid IANA timezone
    
    - **Property 20: Subject-Based Mentor Filtering**
    - **Validates: Requirements 5.7**
    - Query with subject filter, verify all returned mentors teach that subject
    
    - **Property 23: No Available Mentor Error**
    - **Validates: Requirements 6.6**
    - Book all mentors for a time, verify query returns error message

- [ ] 14. API routes - Bookings
  - [ ] 14.1 Implement booking creation route
    - Create server/src/routes/bookings.ts
    - POST /api/bookings - require authentication, require role PARENT
    - Validate with createBookingSchema
    - Call BookingService.createBooking with transaction
    - On success, call NotificationService to create notifications for parent and mentor
    - Return 201 with booking details including ID, meeting URL, times in both timezones
    - Return 409 for capacity exceeded or slot unavailable
    - _Requirements: 6.7, 6.8, 7.1, 7.2, 4.1, 4.2, 4.3, 4.4_

  - [ ] 14.2 Implement booking query routes
    - GET /api/bookings - require authentication
    - Filter by user role: parents see their bookings, mentors see assigned bookings
    - Support query params for filtering: status, startDate, endDate
    - Return bookings with all details including child info and times
    - GET /api/bookings/:id - require authentication
    - Verify user has access (parent owns booking, mentor assigned, or admin)
    - Return 403 if unauthorized
    - _Requirements: 8.1, 10.1, 10.3, 10.4, 10.6_

  - [ ] 14.3 Implement booking cancellation route
    - PATCH /api/bookings/:id/cancel - require authentication
    - Verify user is parent who created booking or admin
    - If parent, reject if current time is after booking start time
    - Admin can cancel regardless of time
    - Update booking status to CANCELLED, set cancelledAt timestamp
    - Call NotificationService to notify parent and mentor
    - Return updated booking
    - _Requirements: 11.1, 11.3, 11.4, 11.5, 11.6_

  - [ ]* 14.4 Write integration tests for booking flow
    - Test POST /api/bookings with valid data creates booking (1st booking succeeds)
    - Test creating 2nd booking for same mentor same day succeeds
    - Test creating 3rd booking for same mentor same day returns 409 with capacity error
    - Test concurrent booking attempts for same slot, verify only one succeeds
    - Test PATCH /api/bookings/:id/cancel releases capacity and slots become available
    - Test parent cannot cancel booking after start time
    - Test admin can cancel any booking
    - Test parent cannot access other parent's bookings (returns 403)
    - Test mentor cannot access other mentor's bookings (returns 403)
    - _Requirements: 16.4, 16.5, 16.6, 16.7, 16.8, 16.9_

  - [ ]* 14.5 Write property tests for booking operations
    - **Property 5: UTC Storage Invariant**
    - **Validates: Requirements 2.1**
    - Create bookings in various timezones, verify stored times are valid UTC
    
    - **Property 8: Dual Timezone Display**
    - **Validates: Requirements 2.6, 7.3**
    - Verify booking confirmation includes both parent and mentor local times
    
    - **Property 21: Required Child Details Validation**
    - **Validates: Requirements 6.1**
    - Attempt booking without child details, verify 400 validation error
    
    - **Property 22: Deterministic Mentor Matching**
    - **Validates: Requirements 6.5**
    - Call matching algorithm with same inputs, verify same mentor selected
    
    - **Property 24: Booking Creation Response Completeness**
    - **Validates: Requirements 6.7, 6.8, 7.1, 7.2**
    - Verify response includes booking ID, meeting URL, child details, both timezones
    
    - **Property 32: Cancellation Status Update**
    - **Validates: Requirements 11.1**
    - Cancel booking, verify status=CANCELLED and cancelledAt timestamp set
    
    - **Property 33: Parent Cancellation Time Restriction**
    - **Validates: Requirements 11.3**
    - Test parent cancellation before/after start time

- [ ] 15. API routes - Dashboards
  - [ ] 15.1 Implement mentor dashboard route
    - Create server/src/routes/dashboard.ts
    - GET /api/mentor/dashboard - require authentication, require role MENTOR
    - Return today's bookings and upcoming bookings for logged-in mentor
    - Include booking count per day with format "X/2"
    - Sort bookings by startTimeUtc ascending
    - Display times in mentor's timezone
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ] 15.2 Implement admin dashboard routes
    - GET /api/admin/dashboard - require authentication, require role ADMIN
    - Calculate analytics: total bookings, active mentors, mentors at capacity
    - Return metrics for display in admin dashboard
    - GET /api/admin/bookings - return all bookings with filters (date, mentor, subject, status)
    - GET /api/admin/mentors - return all mentors with capacity information
    - GET /api/admin/parents - return all parents with booking history
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.6_

  - [ ]* 15.3 Write property tests for dashboard data
    - **Property 13: Capacity Display Accuracy**
    - **Validates: Requirements 3.5, 8.3, 9.2**
    - Create bookings, verify dashboard displays correct X/2 count
    
    - **Property 27: Booking Time Display in Mentor Timezone**
    - **Validates: Requirements 8.4**
    - Verify mentor dashboard displays times in mentor's configured timezone
    
    - **Property 28: Admin Filter Accuracy**
    - **Validates: Requirements 9.1, 9.5**
    - Apply filters to admin booking query, verify all results match criteria
    
    - **Property 29: Admin Analytics Calculation**
    - **Validates: Requirements 9.3**
    - Verify analytics metrics calculated correctly from database state
    
    - **Property 30: Parent Booking Categorization**
    - **Validates: Requirements 10.2**
    - Verify bookings categorized as Upcoming, Past, or Cancelled correctly

- [ ] 16. API routes - Mount all routes
  - [x] 16.1 Wire all routes to Express app
    - In server/src/index.ts, import all route modules
    - Mount routes: app.use('/api/auth', authRoutes)
    - Mount routes: app.use('/api/courses', coursesRoutes)
    - Mount routes: app.use('/api/mentors', mentorsRoutes)
    - Mount routes: app.use('/api/availability', availabilityRoutes)
    - Mount routes: app.use('/api/bookings', bookingsRoutes)
    - Mount routes: app.use('/api/mentor', mentorDashboardRoutes)
    - Mount routes: app.use('/api/admin', adminDashboardRoutes)
    - Apply requireAuth middleware to protected routes
    - Apply requireRole middleware to role-specific routes
    - Mount error handling middleware as final middleware
    - _Requirements: All API endpoints_

  - [ ]* 16.2 Write property tests for input validation and security
    - **Property 36: Input Validation Rejection**
    - **Validates: Requirements 12.4**
    - Send invalid data to endpoints, verify 400 status with validation errors
    
    - **Property 37: Error Message Security**
    - **Validates: Requirements 12.5**
    - Trigger various errors, verify responses don't contain sensitive info

- [ ] 17. Database seeding script
  - [ ] 17.1 Create comprehensive seed script
    - Create prisma/seed.ts
    - Create 3 demo accounts: demo.parent@example.com, demo.mentor@example.com, demo.admin@example.com (all password: Demo123!)
    - Create 6 courses: Coding Basics, Python, Web Development, Math, Science, Robotics
    - Create 10 mentors with diverse timezones (America/New_York, America/Los_Angeles, Europe/London, Asia/Kolkata, Asia/Tokyo, Australia/Sydney, etc.)
    - Assign subjects to mentors via MentorCourse join table
    - Create weekly availability for each mentor (various days and hours)
    - Create 5 parent accounts with different timezones
    - Create demo bookings showing: 0/2 capacity, 1/2 capacity, 2/2 capacity (at capacity)
    - Create booking demonstrating NY parent + Kolkata mentor timezone conversion
    - Create past bookings and cancelled bookings
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8_

  - [ ] 17.2 Configure Prisma seed command
    - Add seed command to prisma section of package.json
    - Test running: npx prisma db seed
    - Verify all demo data created successfully

- [ ] 18. Checkpoint - Backend complete
  - Ensure all API routes work correctly with Postman or similar tool
  - Verify all integration tests pass
  - Verify all property-based tests pass
  - Verify seed script creates demo data successfully
  - Ask the user if questions arise

- [ ] 19. Frontend setup and routing
  - [ ] 19.1 Setup React Router with route structure
    - Install react-router-dom
    - Create client/src/App.tsx with BrowserRouter
    - Define routes: /, /signup, /login, /forgot-password, /reset-password/:token
    - Define protected routes: /dashboard, /parent/dashboard, /parent/book-trial, /parent/bookings, /parent/bookings/:id
    - Define mentor routes: /mentor/dashboard
    - Define admin routes: /admin/dashboard, /admin/bookings, /admin/mentors, /admin/parents
    - _Requirements: 0.1_

  - [ ] 19.2 Create layout components
    - Create client/src/layouts/AuthLayout.tsx for public pages
    - Create client/src/layouts/DashboardLayout.tsx with navigation sidebar
    - Create role-specific navigation menus (Parent, Mentor, Admin)
    - Add logout button in dashboard layout
    - _Requirements: 14.6_

  - [ ] 19.3 Setup Axios API client
    - Install axios
    - Create client/src/services/api.ts with Axios instance
    - Configure base URL from environment variable
    - Add request interceptor to attach JWT token from localStorage
    - Add response interceptor for error handling
    - _Requirements: 1.2_

- [ ] 20. Frontend authentication context and hooks
  - [ ] 20.1 Implement authentication context
    - Create client/src/contexts/AuthContext.tsx
    - Create AuthProvider component with state for user, token, loading
    - Implement login, logout, signup methods
    - Store token in localStorage
    - Fetch user profile on app initialization if token exists
    - Export useAuth hook for accessing auth state
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 20.2 Create ProtectedRoute component
    - Create client/src/components/ProtectedRoute.tsx
    - Check if user is authenticated via useAuth
    - Check if user has required role (if specified)
    - Redirect to /login if not authenticated
    - Show "Access Denied" if wrong role
    - _Requirements: 1.4, 1.6_

- [ ] 21. Frontend authentication pages
  - [x] 21.1 Create signup page
    - Create client/src/pages/SignupPage.tsx
    - Form fields: email, password, confirm password, role (radio: Parent/Mentor), timezone (dropdown), firstName, lastName, phoneNumber (optional)
    - Auto-detect user timezone with Intl.DateTimeFormat().resolvedOptions().timeZone
    - Validate password strength client-side
    - Call POST /api/auth/signup on submit
    - Store token and redirect to dashboard on success
    - Display validation errors below fields
    - _Requirements: 1.1, 2.2_

  - [ ] 21.2 Create login page
    - Create client/src/pages/LoginPage.tsx
    - Form fields: email, password
    - Call POST /api/auth/login on submit
    - Store token and redirect to dashboard
    - Link to forgot password page
    - _Requirements: 1.2_

  - [ ] 21.3 Create forgot password and reset password pages
    - Create client/src/pages/ForgotPasswordPage.tsx
    - Form field: email
    - Call POST /api/auth/forgot-password
    - Show success message
    - Create client/src/pages/ResetPasswordPage.tsx
    - Extract token from URL params
    - Form fields: new password, confirm password
    - Call POST /api/auth/reset-password with token
    - Redirect to login on success
    - _Requirements: 1.5_

- [ ] 22. Frontend utility hooks and helpers
  - [ ] 22.1 Create timezone utility hook
    - Create client/src/hooks/useTimezone.ts
    - Return user's detected timezone
    - Create client/src/utils/timezone.ts with helper functions
    - Implement formatInUserTimezone(utcDate, timezone, format)
    - Implement getLocalTime(utcDate, timezone) for display
    - _Requirements: 2.2, 6.4_

  - [ ] 22.2 Create toast notification hook
    - Install react-hot-toast or similar library
    - Create client/src/hooks/useToast.ts wrapper
    - Configure toast positioning and auto-dismiss (5 seconds)
    - Use throughout app for success/error messages
    - _Requirements: 14.5_

- [ ] 23. Frontend parent booking flow - Multi-step form
  - [x] 23.1 Create booking wizard component structure
    - Create client/src/pages/BookTrialPage.tsx
    - Implement multi-step form with React Hook Form
    - Steps: 1) Child Details, 2) Subject Selection, 3) Date & Time, 4) Mentor Selection, 5) Review & Confirm
    - Add progress indicator showing current step
    - Add Previous/Next navigation buttons
    - _Requirements: 6.1, 6.2, 6.3, 6.5_

  - [ ] 23.2 Implement Step 1 - Child details form
    - Form fields: childName (text), childAge (number, 4-18), childGrade (text)
    - Validate required fields
    - Store in form state
    - _Requirements: 6.1_

  - [ ] 23.3 Implement Step 2 - Subject selection
    - Fetch courses from GET /api/courses
    - Display as cards with name and description
    - Allow single selection
    - Store selected courseId in form state
    - _Requirements: 6.2_

  - [ ] 23.4 Implement Step 3 - Date and time selection
    - Date picker for selecting trial class date
    - Restrict to future dates only (minimum 2 hours from now)
    - After date selection, fetch available slots: GET /api/availability/slots?date=X&subject=Y&timezone=Z
    - Display available time slots in parent's local timezone
    - Show "No available mentors" message if empty response
    - Allow single time slot selection
    - _Requirements: 6.3, 6.4, 6.6_

  - [ ] 23.5 Implement Step 4 - Mentor selection
    - Display mentor information for selected time slot
    - Show mentor name, bio, photo (if available), subjects
    - Show "Auto-assigned mentor" if using deterministic matching
    - Option to "Try another time" to go back to Step 3
    - _Requirements: 6.5_

  - [ ] 23.6 Implement Step 5 - Review and confirmation
    - Display summary: child details, subject, selected time slot
    - Show time in both parent local time and mentor local time
    - Show mentor name
    - "Confirm Booking" button
    - Call POST /api/bookings on confirm
    - On success, redirect to booking confirmation page with booking ID
    - On error (slot no longer available, capacity exceeded), show error message with option to retry
    - _Requirements: 6.7, 6.8, 2.6_

  - [ ] 23.7 Create booking confirmation page
    - Create client/src/pages/BookingConfirmationPage.tsx
    - Display success message
    - Show booking details: booking ID, child name, subject, mentor, date/time (both timezones)
    - Show meeting URL with "Join Class" button (disabled until class time)
    - Button to "Book Another Trial" or "View My Bookings"
    - _Requirements: 7.1, 7.2, 7.3_

- [ ] 24. Frontend parent dashboard and booking history
  - [x] 24.1 Create parent dashboard
    - Create client/src/pages/ParentDashboardPage.tsx
    - Display welcome message with parent name
    - Show upcoming bookings (next 3)
    - "Book a Free Trial" CTA button linking to /parent/book-trial
    - _Requirements: 6.1_

  - [ ] 24.2 Create parent bookings page
    - Create client/src/pages/ParentBookingsPage.tsx
    - Fetch bookings from GET /api/bookings
    - Display in three tabs: Upcoming, Past, Cancelled
    - Filter bookings by status and time
    - Each booking card shows: child name, subject, mentor, date, time (parent timezone), status
    - Action buttons: "View Details", "Join Class" (if time is within window), "Cancel" (if upcoming)
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ] 24.3 Create booking details page
    - Create client/src/pages/BookingDetailsPage.tsx
    - Fetch booking from GET /api/bookings/:id
    - Display comprehensive information: booking ID, child details, subject, mentor name, date/time in both timezones, status, meeting URL
    - Show "Join Class" button if booking is upcoming and within join window
    - Show "Cancel Booking" button if status is CONFIRMED and before start time
    - _Requirements: 10.6_

  - [ ] 24.4 Implement booking cancellation flow
    - Add confirmation modal before cancellation
    - Call PATCH /api/bookings/:id/cancel
    - Show success toast notification
    - Update UI to reflect CANCELLED status
    - Disable "Cancel" button after cancellation
    - _Requirements: 11.1, 11.3, 11.6_

- [ ] 25. Frontend mentor dashboard
  - [x] 25.1 Create mentor dashboard
    - Create client/src/pages/MentorDashboardPage.tsx
    - Fetch bookings from GET /api/mentor/dashboard
    - Display "Today's Classes" section with bookings for current day
    - Display "Upcoming Classes" section sorted by date
    - Each booking card shows: child name, age, grade, subject, time (mentor timezone), parent name
    - Show daily capacity indicator: "You have X/2 classes today"
    - Display meeting URL with "Join Class" button
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 26. Frontend admin dashboard
  - [x] 26.1 Create admin dashboard overview
    - Create client/src/pages/AdminDashboardPage.tsx
    - Fetch analytics from GET /api/admin/dashboard
    - Display metric cards: Total Bookings, Active Mentors, Mentors at Capacity
    - Show recent bookings list
    - Links to detailed management pages
    - _Requirements: 9.3_

  - [ ] 26.2 Create admin bookings management page
    - Create client/src/pages/AdminBookingsPage.tsx
    - Fetch bookings from GET /api/admin/bookings
    - Add filters: date range, mentor dropdown, subject dropdown, status dropdown
    - Display bookings table with columns: ID, parent, mentor, child, subject, date/time, status
    - "View Details" button for each booking
    - "Cancel" button for CONFIRMED bookings
    - _Requirements: 9.1, 9.4, 9.5_

  - [ ] 26.3 Create admin mentors management page
    - Create client/src/pages/AdminMentorsPage.tsx
    - Fetch mentors from GET /api/admin/mentors
    - Display mentors table with columns: name, email, timezone, subjects, active status, current capacity
    - Show capacity as "X/2" for today
    - _Requirements: 9.2_

  - [ ] 26.4 Create admin parents management page
    - Create client/src/pages/AdminParentsPage.tsx
    - Fetch parents from GET /api/admin/parents
    - Display parents table with columns: name, email, timezone, total bookings
    - Link to view parent's booking history
    - _Requirements: 9.6_

- [ ] 27. Frontend responsive design and polish
  - [ ] 27.1 Implement responsive layouts
    - Ensure all pages work at mobile (375px), tablet (768px), desktop (1440px) breakpoints
    - Use Tailwind responsive utilities (sm:, md:, lg:)
    - Test navigation sidebar collapses to hamburger menu on mobile
    - Test booking wizard is usable on mobile
    - Test dashboards adapt to smaller screens
    - _Requirements: 14.1_

  - [ ] 27.2 Add loading states and skeletons
    - Create client/src/components/LoadingSpinner.tsx
    - Create client/src/components/SkeletonLoader.tsx
    - Show loading spinner during API calls
    - Show skeleton loaders for dashboard content while fetching
    - Disable buttons during form submission
    - _Requirements: 14.2, 14.3_

  - [ ] 27.3 Add empty states
    - Create empty state component for "No bookings yet"
    - Create empty state for "No available slots"
    - Create empty state for admin pages with no data
    - Include friendly message and CTA button
    - _Requirements: 14.4_

  - [ ] 27.4 Implement accessibility features
    - Use semantic HTML (header, nav, main, footer, article, section)
    - Add ARIA labels to interactive elements
    - Ensure all form inputs have associated labels
    - Test keyboard navigation through all forms and buttons
    - Ensure focus states are visible
    - Add skip-to-content link
    - _Requirements: 14.7, 14.8, 14.9, 14.10_

- [ ] 28. Frontend landing page
  - [ ] 28.1 Create public landing page
    - Create client/src/pages/LandingPage.tsx
    - Hero section with platform introduction
    - Features section highlighting key benefits
    - CTA buttons: "Sign Up as Parent" and "Sign Up as Mentor"
    - Responsive design
    - _Requirements: 0.1_

- [ ] 29. Checkpoint - Frontend complete
  - Manually test complete user flows in browser
  - Test parent booking flow end-to-end
  - Test mentor viewing assigned classes
  - Test admin managing bookings
  - Verify responsive design on different screen sizes
  - Ask the user if questions arise

- [ ] 30. Documentation
  - [ ] 30.1 Create comprehensive README.md
    - Project overview and features
    - Technology stack summary
    - Prerequisites (Node.js version, PostgreSQL)
    - Installation instructions (clone, install deps, setup DB)
    - Environment variables documentation
    - Database setup (migrations, seeding)
    - Running the application (dev mode for client and server)
    - Running tests (unit, integration, property-based)
    - Project structure overview
    - API documentation summary with endpoint list
    - Demo account credentials (demo.parent@example.com, demo.mentor@example.com, demo.admin@example.com, password: Demo123!)
    - Architecture diagram or description
    - Key design decisions (timezone handling, transaction usage, etc.)
    - Future enhancements
    - _Requirements: 0.7_

  - [ ] 30.2 Create TRANSCRIPT.md
    - Document development process
    - Include major technical decisions made
    - Include challenges encountered and solutions
    - Include testing approach and results
    - No fabricated AI conversations - only actual development notes
    - _Requirements: 0.8_

  - [ ] 30.3 Add inline code documentation
    - Add JSDoc comments to all service methods
    - Document complex business logic (capacity calculation, slot generation, double-booking prevention)
    - Add comments for timezone conversion edge cases
    - Document API route handlers with request/response format
    - _Requirements: 0.7_

- [ ] 31. Final validation and polish
  - [ ] 31.1 Run all tests and verify coverage
    - Run npm test in server directory
    - Verify all unit tests pass
    - Verify all integration tests pass
    - Verify all property-based tests pass
    - Check test coverage report (aim for 80%+)
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 16.8, 16.9_

  - [ ] 31.2 Security and code quality review
    - Verify all environment variables in .env are in .gitignore
    - Verify no secrets committed to Git
    - Run ESLint and fix any errors
    - Run Prettier to format all code
    - Check that CORS, Helmet, rate limiting are configured
    - Verify password reset tokens expire properly
    - Verify authorization checks on all protected routes
    - _Requirements: 0.9, 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ] 31.3 End-to-end manual testing
    - Test complete parent booking flow: signup → login → book trial → view bookings → cancel
    - Test timezone conversion: create booking as NY parent with Kolkata mentor, verify times displayed correctly
    - Test daily capacity: book 2 trials for a mentor on same day (success), attempt 3rd (fail with proper error)
    - Test double-booking: simulate concurrent booking attempts, verify only one succeeds
    - Test authorization: verify parent cannot access other parent's data, mentor cannot access other mentor's data
    - Test all three user roles (parent, mentor, admin) with demo accounts
    - Test responsive design on mobile device or browser DevTools
    - Test DST edge cases if possible (or verify with unit tests)
    - _Requirements: All_

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements from the requirements document for traceability
- Checkpoints ensure incremental validation and provide opportunities to ask questions
- Property-based tests validate universal correctness properties with 100+ iterations each
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end API flows
- All 37 correctness properties from the design document are covered in property test tasks
- The implementation uses TypeScript throughout for type safety
- Database transactions with serializable isolation level ensure double-booking prevention
- All timestamps stored in UTC, displayed in user's local timezone using Luxon
- Mentor daily capacity calculated based on local calendar day, not UTC day

