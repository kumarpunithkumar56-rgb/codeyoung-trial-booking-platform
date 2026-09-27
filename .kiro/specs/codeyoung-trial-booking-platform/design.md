# Design Document: Codeyoung Trial Booking Platform

## Overview

The Codeyoung Trial Booking Platform is a full-stack web application that connects parents with mentors for scheduling free trial educational classes. The system manages three distinct user roles (Parent, Mentor, Admin) and implements sophisticated timezone-aware scheduling with strict business rules around mentor capacity and double-booking prevention.

**Core Features:**
- Role-based authentication and authorization (Parent, Mentor, Admin)
- Timezone-aware booking system with UTC storage and local display
- Mentor capacity management (max 2 trial classes per local calendar day)
- Double-booking prevention with transaction-level locking
- Responsive UI supporting mobile, tablet, and desktop
- Real-time availability slot generation
- Deterministic mentor matching algorithm

**Technology Decisions:**
- **Frontend:** React + TypeScript + Vite for fast development and modern DX
- **Backend:** Node.js + Express + TypeScript for type safety across the stack
- **Database:** PostgreSQL with Prisma ORM for type-safe queries and migrations
- **Styling:** Tailwind CSS for rapid, consistent UI development
- **Timezone:** Luxon for comprehensive IANA timezone and DST support
- **Testing:** Vitest for unit tests, Supertest for API integration tests

## Architecture

### System Architecture Overview

The platform follows a monorepo structure with clear separation between client and server:

```
codeyoung-trial-booking-platform/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── pages/            # Route-level page components
│   │   ├── components/       # Reusable UI components
│   │   ├── layouts/          # Layout wrappers (AuthLayout, DashboardLayout)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API client services
│   │   ├── utils/            # Utility functions (timezone, formatting)
│   │   ├── types/            # TypeScript type definitions
│   │   └── App.tsx           # Root component with routing
│   ├── public/               # Static assets
│   └── package.json
├── server/                    # Backend Node.js application
│   ├── src/
│   │   ├── routes/           # Express route handlers
│   │   ├── services/         # Business logic layer
│   │   ├── middleware/       # Auth, validation, error handling
│   │   ├── utils/            # Utility functions
│   │   ├── types/            # TypeScript type definitions
│   │   └── index.ts          # Express app entry point
│   └── package.json
├── prisma/                    # Database schema and migrations
│   ├── schema.prisma         # Prisma schema definition
│   ├── seed.ts               # Demo data seeding script
│   └── migrations/           # Database migration files
├── tests/                     # Integration and E2E tests
│   ├── unit/                 # Unit tests for services
│   └── integration/          # API integration tests
├── README.md                  # Setup and documentation
├── TRANSCRIPT.md             # Development process log
└── package.json              # Root workspace configuration
```

### Frontend Architecture

**Routing Structure:**
- `/` - Landing page with platform introduction
- `/signup` - User registration (role selection)
- `/login` - User authentication
- `/forgot-password` - Password reset request
- `/reset-password/:token` - Password reset form
- `/dashboard` - Role-specific dashboard (redirects based on role)
- `/parent/dashboard` - Parent view with booking CTA
- `/parent/book-trial` - Multi-step booking flow
- `/parent/bookings` - Booking history
- `/parent/bookings/:id` - Booking details
- `/mentor/dashboard` - Mentor view with class schedule
- `/admin/dashboard` - Admin analytics and operations
- `/admin/bookings` - All bookings management
- `/admin/mentors` - Mentor management
- `/admin/parents` - Parent management

**Component Hierarchy:**
```
App
├── Router
│   ├── PublicRoutes
│   │   ├── LandingPage
│   │   ├── SignupPage
│   │   └── LoginPage
│   └── ProtectedRoutes (requireAuth middleware)
│       ├── ParentRoutes (requireRole: Parent)
│       │   ├── ParentDashboard
│       │   ├── BookTrialPage (Multi-step form)
│       │   └── BookingsPage
│       ├── MentorRoutes (requireRole: Mentor)
│       │   └── MentorDashboard
│       └── AdminRoutes (requireRole: Admin)
│           ├── AdminDashboard
│           ├── BookingsManagement
│           ├── MentorsManagement
│           └── ParentsManagement
```

**State Management:**
- **Authentication:** Context API with AuthProvider wrapping the app
- **API Client:** Axios instance with interceptors for auth headers
- **Form State:** React Hook Form for complex multi-step booking form
- **UI State:** Local component state with useState for simple interactions
- **Server State:** React Query (optional enhancement) or manual loading states

**Key Custom Hooks:**
- `useAuth()` - Access authentication state and methods
- `useTimezone()` - Get user's detected timezone
- `useBookingForm()` - Manage multi-step booking flow state
- `useAvailability()` - Fetch and manage available slots

### Backend Architecture

**Layered Architecture:**
```
Request → Route Handler → Service Layer → Prisma Client → Database
                ↓             ↓
            Middleware    Business Logic
```

**Service Layer Design:**
Each service is a singleton class with focused responsibilities:
- **AuthenticationService:** User authentication and password management
- **BookingService:** Booking creation, cancellation, validation
- **AvailabilityService:** Slot generation and availability queries
- **TimezoneService:** UTC conversion and DST handling
- **MentorMatchingService:** Deterministic mentor assignment
- **NotificationService:** Notification record creation

**Middleware Stack:**
```typescript
app.use(helmet())                    // Security headers
app.use(cors(corsOptions))           // CORS configuration
app.use(express.json())              // Body parsing
app.use(rateLimiter)                 // Rate limiting on /api/auth/*
app.use('/api/*', requireAuth)       // Authentication check
app.use('/api/parent/*', requireRole('Parent'))
app.use('/api/mentor/*', requireRole('Mentor'))
app.use('/api/admin/*', requireRole('Admin'))
```

**Error Handling:**
Centralized error handling middleware catches all errors and returns consistent JSON responses:
```typescript
{
  error: string,
  message: string,
  statusCode: number
}
```

### API Architecture

**RESTful Endpoint Design:**

All endpoints follow REST conventions with consistent response formats.

**Authentication Endpoints:**
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/logout` - Invalidate session
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

**Resource Endpoints:**
- `GET /api/courses` - List all courses
- `GET /api/mentors` - List active mentors with filters
- `GET /api/mentors/:id` - Get mentor details

**Availability Endpoints:**
- `GET /api/availability/slots?mentorId=X&date=Y&timezone=Z&subject=S` - Get available slots

**Booking Endpoints:**
- `POST /api/bookings` - Create new booking
- `GET /api/bookings` - List user's bookings (filtered by role)
- `GET /api/bookings/:id` - Get booking details
- `PATCH /api/bookings/:id/cancel` - Cancel booking

**Dashboard Endpoints:**
- `GET /api/mentor/dashboard` - Mentor's assigned classes
- `GET /api/admin/dashboard` - Admin analytics
- `GET /api/admin/bookings` - All bookings with filters
- `GET /api/admin/mentors` - All mentors with capacity info
- `GET /api/admin/parents` - All parents with booking history

**Response Format Standards:**
```typescript
// Success response
{
  success: true,
  data: T,
  message?: string
}

// Error response
{
  success: false,
  error: string,
  message: string,
  statusCode: number
}

// Paginated response
{
  success: true,
  data: T[],
  pagination: {
    total: number,
    page: number,
    pageSize: number,
    totalPages: number
  }
}
```

## Components and Interfaces

### Core Services

#### AuthenticationService

**Purpose:** Manages user authentication, registration, and password operations.

**Methods:**
```typescript
class AuthenticationService {
  async signup(
    email: string,
    password: string,
    role: UserRole,
    timezone: string,
    profileData: ParentProfileInput | MentorProfileInput
  ): Promise<{ user: User, token: string }>
  
  async login(email: string, password: string): Promise<{ user: User, token: string }>
  
  async logout(userId: string): Promise<void>
  
  async requestPasswordReset(email: string): Promise<void>
  
  async resetPassword(token: string, newPassword: string): Promise<void>
  
  async validateToken(token: string): Promise<User>
  
  private hashPassword(password: string): Promise<string>
  
  private comparePassword(password: string, hash: string): Promise<boolean>
  
  private generateToken(userId: string): string
  
  private generateResetToken(): string
}
```

**Key Implementation Details:**
- Uses bcrypt with 10 salt rounds for password hashing
- JWT tokens with 7-day expiration for session management
- Password reset tokens expire after 1 hour
- Stores reset tokens in database with expiration timestamp

#### BookingService

**Purpose:** Manages booking creation, validation, and cancellation with transaction safety.

**Methods:**
```typescript
class BookingService {
  async createBooking(bookingData: CreateBookingInput): Promise<Booking>
  
  async cancelBooking(bookingId: string, userId: string, userRole: UserRole): Promise<Booking>
  
  async getBookingById(bookingId: string, userId: string, userRole: UserRole): Promise<Booking>
  
  async listBookings(userId: string, userRole: UserRole, filters?: BookingFilters): Promise<Booking[]>
  
  async validateBookingSlot(mentorId: string, startTimeUtc: Date, endTimeUtc: Date): Promise<boolean>
  
  async checkDailyCapacity(mentorId: string, localDate: string, mentorTimezone: string): Promise<number>
  
  private async acquireBookingLock(mentorId: string, startTimeUtc: Date): Promise<void>
  
  private async releaseLock(): Promise<void>
}
```

**Critical Business Logic:**

**Daily Capacity Calculation:**
```typescript
// Calculate mentor's local calendar day boundaries
const mentorLocalDate = DateTime.fromISO(requestedDate, { zone: mentorTimezone });
const dayStart = mentorLocalDate.startOf('day').toUTC().toJSDate();
const dayEnd = mentorLocalDate.endOf('day').toUTC().toJSDate();

// Count existing bookings for this mentor on this day
const bookingCount = await prisma.booking.count({
  where: {
    mentorId: mentorId,
    startTimeUtc: { gte: dayStart, lte: dayEnd },
    status: 'CONFIRMED'
  }
});

if (bookingCount >= MAX_DAILY_TRIALS) {
  throw new Error('Mentor has reached daily capacity');
}
```

**Double-Booking Prevention:**
```typescript
// Use Prisma transaction with serializable isolation level
await prisma.$transaction(async (tx) => {
  // 1. Lock mentor row to prevent concurrent modifications
  await tx.mentor.findUnique({
    where: { id: mentorId },
    select: { id: true }
  });
  
  // 2. Final availability check
  const overlappingBooking = await tx.booking.findFirst({
    where: {
      mentorId: mentorId,
      status: 'CONFIRMED',
      OR: [
        {
          startTimeUtc: { lt: endTimeUtc },
          endTimeUtc: { gt: startTimeUtc }
        }
      ]
    }
  });
  
  if (overlappingBooking) {
    throw new Error('Time slot no longer available');
  }
  
  // 3. Create booking
  const booking = await tx.booking.create({
    data: {
      parentId,
      mentorId,
      courseId,
      childName,
      childAge,
      childGrade,
      startTimeUtc,
      endTimeUtc,
      parentTimezone,
      mentorTimezone,
      status: 'CONFIRMED',
      meetingUrl: generateMeetingUrl()
    }
  });
  
  return booking;
}, {
  isolationLevel: 'Serializable'
});
```

#### AvailabilityService

**Purpose:** Generates available time slots based on mentor schedules, existing bookings, and business rules.

**Methods:**
```typescript
class AvailabilityService {
  async getAvailableSlots(
    date: string,
    subjectId: string,
    parentTimezone: string
  ): Promise<AvailableSlot[]>
  
  async getMentorAvailableSlots(
    mentorId: string,
    date: string,
    timezone: string
  ): Promise<TimeSlot[]>
  
  private async generateSlotsForMentor(
    mentor: Mentor,
    date: string,
    mentorTimezone: string
  ): Promise<TimeSlot[]>
  
  private async filterByExistingBookings(
    slots: TimeSlot[],
    mentorId: string
  ): Promise<TimeSlot[]>
  
  private async filterByDailyCapacity(
    slots: TimeSlot[],
    mentorId: string,
    mentorTimezone: string
  ): Promise<TimeSlot[]>
  
  private applyMinimumNotice(slots: TimeSlot[]): TimeSlot[]
}
```

**Slot Generation Algorithm:**
```typescript
// 1. Get mentor's availability for the requested day of week
const dayOfWeek = DateTime.fromISO(date, { zone: mentorTimezone }).weekday;
const availability = mentor.availability.find(a => a.dayOfWeek === dayOfWeek);

if (!availability) return []; // Mentor not available on this day

// 2. Generate 30-minute slots within working hours
const slots: TimeSlot[] = [];
let current = DateTime.fromISO(`${date}T${availability.startTime}`, { zone: mentorTimezone });
const end = DateTime.fromISO(`${date}T${availability.endTime}`, { zone: mentorTimezone });

while (current.plus({ minutes: CLASS_DURATION_MINUTES }) <= end) {
  slots.push({
    startTimeUtc: current.toUTC().toISO(),
    endTimeUtc: current.plus({ minutes: CLASS_DURATION_MINUTES }).toUTC().toISO(),
    startTimeLocal: current.toISO(),
    endTimeLocal: current.plus({ minutes: CLASS_DURATION_MINUTES }).toISO()
  });
  
  current = current.plus({ minutes: SLOT_INTERVAL_MINUTES }); // 30-min intervals
}

// 3. Filter out slots with existing bookings
const existingBookings = await prisma.booking.findMany({
  where: {
    mentorId: mentor.id,
    status: 'CONFIRMED',
    startTimeUtc: { gte: dayStart, lte: dayEnd }
  }
});

const availableSlots = slots.filter(slot => {
  return !existingBookings.some(booking => 
    (slot.startTimeUtc < booking.endTimeUtc && slot.endTimeUtc > booking.startTimeUtc)
  );
});

// 4. Check daily capacity
const dailyBookingCount = existingBookings.length;
if (dailyBookingCount >= MAX_DAILY_TRIALS) {
  return []; // No slots available - mentor at capacity
}

// 5. Apply 2-hour minimum notice
const now = DateTime.now();
const filteredSlots = availableSlots.filter(slot => {
  const slotStart = DateTime.fromISO(slot.startTimeUtc);
  return slotStart.diff(now, 'hours').hours >= MIN_BOOKING_NOTICE_HOURS;
});

return filteredSlots;
```

#### TimezoneService

**Purpose:** Handles all timezone conversions and DST calculations using IANA identifiers.

**Methods:**
```typescript
class TimezoneService {
  convertToUTC(localTime: string, timezone: string): Date
  
  convertFromUTC(utcTime: Date, timezone: string): string
  
  formatInTimezone(utcTime: Date, timezone: string, format: string): string
  
  getLocalDayBoundaries(date: string, timezone: string): { start: Date, end: Date }
  
  validateTimezone(timezone: string): boolean
  
  isDSTActive(date: Date, timezone: string): boolean
  
  getDSTTransitionDates(year: number, timezone: string): { spring: Date, fall: Date }
}
```

**Implementation with Luxon:**
```typescript
convertToUTC(localTime: string, timezone: string): Date {
  // localTime format: "2024-03-15T10:30:00"
  const dt = DateTime.fromISO(localTime, { zone: timezone });
  
  if (!dt.isValid) {
    throw new Error(`Invalid datetime: ${localTime} in timezone ${timezone}`);
  }
  
  return dt.toUTC().toJSDate();
}

convertFromUTC(utcTime: Date, timezone: string): string {
  const dt = DateTime.fromJSDate(utcTime, { zone: 'utc' });
  return dt.setZone(timezone).toISO();
}

getLocalDayBoundaries(date: string, timezone: string): { start: Date, end: Date } {
  // date format: "2024-03-15"
  const dt = DateTime.fromISO(date, { zone: timezone });
  
  return {
    start: dt.startOf('day').toUTC().toJSDate(),  // 00:00:00 local → UTC
    end: dt.endOf('day').toUTC().toJSDate()        // 23:59:59 local → UTC
  };
}
```

**DST Edge Case Handling:**
- Spring forward (2:00 AM becomes 3:00 AM): Slots in the "lost hour" are automatically skipped by Luxon
- Fall back (2:00 AM repeats): Luxon uses the first occurrence by default, which is correct for booking purposes
- Midnight crossings: Day boundaries are calculated in local time then converted to UTC

#### MentorMatchingService

**Purpose:** Implements deterministic mentor assignment based on availability and capacity.

**Methods:**
```typescript
class MentorMatchingService {
  async findAvailableMentor(
    subjectId: string,
    startTimeUtc: Date,
    endTimeUtc: Date,
    parentTimezone: string
  ): Promise<Mentor | null>
  
  private calculateMentorScore(
    mentor: Mentor,
    subjectId: string,
    requestedTime: Date
  ): number
  
  private async getMentorCapacityStatus(
    mentorId: string,
    localDate: string,
    mentorTimezone: string
  ): Promise<{ current: number, max: number }>
}
```

**Matching Algorithm:**
```typescript
async findAvailableMentor(
  subjectId: string,
  startTimeUtc: Date,
  endTimeUtc: Date,
  parentTimezone: string
): Promise<Mentor | null> {
  // 1. Get all mentors who teach this subject
  const mentors = await prisma.mentor.findMany({
    where: {
      active: true,
      subjects: {
        some: { id: subjectId }
      }
    },
    include: {
      availability: true,
      bookings: {
        where: {
          status: 'CONFIRMED',
          startTimeUtc: { lte: endTimeUtc },
          endTimeUtc: { gte: startTimeUtc }
        }
      }
    }
  });
  
  // 2. Filter mentors with no overlapping bookings
  const availableMentors = mentors.filter(m => m.bookings.length === 0);
  
  // 3. Filter by daily capacity
  const mentorsWithCapacity = [];
  for (const mentor of availableMentors) {
    const localDate = DateTime.fromJSDate(startTimeUtc, { zone: mentor.timezone }).toISODate();
    const capacity = await this.getMentorCapacityStatus(mentor.id, localDate, mentor.timezone);
    
    if (capacity.current < capacity.max) {
      mentorsWithCapacity.push(mentor);
    }
  }
  
  if (mentorsWithCapacity.length === 0) {
    return null; // No mentors available
  }
  
  // 4. Deterministic selection: sort by ID and return first
  // (Could be enhanced with load balancing, mentor preferences, etc.)
  return mentorsWithCapacity.sort((a, b) => a.id.localeCompare(b.id))[0];
}
```

#### NotificationService

**Purpose:** Creates notification records for users (no actual email/SMS sending in MVP).

**Methods:**
```typescript
class NotificationService {
  async createNotification(
    userId: string,
    type: NotificationType,
    message: string,
    metadata?: Record<string, any>
  ): Promise<Notification>
  
  async getUnreadNotifications(userId: string): Promise<Notification[]>
  
  async markAsRead(notificationId: string): Promise<void>
}
```

**Notification Types:**
- `BOOKING_CONFIRMED` - Sent to parent and mentor when booking is created
- `BOOKING_CANCELLED` - Sent to parent and mentor when booking is cancelled
- `BOOKING_REMINDER` - Sent 24 hours before class (future enhancement)
- `PASSWORD_RESET` - Sent when password reset is requested

## Data Models

### Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  PARENT
  MENTOR
  ADMIN
}

enum BookingStatus {
  CONFIRMED
  CANCELLED
  COMPLETED
}

enum NotificationType {
  BOOKING_CONFIRMED
  BOOKING_CANCELLED
  BOOKING_REMINDER
  PASSWORD_RESET
}

model User {
  id                String          @id @default(uuid())
  email             String          @unique
  passwordHash      String
  role              UserRole
  timezone          String          // IANA timezone identifier
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  
  // Password reset
  resetToken        String?
  resetTokenExpiry  DateTime?
  
  // Relations
  parentProfile     ParentProfile?
  mentorProfile     MentorProfile?
  notifications     Notification[]
  
  @@index([email])
}

model ParentProfile {
  id                String    @id @default(uuid())
  userId            String    @unique
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  firstName         String
  lastName          String
  phoneNumber       String?
  
  // Relations
  bookings          Booking[]
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}

model MentorProfile {
  id                String              @id @default(uuid())
  userId            String              @unique
  user              User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  firstName         String
  lastName          String
  bio               String?
  photoUrl          String?
  active            Boolean             @default(true)
  
  // Relations
  availability      MentorAvailability[]
  bookings          Booking[]
  mentorCourses     MentorCourse[]
  
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  @@index([active])
}

model Course {
  id                String          @id @default(uuid())
  name              String          @unique
  description       String?
  durationMinutes   Int             @default(45)
  
  // Relations
  mentorCourses     MentorCourse[]
  bookings          Booking[]
  
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
}

model MentorCourse {
  id                String        @id @default(uuid())
  mentorId          String
  mentor            MentorProfile @relation(fields: [mentorId], references: [id], onDelete: Cascade)
  courseId          String
  course            Course        @relation(fields: [courseId], references: [id], onDelete: Cascade)
  
  createdAt         DateTime      @default(now())
  
  @@unique([mentorId, courseId])
  @@index([mentorId])
  @@index([courseId])
}

model MentorAvailability {
  id                String        @id @default(uuid())
  mentorId          String
  mentor            MentorProfile @relation(fields: [mentorId], references: [id], onDelete: Cascade)
  
  dayOfWeek         Int           // 1 = Monday, 7 = Sunday
  startTime         String        // Format: "09:00"
  endTime           String        // Format: "17:00"
  timezone          String        // IANA timezone identifier
  
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  
  @@index([mentorId, dayOfWeek])
}

model Booking {
  id                String        @id @default(uuid())
  
  // Participants
  parentId          String
  parent            ParentProfile @relation(fields: [parentId], references: [id], onDelete: Restrict)
  mentorId          String
  mentor            MentorProfile @relation(fields: [mentorId], references: [id], onDelete: Restrict)
  courseId          String
  course            Course        @relation(fields: [courseId], references: [id], onDelete: Restrict)
  
  // Child information
  childName         String
  childAge          Int
  childGrade        String
  
  // Timing (stored in UTC)
  startTimeUtc      DateTime
  endTimeUtc        DateTime
  
  // Timezone information for display
  parentTimezone    String        // IANA timezone
  mentorTimezone    String        // IANA timezone
  
  // Booking details
  status            BookingStatus @default(CONFIRMED)
  meetingUrl        String
  
  // Metadata
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  cancelledAt       DateTime?
  
  @@index([parentId])
  @@index([mentorId])
  @@index([startTimeUtc])
  @@index([status])
  @@index([mentorId, startTimeUtc, status]) // Composite for capacity queries
}

model Notification {
  id                String            @id @default(uuid())
  userId            String
  user              User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type              NotificationType
  message           String
  metadata          Json?             // Flexible field for additional data
  
  read              Boolean           @default(false)
  createdAt         DateTime          @default(now())
  
  @@index([userId, read])
}
```

### Database Indexes Strategy

**Performance-Critical Queries:**

1. **Finding available mentors:** Need fast lookup by subject, active status, and time range
   - Index: `MentorProfile.active`
   - Index: `MentorCourse.mentorId, courseId`

2. **Checking booking overlaps:** Need fast range queries on booking times
   - Index: `Booking.mentorId, startTimeUtc, status` (composite)
   - Index: `Booking.startTimeUtc` (standalone for date range queries)

3. **Daily capacity calculation:** Need to count bookings for a mentor on a specific day
   - Index: `Booking.mentorId, startTimeUtc, status` (composite covers this)

4. **User authentication:** Need fast email lookup
   - Index: `User.email` (unique constraint provides this)

5. **Notifications:** Need fast lookup of unread notifications per user
   - Index: `Notification.userId, read` (composite)

### Entity Relationships

```
User (1) ──→ (0..1) ParentProfile
User (1) ──→ (0..1) MentorProfile
User (1) ──→ (0..*) Notification

ParentProfile (1) ──→ (0..*) Booking
MentorProfile (1) ──→ (0..*) Booking
MentorProfile (1) ──→ (0..*) MentorAvailability
MentorProfile (1) ──→ (0..*) MentorCourse

Course (1) ──→ (0..*) MentorCourse
Course (1) ──→ (0..*) Booking

Booking (*) ──→ (1) ParentProfile
Booking (*) ──→ (1) MentorProfile
Booking (*) ──→ (1) Course
```

**Key Constraints:**
- Users must have exactly one profile (Parent OR Mentor OR neither for Admin)
- Bookings cannot be deleted (onDelete: Restrict) to maintain historical records
- Mentors and courses have many-to-many relationship via MentorCourse join table
- All timestamps stored in UTC, timezones stored separately for display


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Before defining properties, I'll perform the prework analysis to assess which acceptance criteria can be tested as properties.


### Property Reflection

After analyzing all acceptance criteria, I've identified the following redundancies:

**Redundancies to consolidate:**
- Properties 1.4 and 1.6 (authorization) → Combine into single authorization property
- Properties 4.2, 4.3, 4.4 (double-booking) → All describe the same double-booking prevention, combine into one
- Properties 2.2 and 6.4 (timezone display) → Both about displaying times in user's timezone
- Properties 6.7, 6.8, 7.2 (booking creation response) → All about successful booking response format
- Properties 7.3 and 2.6 (timezone display in confirmation) → Duplicate
- Properties 3.5 and 8.3 (capacity display) → Same requirement from different views
- Properties 11.2 and 3.4 (capacity release on cancellation) → Duplicate
- Properties 9.1 and 9.5 (admin filtering) → Same property
- Properties 10.3 and 10.6 (booking details display) → Similar, can combine

**Final consolidated properties to implement:** 25 unique properties covering all critical functionality.

### Property 1: Password Hashing Security
*For any* user account created through signup, the stored password SHALL be hashed using bcrypt (not stored in plaintext) and SHALL successfully verify against the original password.

**Validates: Requirements 1.1, 1.2**

### Property 2: Session Invalidation on Logout
*For any* authenticated user session, after logout the session token SHALL no longer grant access to protected endpoints.

**Validates: Requirements 1.3**

### Property 3: Role-Based Authorization
*For any* protected API endpoint and any unauthorized user role, the request SHALL return HTTP 401 or 403 status code.

**Validates: Requirements 1.4, 1.6, 8.6, 10.5**

### Property 4: Password Reset Token Expiration
*For any* password reset request, a secure token SHALL be generated with an expiration timestamp, and expired tokens SHALL be rejected.

**Validates: Requirements 1.5**

### Property 5: UTC Storage Invariant
*For any* booking created in any timezone, the stored startTimeUtc and endTimeUtc values SHALL be valid UTC timestamps.

**Validates: Requirements 2.1**

### Property 6: Timezone Conversion Accuracy
*For any* UTC timestamp and any valid IANA timezone, converting to the local timezone and back to UTC SHALL preserve the original timestamp (round-trip identity).

**Validates: Requirements 2.2, 2.4, 6.4**

### Property 7: DST Transition Handling
*For any* date that includes a DST transition (spring forward or fall back) in a specific timezone, timezone conversions SHALL produce correct local times without manual offset adjustments.

**Validates: Requirements 2.3**

### Property 8: Dual Timezone Display
*For any* booking confirmation, the response SHALL include both parent local time and mentor local time representations.

**Validates: Requirements 2.6, 7.3**

### Property 9: Daily Capacity Limit Enforcement
*For any* mentor and any local calendar day in that mentor's timezone, the number of CONFIRMED bookings SHALL NOT exceed 2.

**Validates: Requirements 3.1**

### Property 10: Timezone-Based Daily Calculation
*For any* booking that occurs before midnight UTC but after midnight in the mentor's local timezone (or vice versa), the daily capacity count SHALL be based on the mentor's local calendar day, not UTC day.

**Validates: Requirements 3.2**

### Property 11: Capacity-Based Slot Exclusion
*For any* mentor with 2 CONFIRMED bookings on a local calendar day, the available slots for that day SHALL be empty.

**Validates: Requirements 3.3**

### Property 12: Cancellation Releases Capacity
*For any* booking that is cancelled, if the mentor previously had 2 bookings on that local calendar day, available slots SHALL become available for that day immediately after cancellation.

**Validates: Requirements 3.4, 11.2**

### Property 13: Capacity Display Accuracy
*For any* mentor's dashboard view, the displayed booking count (X/2) SHALL match the actual number of CONFIRMED bookings for each local calendar day.

**Validates: Requirements 3.5, 8.3, 9.2**

### Property 14: Double-Booking Prevention
*For any* two concurrent booking attempts for the same mentor with overlapping time ranges, at most one booking SHALL succeed and be saved to the database.

**Validates: Requirements 4.2, 4.3, 4.4**

### Property 15: Slot Interval Consistency
*For any* mentor's available slots generated for a given day, consecutive slot start times SHALL be exactly 30 minutes apart.

**Validates: Requirements 5.2**

### Property 16: Fixed Class Duration
*For any* booking, the duration (endTimeUtc - startTimeUtc) SHALL equal exactly 45 minutes.

**Validates: Requirements 5.3**

### Property 17: Availability Timezone Storage
*For any* mentor availability record, it SHALL include a valid IANA timezone identifier.

**Validates: Requirements 5.4**

### Property 18: Booked Slot Exclusion
*For any* mentor with existing CONFIRMED bookings, those exact time slots SHALL NOT appear in the list of available slots for that mentor.

**Validates: Requirements 5.5**

### Property 19: Minimum Booking Notice
*For any* available slot generated, the slot start time SHALL be at least 2 hours after the current time.

**Validates: Requirements 5.6**

### Property 20: Subject-Based Mentor Filtering
*For any* availability query filtered by subject, all returned slots SHALL only include mentors who teach that subject.

**Validates: Requirements 5.7**

### Property 21: Required Child Details Validation
*For any* booking creation attempt without required child details (name, age, grade), the request SHALL be rejected with a validation error.

**Validates: Requirements 6.1**

### Property 22: Deterministic Mentor Matching
*For any* identical set of inputs to the mentor matching algorithm (subject, time, date), the same mentor SHALL be selected across multiple invocations.

**Validates: Requirements 6.5**

### Property 23: No Available Mentor Error
*For any* date and time where all mentors teaching the requested subject are either booked, at capacity, or unavailable, the availability query SHALL return an error indicating no mentors are available.

**Validates: Requirements 6.6**

### Property 24: Booking Creation Response Completeness
*For any* successfully created booking, the response SHALL include a unique booking ID, a meeting URL, child details, and times in both parent and mentor timezones.

**Validates: Requirements 6.7, 6.8, 7.1, 7.2**

### Property 25: Notification Creation on Booking
*For any* successfully created booking, exactly one notification record SHALL be created for the parent and exactly one notification record SHALL be created for the assigned mentor.

**Validates: Requirements 7.4, 7.5**

### Property 26: Mentor Data Isolation
*For any* logged-in mentor, querying bookings SHALL return only their own assigned bookings, never bookings assigned to other mentors.

**Validates: Requirements 8.1, 8.6**

### Property 27: Booking Time Display in Mentor Timezone
*For any* booking displayed to a mentor, the time SHALL be shown in the mentor's configured timezone.

**Validates: Requirements 8.4**

### Property 28: Admin Filter Accuracy
*For any* admin booking query with filters applied (date, mentor, subject, status), all returned results SHALL match every specified filter criterion.

**Validates: Requirements 9.1, 9.5**

### Property 29: Admin Analytics Calculation
*For any* set of bookings in the system, admin analytics metrics (total bookings, active mentors, mentors at capacity) SHALL be calculated correctly based on actual database state.

**Validates: Requirements 9.3**

### Property 30: Parent Booking Categorization
*For any* parent's booking history, bookings SHALL be correctly categorized as Upcoming (status=CONFIRMED, time>now), Past (time<now), or Cancelled (status=CANCELLED).

**Validates: Requirements 10.2**

### Property 31: Parent Data Isolation
*For any* logged-in parent, querying bookings SHALL return only their own bookings, never bookings created by other parents.

**Validates: Requirements 10.5**

### Property 32: Cancellation Status Update
*For any* booking cancellation request, the booking status SHALL be updated to CANCELLED and the cancelledAt timestamp SHALL be set.

**Validates: Requirements 11.1**

### Property 33: Parent Cancellation Time Restriction
*For any* booking cancellation attempt by a parent after the class start time, the request SHALL be rejected; attempts before start time SHALL succeed.

**Validates: Requirements 11.3**

### Property 34: Admin Unrestricted Cancellation
*For any* booking, an admin user SHALL be able to cancel it regardless of the current time or booking status.

**Validates: Requirements 11.4**

### Property 35: Cancellation Notification Creation
*For any* cancelled booking, exactly one notification SHALL be created for the parent and exactly one notification SHALL be created for the mentor indicating the cancellation.

**Validates: Requirements 11.5**

### Property 36: Input Validation Rejection
*For any* API endpoint receiving invalid input data (wrong types, missing required fields, invalid formats), the request SHALL be rejected with a 400 status code and validation error details.

**Validates: Requirements 12.4**

### Property 37: Error Message Security
*For any* error response returned by the API, the error message SHALL NOT contain sensitive information such as passwords, tokens, database structure details, or internal system paths.

**Validates: Requirements 12.5**


## Error Handling

### Error Response Format

All API errors follow a consistent JSON structure:

```typescript
interface ErrorResponse {
  success: false;
  error: string;           // Error type (e.g., "ValidationError", "AuthenticationError")
  message: string;         // User-friendly error message
  statusCode: number;      // HTTP status code
  details?: any;          // Optional additional error context (validation errors, etc.)
}
```

### Error Categories

**1. Validation Errors (400 Bad Request)**
- Invalid input format
- Missing required fields
- Invalid timezone identifiers
- Invalid date/time values
- Child age/grade out of range

Example:
```json
{
  "success": false,
  "error": "ValidationError",
  "message": "Invalid input data",
  "statusCode": 400,
  "details": {
    "childAge": "Must be between 4 and 18",
    "timezone": "Invalid IANA timezone identifier"
  }
}
```

**2. Authentication Errors (401 Unauthorized)**
- Invalid credentials
- Missing authentication token
- Expired session token
- Invalid password reset token

Example:
```json
{
  "success": false,
  "error": "AuthenticationError",
  "message": "Invalid credentials",
  "statusCode": 401
}
```

**3. Authorization Errors (403 Forbidden)**
- Insufficient permissions for requested action
- Attempting to access another user's data
- Role-based access denial

Example:
```json
{
  "success": false,
  "error": "AuthorizationError",
  "message": "You do not have permission to access this resource",
  "statusCode": 403
}
```

**4. Resource Not Found (404 Not Found)**
- Booking ID doesn't exist
- Mentor ID doesn't exist
- User not found

Example:
```json
{
  "success": false,
  "error": "NotFoundError",
  "message": "Booking not found",
  "statusCode": 404
}
```

**5. Business Logic Errors (409 Conflict)**
- Mentor at daily capacity
- Time slot no longer available (double-booking attempt)
- Booking cancellation after start time
- No mentors available for requested time

Example:
```json
{
  "success": false,
  "error": "BookingConflictError",
  "message": "This mentor has reached their daily capacity of 2 trial classes",
  "statusCode": 409,
  "details": {
    "mentorId": "uuid",
    "currentCapacity": 2,
    "maxCapacity": 2,
    "localDate": "2024-03-15"
  }
}
```

**6. Rate Limiting (429 Too Many Requests)**
- Too many login attempts
- Too many password reset requests
- General API rate limit exceeded

Example:
```json
{
  "success": false,
  "error": "RateLimitError",
  "message": "Too many requests. Please try again in 15 minutes",
  "statusCode": 429,
  "details": {
    "retryAfter": 900
  }
}
```

**7. Server Errors (500 Internal Server Error)**
- Database connection failures
- Unexpected exceptions
- External service failures

Example:
```json
{
  "success": false,
  "error": "InternalServerError",
  "message": "An unexpected error occurred. Please try again later",
  "statusCode": 500
}
```

### Error Handling Middleware

Centralized error handler catches all errors and formats responses:

```typescript
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log error for debugging (never expose in response)
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id
  });
  
  // Determine error type and status code
  let statusCode = 500;
  let errorType = 'InternalServerError';
  let message = 'An unexpected error occurred';
  let details = undefined;
  
  if (err instanceof ValidationError) {
    statusCode = 400;
    errorType = 'ValidationError';
    message = err.message;
    details = err.details;
  } else if (err instanceof AuthenticationError) {
    statusCode = 401;
    errorType = 'AuthenticationError';
    message = err.message;
  } else if (err instanceof AuthorizationError) {
    statusCode = 403;
    errorType = 'AuthorizationError';
    message = err.message;
  } else if (err instanceof NotFoundError) {
    statusCode = 404;
    errorType = 'NotFoundError';
    message = err.message;
  } else if (err instanceof BusinessLogicError) {
    statusCode = 409;
    errorType = err.type;
    message = err.message;
    details = err.details;
  }
  
  // Never expose sensitive information
  const sanitizedMessage = sanitizeErrorMessage(message);
  
  res.status(statusCode).json({
    success: false,
    error: errorType,
    message: sanitizedMessage,
    statusCode,
    ...(details && { details })
  });
});
```

### Frontend Error Handling

**Toast Notifications:**
- Display error messages using toast library (react-hot-toast or similar)
- Auto-dismiss after 5 seconds for non-critical errors
- Require manual dismiss for critical errors (booking failures)

**Error Boundaries:**
- React Error Boundary wrapping main app
- Graceful degradation on component errors
- "Something went wrong" fallback UI

**Retry Logic:**
- Automatic retry for network failures (3 attempts with exponential backoff)
- Manual retry button for failed operations
- Clear indication when retries are exhausted

**User-Friendly Messages:**
- Technical errors translated to plain language
- Actionable guidance when possible ("Try selecting a different time")
- Contact support for unrecoverable errors

## Testing Strategy

### Overview

The testing strategy follows a pyramid approach with comprehensive coverage at all levels:

1. **Unit Tests** - Test individual functions and services in isolation
2. **Integration Tests** - Test API endpoints and service interactions
3. **Property-Based Tests** - Verify correctness properties across many inputs
4. **End-to-End Tests** - Test critical user flows (optional for MVP)

### Unit Tests

**Technology:** Vitest with mocking support

**Coverage Areas:**

1. **TimezoneService Tests**
```typescript
describe('TimezoneService', () => {
  describe('convertToUTC', () => {
    it('should convert New York time to UTC', () => {
      const localTime = '2024-03-15T14:30:00';
      const timezone = 'America/New_York';
      const utc = timezoneService.convertToUTC(localTime, timezone);
      expect(utc.toISOString()).toBe('2024-03-15T18:30:00.000Z');
    });
    
    it('should handle DST spring forward', () => {
      // March 10, 2024, 2:30 AM doesn't exist (DST spring forward at 2 AM)
      const localTime = '2024-03-10T02:30:00';
      const timezone = 'America/New_York';
      const utc = timezoneService.convertToUTC(localTime, timezone);
      // Luxon should adjust to 3:30 AM EDT
      expect(utc.toISOString()).toBe('2024-03-10T07:30:00.000Z');
    });
    
    it('should handle DST fall back', () => {
      // November 3, 2024, 1:30 AM occurs twice
      const localTime = '2024-11-03T01:30:00';
      const timezone = 'America/New_York';
      const utc = timezoneService.convertToUTC(localTime, timezone);
      // First occurrence (before falling back)
      expect(utc.toISOString()).toBe('2024-11-03T05:30:00.000Z');
    });
  });
  
  describe('getLocalDayBoundaries', () => {
    it('should return UTC boundaries for local calendar day', () => {
      const date = '2024-03-15';
      const timezone = 'America/New_York';
      const { start, end } = timezoneService.getLocalDayBoundaries(date, timezone);
      
      // March 15, 2024 00:00 EDT = March 15, 2024 04:00 UTC
      expect(start.toISOString()).toBe('2024-03-15T04:00:00.000Z');
      // March 15, 2024 23:59:59 EDT = March 16, 2024 03:59:59 UTC
      expect(end.toISOString()).toBe('2024-03-16T03:59:59.999Z');
    });
    
    it('should handle midnight crossing for UTC', () => {
      const date = '2024-03-15';
      const timezone = 'Asia/Kolkata'; // UTC+5:30
      const { start, end } = timezoneService.getLocalDayBoundaries(date, timezone);
      
      // March 15, 2024 00:00 IST = March 14, 2024 18:30 UTC
      expect(start.toISOString()).toBe('2024-03-14T18:30:00.000Z');
    });
  });
});
```

2. **AvailabilityService Tests**
```typescript
describe('AvailabilityService', () => {
  describe('generateSlotsForMentor', () => {
    it('should generate 30-minute interval slots', () => {
      const mentor = createMockMentor({
        availability: [{
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '11:00',
          timezone: 'America/New_York'
        }]
      });
      
      const slots = availabilityService.generateSlotsForMentor(
        mentor,
        '2024-03-18', // Monday
        'America/New_York'
      );
      
      // 9:00-9:45, 9:30-10:15, 10:00-10:45, 10:30-11:15
      // But 10:30-11:15 exceeds end time, so only 3 slots
      expect(slots).toHaveLength(3);
      expect(slots[0].startTimeLocal).toBe('2024-03-18T09:00:00-04:00');
      expect(slots[1].startTimeLocal).toBe('2024-03-18T09:30:00-04:00');
      expect(slots[2].startTimeLocal).toBe('2024-03-18T10:00:00-04:00');
    });
    
    it('should exclude slots less than 2 hours from now', () => {
      // Mock current time
      vi.setSystemTime(new Date('2024-03-18T10:00:00-04:00'));
      
      const slots = availabilityService.generateSlotsForMentor(
        mentor,
        '2024-03-18',
        'America/New_York'
      );
      
      // Slots before 12:00 (10:00 + 2 hours) should be filtered out
      expect(slots.every(slot => {
        const slotTime = DateTime.fromISO(slot.startTimeLocal);
        return slotTime.hour >= 12;
      })).toBe(true);
    });
  });
});
```

3. **BookingService Tests**
```typescript
describe('BookingService', () => {
  describe('checkDailyCapacity', () => {
    it('should count bookings in mentor local day, not UTC day', async () => {
      // Create bookings: one at 11 PM mentor local, one at 1 AM next day mentor local
      // These might be same UTC day but different mentor local days
      
      const mentorTimezone = 'America/New_York';
      const booking1 = await createBooking({
        mentorId: 'mentor-1',
        startTimeUtc: new Date('2024-03-15T03:00:00Z'), // 11 PM March 14 EDT
        mentorTimezone
      });
      
      const booking2 = await createBooking({
        mentorId: 'mentor-1',
        startTimeUtc: new Date('2024-03-15T05:00:00Z'), // 1 AM March 15 EDT
        mentorTimezone
      });
      
      // Check capacity for March 14 (should be 1)
      const capacity14 = await bookingService.checkDailyCapacity(
        'mentor-1',
        '2024-03-14',
        mentorTimezone
      );
      expect(capacity14).toBe(1);
      
      // Check capacity for March 15 (should be 1)
      const capacity15 = await bookingService.checkDailyCapacity(
        'mentor-1',
        '2024-03-15',
        mentorTimezone
      );
      expect(capacity15).toBe(1);
    });
  });
});
```

### Integration Tests

**Technology:** Supertest + Vitest

**Coverage Areas:**

1. **Complete Booking Flow**
```typescript
describe('POST /api/bookings', () => {
  it('should create first booking successfully', async () => {
    const response = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        mentorId: 'mentor-1',
        courseId: 'course-1',
        startTimeUtc: '2024-03-20T14:00:00Z',
        childName: 'Alice Johnson',
        childAge: 10,
        childGrade: '5th',
        parentTimezone: 'America/New_York',
        mentorTimezone: 'America/Los_Angeles'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data).toHaveProperty('meetingUrl');
    expect(response.body.data.status).toBe('CONFIRMED');
  });
  
  it('should create second booking successfully (within capacity)', async () => {
    // Create first booking
    await createBooking({ mentorId: 'mentor-1', localDate: '2024-03-20' });
    
    // Second booking should succeed
    const response = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        mentorId: 'mentor-1',
        // ... different time, same local date
      });
    
    expect(response.status).toBe(201);
  });
  
  it('should reject third booking (exceeds daily capacity)', async () => {
    // Create two bookings
    await createBooking({ mentorId: 'mentor-1', localDate: '2024-03-20' });
    await createBooking({ mentorId: 'mentor-1', localDate: '2024-03-20' });
    
    // Third booking should fail
    const response = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        mentorId: 'mentor-1',
        // ... different time, same local date
      });
    
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('BookingConflictError');
    expect(response.body.message).toContain('daily capacity');
  });
  
  it('should prevent double-booking with concurrent requests', async () => {
    const bookingData = {
      mentorId: 'mentor-1',
      courseId: 'course-1',
      startTimeUtc: '2024-03-20T14:00:00Z',
      // ... other fields
    };
    
    // Make two concurrent requests for the same slot
    const [response1, response2] = await Promise.all([
      request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${parent1Token}`)
        .send(bookingData),
      request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${parent2Token}`)
        .send(bookingData)
    ]);
    
    // Exactly one should succeed
    const successCount = [response1, response2].filter(r => r.status === 201).length;
    const conflictCount = [response1, response2].filter(r => r.status === 409).length;
    
    expect(successCount).toBe(1);
    expect(conflictCount).toBe(1);
  });
});
```

2. **Booking Cancellation**
```typescript
describe('PATCH /api/bookings/:id/cancel', () => {
  it('should release capacity immediately after cancellation', async () => {
    // Book to capacity (2 bookings)
    const booking1 = await createBooking({ mentorId: 'mentor-1' });
    const booking2 = await createBooking({ mentorId: 'mentor-1' });
    
    // Verify no slots available
    let slots = await request(app)
      .get('/api/availability/slots')
      .query({ mentorId: 'mentor-1', date: '2024-03-20' });
    expect(slots.body.data).toHaveLength(0);
    
    // Cancel one booking
    await request(app)
      .patch(`/api/bookings/${booking1.id}/cancel`)
      .set('Authorization', `Bearer ${parentToken}`);
    
    // Verify slots now available
    slots = await request(app)
      .get('/api/availability/slots')
      .query({ mentorId: 'mentor-1', date: '2024-03-20' });
    expect(slots.body.data.length).toBeGreaterThan(0);
  });
});
```

3. **Authorization Tests**
```typescript
describe('Authorization', () => {
  it('should prevent parent from accessing other parent bookings', async () => {
    const parent1Booking = await createBookingForParent('parent-1');
    
    const response = await request(app)
      .get(`/api/bookings/${parent1Booking.id}`)
      .set('Authorization', `Bearer ${parent2Token}`);
    
    expect(response.status).toBe(403);
  });
  
  it('should prevent mentor from accessing other mentor bookings', async () => {
    const mentor1Booking = await createBookingForMentor('mentor-1');
    
    const response = await request(app)
      .get(`/api/bookings/${mentor1Booking.id}`)
      .set('Authorization', `Bearer ${mentor2Token}`);
    
    expect(response.status).toBe(403);
  });
  
  it('should allow admin to access all bookings', async () => {
    const booking = await createBooking();
    
    const response = await request(app)
      .get(`/api/bookings/${booking.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(200);
  });
});
```

4. **No Mentor Available Scenario**
```typescript
describe('GET /api/availability/slots', () => {
  it('should return error when no mentors available', async () => {
    // Book all mentors for this time
    const mentors = await getAllMentorsForSubject('course-1');
    for (const mentor of mentors) {
      await createBooking({
        mentorId: mentor.id,
        startTimeUtc: '2024-03-20T14:00:00Z'
      });
    }
    
    const response = await request(app)
      .get('/api/availability/slots')
      .query({
        subject: 'course-1',
        date: '2024-03-20',
        time: '14:00',
        timezone: 'America/New_York'
      });
    
    expect(response.status).toBe(409);
    expect(response.body.message).toContain('No mentors are available');
  });
});
```

### Property-Based Tests

**Technology:** fast-check (for JavaScript/TypeScript)

**Configuration:** Minimum 100 iterations per property test

**Test Structure:**
```typescript
import fc from 'fast-check';

describe('Property-Based Tests', () => {
  test('Property 6: Timezone conversion round-trip identity', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        fc.constantFrom(
          'America/New_York',
          'America/Los_Angeles',
          'Europe/London',
          'Asia/Kolkata',
          'Australia/Sydney'
        ),
        (utcDate, timezone) => {
          // Feature: codeyoung-trial-booking-platform, Property 6: Timezone Conversion Accuracy
          const localTime = timezoneService.convertFromUTC(utcDate, timezone);
          const roundTrip = timezoneService.convertToUTC(localTime, timezone);
          
          // Times should match within 1 second (allow for rounding)
          const diff = Math.abs(roundTrip.getTime() - utcDate.getTime());
          expect(diff).toBeLessThan(1000);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  test('Property 9: Daily capacity limit enforcement', () => {
    fc.assert(
      fc.property(
        fc.uuid(), // mentorId
        fc.date(), // date
        fc.constantFrom(...TIMEZONES), // mentor timezone
        async (mentorId, date, timezone) => {
          // Feature: codeyoung-trial-booking-platform, Property 9: Daily Capacity Limit Enforcement
          
          // Create mentor with timezone
          await createTestMentor({ id: mentorId, timezone });
          
          // Try to create 3 bookings on same local day
          const localDate = DateTime.fromJSDate(date, { zone: timezone }).toISODate();
          
          const booking1 = await bookingService.createBooking({...});
          const booking2 = await bookingService.createBooking({...});
          
          // Third should fail
          await expect(
            bookingService.createBooking({...})
          ).rejects.toThrow('daily capacity');
          
          // Verify exactly 2 bookings exist
          const count = await bookingService.checkDailyCapacity(
            mentorId,
            localDate,
            timezone
          );
          expect(count).toBe(2);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Property Test Coverage:**
- All 37 correctness properties defined in the design document
- Each property tagged with comment: `// Feature: codeyoung-trial-booking-platform, Property X: <description>`
- Minimum 100 iterations per test
- Random input generation for dates, timezones, user data, booking times

### Test Data Management

**Test Database:**
- Separate PostgreSQL database for testing
- Reset database before each test suite
- Use transactions that rollback after each test

**Fixtures:**
- Reusable test data builders (createTestUser, createTestMentor, createTestBooking)
- Factory functions with sensible defaults and overrides
- Timezone-aware test data generation

**Mocking Strategy:**
- Mock external services (email, meeting URL generation)
- Mock time for deterministic testing (vi.setSystemTime)
- Do NOT mock database or business logic services

### Continuous Integration

**CI Pipeline:**
1. Run linter (ESLint)
2. Run type checker (TypeScript)
3. Run unit tests
4. Run integration tests
5. Run property-based tests
6. Generate coverage report (target: 80%+ coverage)

**Pre-commit Hooks:**
- Format code with Prettier
- Run lint checks
- Run unit tests for changed files


## Security Design

### Authentication Implementation

**Password Security:**
```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

async hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

**Session Management:**
- JWT tokens with 7-day expiration
- Tokens stored in httpOnly cookies (alternative to localStorage for better XSS protection)
- Refresh token mechanism for seamless re-authentication
- Token payload includes: userId, role, timezone

```typescript
import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  role: UserRole;
  timezone: string;
}

function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '7d',
    issuer: 'codeyoung-platform'
  });
}

function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
}
```

**Password Reset Flow:**
1. User requests reset with email
2. Generate cryptographically secure token (32 bytes)
3. Store token hash and expiration (1 hour) in database
4. Send reset link to email (mocked in MVP)
5. User clicks link, submits new password with token
6. Verify token hasn't expired, hash new password, clear reset token
7. Invalidate all existing sessions for that user

```typescript
import crypto from 'crypto';

function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

async requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // Don't reveal if email exists
  
  const resetToken = generateResetToken();
  const resetTokenHash = await bcrypt.hash(resetToken, 10);
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  
  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: resetTokenHash, resetTokenExpiry }
  });
  
  // Send email (mocked in MVP)
  await notificationService.createNotification(
    user.id,
    'PASSWORD_RESET',
    `Reset your password: ${process.env.CLIENT_URL}/reset-password/${resetToken}`
  );
}
```

### Authorization Middleware

**Role-Based Access Control:**
```typescript
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'AuthenticationError',
      message: 'No authentication token provided',
      statusCode: 401
    });
  }
  
  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'AuthenticationError',
      message: 'Invalid or expired token',
      statusCode: 401
    });
  }
}

function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'AuthenticationError',
        message: 'Authentication required',
        statusCode: 401
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'AuthorizationError',
        message: 'Insufficient permissions',
        statusCode: 403
      });
    }
    
    next();
  };
}
```

**Resource-Level Authorization:**
```typescript
async function authorizeBookingAccess(
  bookingId: string,
  userId: string,
  userRole: UserRole
): Promise<boolean> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      parent: { include: { user: true } },
      mentor: { include: { user: true } }
    }
  });
  
  if (!booking) return false;
  
  // Admins can access all bookings
  if (userRole === 'ADMIN') return true;
  
  // Parents can only access their own bookings
  if (userRole === 'PARENT' && booking.parent.userId === userId) return true;
  
  // Mentors can only access their assigned bookings
  if (userRole === 'MENTOR' && booking.mentor.userId === userId) return true;
  
  return false;
}
```

### HTTP Security Headers

**Helmet Configuration:**
```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // For Tailwind
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", process.env.API_URL],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
```

### CORS Configuration

```typescript
import cors from 'cors';

const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

// Auth endpoints: 5 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: 'RateLimitError',
    message: 'Too many authentication attempts. Please try again in 15 minutes',
    statusCode: 429
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// General API: 100 requests per 15 minutes per user
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.user?.userId || req.ip,
  message: {
    success: false,
    error: 'RateLimitError',
    message: 'Too many requests. Please try again later',
    statusCode: 429
  }
});

app.use('/api/', apiLimiter);
```

### Input Validation

**Zod Schema Examples:**
```typescript
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.enum(['PARENT', 'MENTOR']),
  timezone: z.string().refine(
    (tz) => timezoneService.validateTimezone(tz),
    'Invalid IANA timezone identifier'
  ),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phoneNumber: z.string().optional()
});

const createBookingSchema = z.object({
  mentorId: z.string().uuid(),
  courseId: z.string().uuid(),
  childName: z.string().min(1).max(100),
  childAge: z.number().int().min(4).max(18),
  childGrade: z.string().min(1).max(20),
  startTimeUtc: z.string().datetime(),
  parentTimezone: z.string(),
  mentorTimezone: z.string()
}).refine(
  (data) => {
    // Validate that booking is at least 2 hours in future
    const startTime = new Date(data.startTimeUtc);
    const minTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
    return startTime >= minTime;
  },
  'Booking must be at least 2 hours in advance'
);

// Validation middleware
function validateRequest(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'ValidationError',
          message: 'Invalid input data',
          statusCode: 400,
          details: error.errors.reduce((acc, err) => {
            acc[err.path.join('.')] = err.message;
            return acc;
          }, {} as Record<string, string>)
        });
      }
      next(error);
    }
  };
}
```

### Environment Variables

**Required Environment Variables:**
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/codeyoung_dev

# Authentication
JWT_SECRET=<random-64-char-string>
BCRYPT_SALT_ROUNDS=10

# Application
NODE_ENV=development
PORT=3000
CLIENT_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5

# Logging
LOG_LEVEL=info
```

**.env.example:**
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/codeyoung_dev
JWT_SECRET=your-secret-key-here-change-in-production
BCRYPT_SALT_ROUNDS=10
NODE_ENV=development
PORT=3000
CLIENT_URL=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
LOG_LEVEL=info
```

## Configuration Constants

All business rule constants are defined in a single configuration file for easy modification:

```typescript
// server/src/config/constants.ts

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
  MAX_ADVANCE_BOOKING_DAYS: 30
} as const;

export const AUTH_CONFIG = {
  // JWT token expiration
  TOKEN_EXPIRY: '7d',
  
  // Password reset token expiry (in milliseconds)
  RESET_TOKEN_EXPIRY_MS: 60 * 60 * 1000, // 1 hour
  
  // Bcrypt salt rounds
  SALT_ROUNDS: 10
} as const;

export const RATE_LIMIT_CONFIG = {
  // Auth endpoints
  AUTH_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  AUTH_MAX_REQUESTS: 5,
  
  // General API
  API_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  API_MAX_REQUESTS: 100
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
  'Australia/Sydney'
] as const;

export const SUBJECTS = [
  { id: 'coding-basics', name: 'Coding Basics', description: 'Introduction to programming concepts' },
  { id: 'python', name: 'Python Programming', description: 'Learn Python from scratch' },
  { id: 'web-dev', name: 'Web Development', description: 'HTML, CSS, and JavaScript' },
  { id: 'math', name: 'Mathematics', description: 'Math concepts and problem solving' },
  { id: 'science', name: 'Science', description: 'Scientific concepts and experiments' },
  { id: 'robotics', name: 'Robotics', description: 'Build and program robots' }
] as const;
```

Usage in code:
```typescript
import { BOOKING_CONFIG } from '@/config/constants';

if (dailyBookingCount >= BOOKING_CONFIG.MAX_DAILY_TRIALS) {
  throw new BookingConflictError('Mentor has reached daily capacity');
}
```

## Demo Data and Seeding

### Seed Script Structure

```typescript
// prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../server/src/utils/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // 1. Create demo user accounts
  await seedDemoAccounts();
  
  // 2. Create courses
  await seedCourses();
  
  // 3. Create mentors with profiles and availability
  await seedMentors();
  
  // 4. Create parents with profiles
  await seedParents();
  
  // 5. Create existing bookings (various capacity states)
  await seedBookings();
  
  console.log('Seeding completed!');
}

async function seedDemoAccounts() {
  const password = await hashPassword('Demo123!');
  
  // Demo Parent Account
  const demoParent = await prisma.user.create({
    data: {
      email: 'demo.parent@example.com',
      passwordHash: password,
      role: 'PARENT',
      timezone: 'America/New_York',
      parentProfile: {
        create: {
          firstName: 'Sarah',
          lastName: 'Johnson',
          phoneNumber: '+1-555-0101'
        }
      }
    }
  });
  
  // Demo Mentor Account
  const demoMentor = await prisma.user.create({
    data: {
      email: 'demo.mentor@example.com',
      passwordHash: password,
      role: 'MENTOR',
      timezone: 'Asia/Kolkata',
      mentorProfile: {
        create: {
          firstName: 'Raj',
          lastName: 'Patel',
          bio: 'Experienced coding instructor with 5 years of teaching experience',
          active: true
        }
      }
    }
  });
  
  // Demo Admin Account
  const demoAdmin = await prisma.user.create({
    data: {
      email: 'demo.admin@example.com',
      passwordHash: password,
      role: 'ADMIN',
      timezone: 'America/Los_Angeles'
    }
  });
  
  console.log('✓ Created demo accounts');
}

async function seedCourses() {
  const courses = [
    { name: 'Coding Basics', description: 'Introduction to programming concepts' },
    { name: 'Python Programming', description: 'Learn Python from scratch' },
    { name: 'Web Development', description: 'HTML, CSS, and JavaScript fundamentals' },
    { name: 'Mathematics', description: 'Math concepts and problem solving' },
    { name: 'Science', description: 'Scientific concepts and experiments' },
    { name: 'Robotics', description: 'Build and program robots' }
  ];
  
  for (const course of courses) {
    await prisma.course.create({ data: course });
  }
  
  console.log('✓ Created courses');
}

async function seedMentors() {
  const mentorData = [
    {
      firstName: 'Emily',
      lastName: 'Chen',
      email: 'emily.chen@example.com',
      timezone: 'America/New_York',
      subjects: ['Python Programming', 'Web Development'],
      availability: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' }
      ]
    },
    {
      firstName: 'Michael',
      lastName: 'Rodriguez',
      email: 'michael.rodriguez@example.com',
      timezone: 'America/Los_Angeles',
      subjects: ['Coding Basics', 'Robotics'],
      availability: [
        { dayOfWeek: 1, startTime: '10:00', endTime: '18:00' },
        { dayOfWeek: 3, startTime: '10:00', endTime: '18:00' },
        { dayOfWeek: 5, startTime: '10:00', endTime: '18:00' }
      ]
    },
    {
      firstName: 'Priya',
      lastName: 'Sharma',
      email: 'priya.sharma@example.com',
      timezone: 'Asia/Kolkata',
      subjects: ['Mathematics', 'Science', 'Python Programming'],
      availability: [
        { dayOfWeek: 1, startTime: '14:00', endTime: '22:00' }, // 8:30 AM - 4:30 PM ET
        { dayOfWeek: 2, startTime: '14:00', endTime: '22:00' },
        { dayOfWeek: 3, startTime: '14:00', endTime: '22:00' },
        { dayOfWeek: 4, startTime: '14:00', endTime: '22:00' },
        { dayOfWeek: 5, startTime: '14:00', endTime: '22:00' }
      ]
    },
    {
      firstName: 'David',
      lastName: 'Kim',
      email: 'david.kim@example.com',
      timezone: 'Europe/London',
      subjects: ['Web Development', 'Coding Basics'],
      availability: [
        { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 6, startTime: '10:00', endTime: '14:00' }
      ]
    },
    {
      firstName: 'Lisa',
      lastName: 'Anderson',
      email: 'lisa.anderson@example.com',
      timezone: 'America/Chicago',
      subjects: ['Python Programming', 'Mathematics'],
      availability: [
        { dayOfWeek: 1, startTime: '11:00', endTime: '19:00' },
        { dayOfWeek: 2, startTime: '11:00', endTime: '19:00' },
        { dayOfWeek: 4, startTime: '11:00', endTime: '19:00' },
        { dayOfWeek: 5, startTime: '11:00', endTime: '19:00' }
      ]
    },
    {
      firstName: 'Ahmed',
      lastName: 'Al-Farsi',
      email: 'ahmed.alfarsi@example.com',
      timezone: 'Asia/Dubai',
      subjects: ['Robotics', 'Science'],
      availability: [
        { dayOfWeek: 6, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 7, startTime: '09:00', endTime: '17:00' }
      ]
    },
    {
      firstName: 'Sophie',
      lastName: 'Martin',
      email: 'sophie.martin@example.com',
      timezone: 'Europe/Paris',
      subjects: ['Web Development', 'Coding Basics'],
      availability: [
        { dayOfWeek: 1, startTime: '08:00', endTime: '16:00' },
        { dayOfWeek: 3, startTime: '08:00', endTime: '16:00' },
        { dayOfWeek: 5, startTime: '08:00', endTime: '16:00' }
      ]
    },
    {
      firstName: 'Kenji',
      lastName: 'Tanaka',
      email: 'kenji.tanaka@example.com',
      timezone: 'Asia/Tokyo',
      subjects: ['Python Programming', 'Robotics'],
      availability: [
        { dayOfWeek: 2, startTime: '18:00', endTime: '23:00' }, // Morning US time
        { dayOfWeek: 4, startTime: '18:00', endTime: '23:00' },
        { dayOfWeek: 6, startTime: '10:00', endTime: '18:00' }
      ]
    },
    {
      firstName: 'Emma',
      lastName: 'Wilson',
      email: 'emma.wilson@example.com',
      timezone: 'Australia/Sydney',
      subjects: ['Mathematics', 'Science'],
      availability: [
        { dayOfWeek: 1, startTime: '17:00', endTime: '23:00' }, // Early morning US time
        { dayOfWeek: 3, startTime: '17:00', endTime: '23:00' },
        { dayOfWeek: 5, startTime: '17:00', endTime: '23:00' }
      ]
    },
    {
      firstName: 'Carlos',
      lastName: 'Garcia',
      email: 'carlos.garcia@example.com',
      timezone: 'America/Denver',
      subjects: ['Coding Basics', 'Web Development', 'Mathematics'],
      availability: [
        { dayOfWeek: 1, startTime: '12:00', endTime: '20:00' },
        { dayOfWeek: 2, startTime: '12:00', endTime: '20:00' },
        { dayOfWeek: 3, startTime: '12:00', endTime: '20:00' },
        { dayOfWeek: 4, startTime: '12:00', endTime: '20:00' }
      ]
    }
  ];
  
  const password = await hashPassword('Mentor123!');
  
  for (const mentor of mentorData) {
    const user = await prisma.user.create({
      data: {
        email: mentor.email,
        passwordHash: password,
        role: 'MENTOR',
        timezone: mentor.timezone,
        mentorProfile: {
          create: {
            firstName: mentor.firstName,
            lastName: mentor.lastName,
            bio: `Experienced educator specializing in ${mentor.subjects.join(', ')}`,
            active: true
          }
        }
      },
      include: { mentorProfile: true }
    });
    
    // Link subjects
    const courses = await prisma.course.findMany({
      where: { name: { in: mentor.subjects } }
    });
    
    for (const course of courses) {
      await prisma.mentorCourse.create({
        data: {
          mentorId: user.mentorProfile!.id,
          courseId: course.id
        }
      });
    }
    
    // Create availability
    for (const slot of mentor.availability) {
      await prisma.mentorAvailability.create({
        data: {
          mentorId: user.mentorProfile!.id,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          timezone: mentor.timezone
        }
      });
    }
  }
  
  console.log('✓ Created 10 mentors with availability');
}

async function seedParents() {
  const parentData = [
    { firstName: 'Jennifer', lastName: 'Thompson', email: 'jennifer.thompson@example.com', timezone: 'America/New_York' },
    { firstName: 'Robert', lastName: 'Davis', email: 'robert.davis@example.com', timezone: 'America/Los_Angeles' },
    { firstName: 'Maria', lastName: 'Lopez', email: 'maria.lopez@example.com', timezone: 'America/Chicago' },
    { firstName: 'James', lastName: 'Brown', email: 'james.brown@example.com', timezone: 'Europe/London' },
    { firstName: 'Linda', lastName: 'Miller', email: 'linda.miller@example.com', timezone: 'America/New_York' }
  ];
  
  const password = await hashPassword('Parent123!');
  
  for (const parent of parentData) {
    await prisma.user.create({
      data: {
        email: parent.email,
        passwordHash: password,
        role: 'PARENT',
        timezone: parent.timezone,
        parentProfile: {
          create: {
            firstName: parent.firstName,
            lastName: parent.lastName,
            phoneNumber: '+1-555-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0')
          }
        }
      }
    });
  }
  
  console.log('✓ Created parent accounts');
}

async function seedBookings() {
  // Create bookings to demonstrate various capacity states
  
  // Get some mentors and parents
  const mentors = await prisma.mentorProfile.findMany({
    take: 5,
    include: { user: true }
  });
  
  const parents = await prisma.parentProfile.findMany({
    take: 3,
    include: { user: true }
  });
  
  const courses = await prisma.course.findMany();
  
  // Mentor 0: 0/2 capacity (no bookings)
  
  // Mentor 1: 1/2 capacity (one booking today)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);
  
  await prisma.booking.create({
    data: {
      parentId: parents[0].id,
      mentorId: mentors[1].id,
      courseId: courses[0].id,
      childName: 'Alex Thompson',
      childAge: 10,
      childGrade: '5th',
      startTimeUtc: tomorrow,
      endTimeUtc: new Date(tomorrow.getTime() + 45 * 60 * 1000),
      parentTimezone: parents[0].user.timezone,
      mentorTimezone: mentors[1].user.timezone,
      status: 'CONFIRMED',
      meetingUrl: 'https://meet.example.com/abc123'
    }
  });
  
  // Mentor 2: 2/2 capacity (two bookings today - at capacity)
  const booking1Time = new Date(tomorrow);
  booking1Time.setHours(10, 0, 0, 0);
  
  const booking2Time = new Date(tomorrow);
  booking2Time.setHours(15, 0, 0, 0);
  
  await prisma.booking.createMany({
    data: [
      {
        parentId: parents[1].id,
        mentorId: mentors[2].id,
        courseId: courses[1].id,
        childName: 'Emma Davis',
        childAge: 12,
        childGrade: '7th',
        startTimeUtc: booking1Time,
        endTimeUtc: new Date(booking1Time.getTime() + 45 * 60 * 1000),
        parentTimezone: parents[1].user.timezone,
        mentorTimezone: mentors[2].user.timezone,
        status: 'CONFIRMED',
        meetingUrl: 'https://meet.example.com/def456'
      },
      {
        parentId: parents[2].id,
        mentorId: mentors[2].id,
        courseId: courses[2].id,
        childName: 'Lucas Lopez',
        childAge: 9,
        childGrade: '4th',
        startTimeUtc: booking2Time,
        endTimeUtc: new Date(booking2Time.getTime() + 45 * 60 * 1000),
        parentTimezone: parents[2].user.timezone,
        mentorTimezone: mentors[2].user.timezone,
        status: 'CONFIRMED',
        meetingUrl: 'https://meet.example.com/ghi789'
      }
    ]
  });
  
  // Create a booking showing NY parent + Kolkata mentor timezone conversion
  const nyParent = parents.find(p => p.user.timezone === 'America/New_York');
  const kolkataMentor = mentors.find(m => m.user.timezone === 'Asia/Kolkata');
  
  if (nyParent && kolkataMentor) {
    const bookingTime = new Date(tomorrow);
    bookingTime.setHours(16, 0, 0, 0); // 4 PM UTC = 12 PM ET = 9:30 PM IST
    
    await prisma.booking.create({
      data: {
        parentId: nyParent.id,
        mentorId: kolkataMentor.id,
        courseId: courses[3].id,
        childName: 'Sophie Johnson',
        childAge: 11,
        childGrade: '6th',
        startTimeUtc: bookingTime,
        endTimeUtc: new Date(bookingTime.getTime() + 45 * 60 * 1000),
        parentTimezone: 'America/New_York',
        mentorTimezone: 'Asia/Kolkata',
        status: 'CONFIRMED',
        meetingUrl: 'https://meet.example.com/jkl012'
      }
    });
  }
  
  // Create some past bookings
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 3);
  pastDate.setHours(11, 0, 0, 0);
  
  await prisma.booking.create({
    data: {
      parentId: parents[0].id,
      mentorId: mentors[3].id,
      courseId: courses[4].id,
      childName: 'Noah Thompson',
      childAge: 8,
      childGrade: '3rd',
      startTimeUtc: pastDate,
      endTimeUtc: new Date(pastDate.getTime() + 45 * 60 * 1000),
      parentTimezone: parents[0].user.timezone,
      mentorTimezone: mentors[3].user.timezone,
      status: 'COMPLETED',
      meetingUrl: 'https://meet.example.com/mno345'
    }
  });
  
  // Create a cancelled booking
  const cancelledDate = new Date();
  cancelledDate.setDate(cancelledDate.getDate() + 2);
  cancelledDate.setHours(13, 0, 0, 0);
  
  await prisma.booking.create({
    data: {
      parentId: parents[1].id,
      mentorId: mentors[4].id,
      courseId: courses[5].id,
      childName: 'Olivia Davis',
      childAge: 13,
      childGrade: '8th',
      startTimeUtc: cancelledDate,
      endTimeUtc: new Date(cancelledDate.getTime() + 45 * 60 * 1000),
      parentTimezone: parents[1].user.timezone,
      mentorTimezone: mentors[4].user.timezone,
      status: 'CANCELLED',
      meetingUrl: 'https://meet.example.com/pqr678',
      cancelledAt: new Date()
    }
  });
  
  console.log('✓ Created demo bookings');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Running the Seed Script

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npx prisma db seed
```

### Demo Account Credentials

**Parent Account:**
- Email: demo.parent@example.com
- Password: Demo123!
- Can create bookings, view booking history

**Mentor Account:**
- Email: demo.mentor@example.com
- Password: Demo123!
- Can view assigned classes, see capacity

**Admin Account:**
- Email: demo.admin@example.com
- Password: Demo123!
- Can view all bookings, analytics, manage operations

## Implementation Notes

### Development Workflow

1. **Setup Phase:**
   - Initialize monorepo with pnpm workspaces
   - Setup TypeScript configuration for client and server
   - Configure Vite for frontend development
   - Setup Prisma and database connection
   - Configure ESLint and Prettier

2. **Database Phase:**
   - Define Prisma schema with all models
   - Create and run initial migration
   - Create seed script with demo data
   - Verify data relationships

3. **Backend Phase:**
   - Implement service layer (start with TimezoneService)
   - Implement authentication and authorization
   - Create API routes with validation
   - Add error handling middleware
   - Write unit and integration tests

4. **Frontend Phase:**
   - Setup routing and layout structure
   - Implement authentication flow
   - Build booking wizard (multi-step form)
   - Create dashboard components for each role
   - Add responsive styles with Tailwind

5. **Testing Phase:**
   - Write property-based tests for critical logic
   - Run integration tests for complete flows
   - Test timezone edge cases (DST, midnight crossing)
   - Test authorization boundaries

6. **Documentation Phase:**
   - Write comprehensive README
   - Document API endpoints
   - Create TRANSCRIPT.md
   - Add inline code comments

### Deployment Considerations

**Environment Setup:**
- Production database with connection pooling
- Environment-specific configuration
- SSL/TLS for database connections
- Secure secret management

**Performance Optimizations:**
- Database query optimization with proper indexes
- Connection pooling for Prisma
- Response caching for static data (courses, mentor profiles)
- Lazy loading for large lists

**Monitoring:**
- Logging with structured format (Winston or Pino)
- Error tracking (Sentry integration ready)
- Performance monitoring for slow queries
- Booking success rate tracking

### Future Enhancements

**Phase 2 Features:**
- Real email notifications via SendGrid
- Video meeting integration (Zoom/Meet API)
- Calendar sync (Google Calendar, Outlook)
- SMS reminders via Twilio
- Mentor ratings and reviews
- Multi-child support per parent account
- Recurring class bookings

**Technical Improvements:**
- Redis caching for availability queries
- WebSocket for real-time dashboard updates
- Optimistic UI updates
- Progressive Web App (PWA) support
- Internationalization (i18n) support

---

## Summary

This design document provides a comprehensive blueprint for implementing the Codeyoung Trial Booking Platform. Key highlights:

- **Monorepo architecture** with clear separation between client and server
- **Timezone-aware system** using Luxon with IANA identifiers and DST handling
- **Robust booking logic** with transaction-based double-booking prevention
- **Daily capacity management** based on mentor's local calendar day
- **Role-based security** with JWT authentication and resource-level authorization
- **37 correctness properties** defining expected system behavior
- **Comprehensive testing strategy** including unit, integration, and property-based tests
- **Demo data with 10 mentors** across different timezones for immediate testing
- **Production-ready security** with Helmet, CORS, rate limiting, and input validation

The implementation follows industry best practices with TypeScript throughout, proper error handling, and extensive test coverage to ensure correctness of critical business logic, especially around timezone handling and booking constraints.
