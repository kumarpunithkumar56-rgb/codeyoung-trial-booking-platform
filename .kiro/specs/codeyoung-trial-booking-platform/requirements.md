# Requirements Document

## Introduction

The Codeyoung Trial Booking Platform is a full-stack EdTech web application that enables parents to book free trial classes for their children with mentors across different timezones. The system manages three user roles (Parent, Mentor, Admin) and enforces critical business rules including timezone-aware scheduling, mentor capacity limits, and double-booking prevention.

## Glossary

- **Platform**: The complete Codeyoung Trial Booking web application system
- **Parent**: A user who books free trial classes for their children
- **Mentor**: A user who conducts trial classes and has availability schedules
- **Admin**: A user who manages operations and views analytics
- **Trial_Class**: A 45-minute educational session between a mentor and a student
- **Booking**: A scheduled trial class with confirmed date, time, and participants
- **Local_Calendar_Day**: A 24-hour period from 00:00 to 23:59 in the mentor's timezone
- **Slot**: A 30-minute time interval during which a trial class can be scheduled
- **UTC**: Coordinated Universal Time used for storing all timestamps
- **IANA_Timezone**: Standardized timezone identifier (e.g., America/New_York, Asia/Kolkata)
- **DST**: Daylight Saving Time - seasonal time changes in certain timezones
- **Booking_Notice**: Minimum time required between current time and booking start time
- **Authentication_Service**: Service handling user signup, login, and password management
- **Booking_Service**: Service managing trial class bookings with validation
- **Availability_Service**: Service generating available time slots for mentors
- **Timezone_Service**: Service handling UTC conversion and DST calculations
- **Mentor_Matching_Service**: Service for deterministic mentor assignment
- **Notification_Service**: Service for creating notification records

## Technology Stack Requirements

### Requirement 0: Technology Stack and Architecture

**User Story:** As a developer and recruiter, I want the platform to use modern, industry-standard technologies with a clear separation between frontend and backend, so that the codebase is maintainable, inspectable, and demonstrates full-stack expertise.

#### Acceptance Criteria

1. THE Platform SHALL implement the frontend using React with TypeScript and Vite as the build tool
2. THE Platform SHALL implement the backend using Node.js with Express.js and TypeScript
3. THE Platform SHALL use Tailwind CSS for styling the frontend
4. THE Platform SHALL use PostgreSQL as the database with Prisma ORM for data access
4. THE Platform SHALL structure the project as a monorepo with clearly separated /client and /server directories
5. THE Platform SHALL use date-fns-tz or Luxon for timezone operations
6. THE Platform SHALL use Vitest or Jest for unit tests and Supertest for API integration tests
7. THE Platform SHALL provide a comprehensive README.md with setup instructions, architecture overview, API documentation, and demo account credentials
8. THE Platform SHALL provide a TRANSCRIPT.md documenting the development process without fabricated AI conversations
9. THE Platform SHALL be GitHub-ready with proper .gitignore, .env.example, and no committed secrets

## Requirements

### Requirement 1: User Authentication and Authorization

**User Story:** As a user, I want to securely sign up and log in to the platform, so that I can access role-specific features.

#### Acceptance Criteria

1. WHEN a user submits valid signup credentials, THE Authentication_Service SHALL create a new user account with hashed password using bcrypt
2. WHEN a user submits valid login credentials, THE Authentication_Service SHALL authenticate the user and return a session token
3. WHEN a user logs out, THE Authentication_Service SHALL invalidate the session
4. THE Platform SHALL enforce role-based authorization on all protected API endpoints
5. WHEN a user requests password reset, THE Authentication_Service SHALL generate a secure token with expiration and send reset instructions
6. WHEN an unauthorized user attempts to access a protected route, THE Platform SHALL return an HTTP 401 or 403 error
7. THE Platform SHALL support three user roles: Parent, Mentor, and Admin

### Requirement 2: Timezone-Aware Booking System

**User Story:** As a parent or mentor, I want the platform to handle timezones correctly, so that class times are displayed in my local time and booked accurately.

#### Acceptance Criteria

1. THE Platform SHALL store all booking timestamps in UTC format in the database
2. WHEN displaying booking times to users, THE Platform SHALL convert UTC timestamps to the user's IANA_Timezone
3. THE Timezone_Service SHALL handle DST transitions automatically using IANA timezone identifiers
4. WHEN creating a booking, THE Booking_Service SHALL validate that the booking time is valid in both parent and mentor timezones
5. THE Platform SHALL never use hardcoded timezone offsets for time calculations
6. WHEN a booking is confirmed, THE Platform SHALL display both parent local time and mentor local time in the review screen

### Requirement 3: Mentor Daily Trial Class Capacity

**User Story:** As a mentor, I want my trial class bookings limited to 2 per calendar day in my timezone, so that I maintain a manageable workload.

#### Acceptance Criteria

1. THE Booking_Service SHALL enforce a maximum of 2 trial classes per mentor per Local_Calendar_Day
2. WHEN calculating daily capacity, THE Platform SHALL use the mentor's configured IANA_Timezone
3. WHEN a mentor has 2 trial classes booked for a Local_Calendar_Day, THE Availability_Service SHALL exclude all slots for that day
4. WHEN a booking is cancelled, THE Booking_Service SHALL immediately recalculate the mentor's daily capacity
5. THE Platform SHALL display current trial class count (e.g., "1/2" or "2/2") in the mentor dashboard

### Requirement 4: Double-Booking Prevention

**User Story:** As a platform administrator, I want to prevent double-bookings, so that mentors are never assigned to overlapping classes.

#### Acceptance Criteria

1. WHEN creating a booking, THE Booking_Service SHALL use database transactions to ensure atomicity
2. THE Booking_Service SHALL validate that no overlapping bookings exist for the mentor before confirming
3. THE Booking_Service SHALL validate that the requested time slot is still available immediately before final confirmation
4. IF a time slot becomes unavailable during booking creation, THEN THE Booking_Service SHALL return an error and rollback the transaction
5. THE Platform SHALL use database-level constraints or row-level locking to prevent race conditions

### Requirement 5: Mentor Availability Management

**User Story:** As a mentor, I want to set my weekly availability schedule, so that parents can only book classes during my working hours.

#### Acceptance Criteria

1. THE Platform SHALL allow mentors to configure availability by day of week with start and end times
2. THE Availability_Service SHALL generate bookable slots at 30-minute intervals within mentor working hours
3. THE Platform SHALL use a trial class duration of 45 minutes for all bookings
4. THE Platform SHALL store mentor availability with their IANA_Timezone
5. WHEN generating available slots, THE Availability_Service SHALL exclude slots where the mentor has existing bookings
6. THE Availability_Service SHALL exclude slots that are less than 2 hours from the current time
7. THE Platform SHALL support mentors teaching multiple subjects with subject-specific filtering

### Requirement 6: Parent Booking Flow

**User Story:** As a parent, I want to book a free trial class for my child, so that my child can experience the educational offering.

#### Acceptance Criteria

1. WHEN a parent accesses the booking flow, THE Platform SHALL require child details including name, age, and grade
2. THE Platform SHALL display available subjects for trial classes
3. WHEN a parent selects a date and subject, THE Availability_Service SHALL return available time slots with mentor information
4. THE Platform SHALL display available slots in the parent's local timezone
5. WHEN a parent selects "Find an available mentor", THE Mentor_Matching_Service SHALL use deterministic matching based on subject compatibility, requested time, availability, daily capacity, and active status
6. WHEN no mentors are available for the selected date and time, THE Platform SHALL display a clear error message "No mentors are available for this time" with options to try another time or view next available slots
7. WHEN a parent confirms a booking, THE Booking_Service SHALL create the booking record and return a booking ID and meeting URL
8. THE Platform SHALL display a success confirmation with booking details after successful booking creation

### Requirement 7: Booking Confirmation and Meeting Details

**User Story:** As a parent, I want to receive booking confirmation with meeting details, so that I know when and how to attend the trial class.

#### Acceptance Criteria

1. WHEN a booking is successfully created, THE Platform SHALL generate a unique booking ID
2. THE Platform SHALL provide a meeting URL for the trial class
3. THE Platform SHALL display the booking confirmation showing parent local time and mentor local time
4. THE Notification_Service SHALL create a notification record for the parent confirming the booking
5. THE Notification_Service SHALL create a notification record for the mentor about the new booking assignment

### Requirement 8: Mentor Dashboard

**User Story:** As a mentor, I want to view my assigned trial classes, so that I can prepare for upcoming sessions.

#### Acceptance Criteria

1. THE Platform SHALL display today's trial classes for the logged-in mentor
2. THE Platform SHALL display upcoming trial classes sorted by start time
3. THE Platform SHALL display trial class capacity for each day showing current count and maximum limit (e.g., "1/2" or "2/2")
4. WHEN displaying class details, THE Platform SHALL show child information, subject, and time in mentor's local timezone
5. THE Platform SHALL update the dashboard in real-time when new bookings are assigned
6. THE Mentor SHALL only access their own assigned bookings and SHALL NOT access other mentors' data

### Requirement 9: Admin Dashboard and Operations

**User Story:** As an admin, I want to view all bookings and analytics, so that I can manage platform operations effectively.

#### Acceptance Criteria

1. THE Platform SHALL display all bookings with filtering options by date, mentor, subject, and status
2. THE Platform SHALL display mentor capacity information across all mentors
3. THE Platform SHALL provide analytics cards showing key metrics such as total bookings, active mentors, and mentors at capacity
4. THE Platform SHALL allow admins to view detailed booking information including parent and mentor details
5. WHERE admin filtering is applied, THE Platform SHALL update the displayed bookings accordingly
6. THE Platform SHALL provide a view of all parent accounts with their booking history

### Requirement 10: Parent Booking History

**User Story:** As a parent, I want to view my booking history, so that I can track my child's trial classes.

#### Acceptance Criteria

1. THE Platform SHALL provide a booking history page accessible at /bookings
2. THE Platform SHALL display bookings in three categories: Upcoming, Past, and Cancelled
3. WHEN displaying each booking, THE Platform SHALL show child name, subject, mentor, date, parent local time, and status
4. THE Platform SHALL provide action buttons for each booking including "View Details", "Join Class", and "Cancel"
5. THE Parent SHALL only access their own bookings and SHALL NOT access other parents' data
6. WHEN a parent views booking details, THE Platform SHALL display comprehensive information including timezone details, meeting link, and booking ID

### Requirement 11: Booking Cancellation

**User Story:** As a parent or admin, I want to cancel a booking, so that the time slot becomes available for other parents.

#### Acceptance Criteria

1. WHEN a booking is cancelled, THE Booking_Service SHALL update the booking status to cancelled
2. THE Booking_Service SHALL release the time slot and update mentor daily capacity immediately
3. THE Platform SHALL allow parents to cancel their own bookings up until the class start time
4. THE Platform SHALL allow admins to cancel any booking
5. THE Notification_Service SHALL create notification records for affected parties when a booking is cancelled
6. THE Platform SHALL prompt for confirmation before cancelling a booking

### Requirement 12: Security and Rate Limiting

**User Story:** As a platform administrator, I want the platform to be secure against common web vulnerabilities, so that user data remains protected.

#### Acceptance Criteria

1. THE Platform SHALL implement Helmet middleware for HTTP security headers
2. THE Platform SHALL configure CORS to restrict cross-origin requests to allowed domains
3. THE Platform SHALL implement rate limiting on authentication endpoints to prevent brute force attacks
4. THE Platform SHALL validate all API inputs using Zod schema validation
5. THE Platform SHALL never expose sensitive information in error messages returned to clients

### Requirement 13: Database Schema and Data Integrity

**User Story:** As a developer, I want a well-structured database schema with proper relationships, so that data integrity is maintained.

#### Acceptance Criteria

1. THE Platform SHALL store user data including email, hashed password, role, and timezone in a User table
2. THE Platform SHALL maintain separate profile tables for ParentProfile and MentorProfile with foreign keys to User
3. THE Platform SHALL store bookings with parentId, mentorId, courseId, timestamps in UTC, and timezone information
4. THE Platform SHALL use Prisma ORM for database operations with proper migrations
5. THE Platform SHALL enforce referential integrity through foreign key constraints
6. THE Platform SHALL store mentor availability with mentorId, dayOfWeek, time ranges, and timezone

### Requirement 14: Responsive Design and User Experience

**User Story:** As a user, I want the platform to work seamlessly on mobile, tablet, and desktop devices, so that I can access it from any device.

#### Acceptance Criteria

1. THE Platform SHALL support responsive breakpoints at 375px (mobile), 768px (tablet), and 1440px (desktop)
2. THE Platform SHALL display loading states during asynchronous operations
3. THE Platform SHALL display skeleton loaders for content that is being fetched
4. THE Platform SHALL display appropriate empty states when no data is available
5. THE Platform SHALL display error messages using toast notifications with auto-dismiss
6. THE Platform SHALL follow a clean, modern, parent-friendly EdTech visual design style
7. THE Platform SHALL use semantic HTML elements for proper document structure
8. THE Platform SHALL implement ARIA attributes where appropriate for screen reader accessibility
9. THE Platform SHALL ensure form inputs have associated labels for accessibility
10. THE Platform SHALL maintain keyboard navigation support for all interactive elements

### Requirement 15: Demo Data and Seeding

**User Story:** As a recruiter or evaluator, I want to access pre-populated demo data, so that I can test the platform features immediately.

#### Acceptance Criteria

1. THE Platform SHALL provide a database seed script that populates demo data
2. THE Platform SHALL create exactly 10 fictional mentors with different IANA timezones including America/New_York, America/Los_Angeles, Europe/London, and Asia/Kolkata
3. THE Platform SHALL support up to 20 parents booking trials per day across all mentors
4. THE Platform SHALL create demo user accounts with emails demo.parent@example.com, demo.mentor@example.com, and demo.admin@example.com with documented passwords in README
5. THE Platform SHALL create weekly availability schedules for each demo mentor
6. THE Platform SHALL create existing bookings that demonstrate various capacity states (0/2, 1/2, 2/2)
7. THE Platform SHALL create multiple course subjects including Coding, Python, Web Development, Math, Science, and Robotics
8. THE Platform SHALL create at least one demonstration booking showing timezone conversion between America/New_York (parent) and Asia/Kolkata (mentor)

### Requirement 16: Testing and Quality Assurance

**User Story:** As a developer, I want comprehensive tests for critical functionality, so that bugs are caught before deployment.

#### Acceptance Criteria

1. THE Platform SHALL include unit tests for timezone conversion functions in Timezone_Service
2. THE Platform SHALL include unit tests for DST handling in Timezone_Service including DST transition dates
3. THE Platform SHALL include unit tests for midnight timezone crossing scenarios
4. THE Platform SHALL include integration tests for the complete booking flow using Supertest
5. THE Platform SHALL include test cases for normal booking, second booking allowed, and third booking rejected (daily limit)
6. THE Platform SHALL include test cases for double-booking prevention and overlapping booking prevention with concurrent attempts
7. THE Platform SHALL include test cases for booking cancellation and immediate slot release
8. THE Platform SHALL include test cases for authorization on protected endpoints verifying parent and mentor data isolation
9. THE Platform SHALL include test cases for no-mentor-available scenarios
