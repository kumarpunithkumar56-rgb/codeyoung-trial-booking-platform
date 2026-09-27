# Development Transcript: Codeyoung Trial Booking Platform

## Project Overview

This document tracks the development process, technical decisions, challenges, and solutions for building the Codeyoung Trial Booking Platform - a full-stack EdTech web application for scheduling trial classes across timezones.

---

## Phase 1: Project Setup and Infrastructure

### Date: Implementation Start

**Goal**: Initialize monorepo structure with React frontend, Express backend, and PostgreSQL database.

**Technology Decisions**:
- **Monorepo Structure**: Chose workspaces to keep frontend and backend in a single repository while maintaining clear separation
- **Frontend**: React 18+ with TypeScript, Vite for fast HMR, Tailwind CSS for utility-first styling
- **Backend**: Node.js 18+ with Express and TypeScript for type safety across the stack
- **Database**: PostgreSQL 14+ with Prisma ORM for type-safe queries and automatic migrations
- **Timezone Library**: Luxon chosen over moment.js (deprecated) or date-fns for comprehensive IANA timezone and DST support

**Initial Setup**:
1. Created root package.json with workspace configuration
2. Set up .gitignore to exclude node_modules, .env, and build artifacts
3. Created .env.example with all required environment variables
4. Initialized Git repository with proper exclusions

**Key Files Created**:
- `package.json` - Root workspace configuration
- `.gitignore` - Git exclusions for dependencies, builds, secrets
- `.env.example` - Environment variable template
- `README.md` - Project documentation (initial version)
- `TRANSCRIPT.md` - This development log

---

## Phase 2: Database Schema & Core Architecture Design

- Defined PostgreSQL Prisma models: `User`, `ParentProfile`, `MentorProfile`, `Course`, `MentorCourse`, `MentorAvailability`, `Booking`, `Notification`.
- Configured UTC timestamp storage (`startTimeUtc`, `endTimeUtc`) and IANA timezone fields (`parentTimezone`, `mentorTimezone`).
- Configured bcrypt password hashing and JWT authorization middleware.
- Implemented `TimezoneService` utilizing Luxon for `getLocalDayBoundaries` to calculate the mentor's 2/day daily capacity limit strictly in the mentor's local calendar day.

---

## Phase 3: Takeover, Runtime Diagnostics, Embedded Database Setup & Final End-to-End Verification

### Session Overview & Handover Context
Took full ownership of the existing codebase to diagnose and resolve a runtime login error (`An unexpected error occurred`), configure embedded database infrastructure, complete core booking flows, and verify Git tracking cleanliness.

### Diagnosed Issues & Fixes Applied:
1. **Unreachable Database Server**:
   - Diagnosed `PrismaClientInitializationError: Can't reach database server at localhost:5432`.
   - Configured `embedded-postgres` package in `server/start-postgres.ts` to launch an embedded, zero-dependency PostgreSQL database instance on port `5432` targeting `codeyoung_dev`.
   - Synchronized Prisma schema via `npx prisma db push --schema=../prisma/schema.prisma` and made `prisma/seed.ts` idempotent by clearing existing records prior to seeding.
   - Seeded database with 10 fictional mentors (with realistic working hours & weekend availability across `Asia/Kolkata`, `America/New_York`, `America/Los_Angeles`, `Europe/London`, `Asia/Dubai`, `America/Chicago`, `Asia/Tokyo`, `Australia/Sydney`, `America/Denver`), 6 STEM courses, and demo accounts.

2. **Backend Authentication & Route Resolution**:
   - Cleared an orphaned background Node process blocking port `3000`.
   - Updated `client/src/contexts/AuthContext.tsx` to use the central `api` instance from `src/services/api.ts` (pointing to `/api` / `http://localhost:3000/api`) for uniform API base URL resolution, headers, and token handling.
   - Verified login endpoints via automated HTTP requests for `demo.parent@example.com`, `demo.mentor@example.com`, and `demo.admin@example.com`.

3. **Routing & UI Fixes**:
   - Fixed broken navigation links in `ParentDashboardPage.tsx` (`/parent/book-trial` → `/book-trial` and `/parent/bookings/:id` → `/booking-confirmation/:id`).
   - Added sticky top navigation bars with role badges and Logout actions across Parent and Mentor dashboards.
   - Updated `MentorSelectionStep.tsx` and `createBookingSchema` to support smart mentor auto-matching when explicit mentor preferences are omitted.
   - Resolved all strict TypeScript build warnings across client and server packages.

4. **Git Repository Cleanup**:
   - Updated `.gitignore` to explicitly ignore `server/.pgdata/`, `.env`, build outputs, and runtime logs.
   - Force-unstaged `server/.pgdata/` from Git index tracking (`git rm -r -f --cached server/.pgdata`) without deleting database files on disk.

---

## Verification Summary

| Component | Status | Details |
| :--- | :--- | :--- |
| **Backend API** | ✅ Passed | Express running on port `3000` |
| **Frontend UI** | ✅ Passed | React + Vite running on port `5173` |
| **Database** | ✅ Passed | PostgreSQL active on port `5432` with Prisma schema & seed |
| **Authentication** | ✅ Passed | Parent, Mentor, and Admin logins succeed |
| **Booking Flow** | ✅ Passed | End-to-end trial booking, meeting URL generation, UTC storage |
| **Build Status** | ✅ Passed | `npm run build` succeeds cleanly |
| **Git Cleanliness** | ✅ Passed | No `.env`, `node_modules`, `server/.pgdata`, or build outputs tracked |
