# Codeyoung Trial Booking Platform

A full-stack, EdTech web application for scheduling free 1-on-1 trial classes with mentors across different timezones. Features automated timezone conversion, mentor daily capacity limits, double-booking prevention, role-based dashboards, and interactive step-by-step booking.

---

## 🚀 Features

- **Role-based Access & Dashboards**: Dedicated UI and permissions for **Parent**, **Mentor**, and **Admin** roles.
- **Timezone-Aware Scheduling**:
  - All booking timestamps stored in **UTC** in PostgreSQL database.
  - Automatic conversion to/from local time for both Parent and Mentor using Luxon with **IANA timezone identifiers**.
  - **Full Daylight Saving Time (DST)** handling.
- **Strict Business Rules**:
  - 45-minute trial class duration.
  - 30-minute booking slot intervals.
  - Minimum 2-hour advance booking notice buffer.
  - **Maximum 2 trial classes per mentor per local calendar day** (calculated in the mentor's local timezone).
  - Concurrency-safe double-booking prevention using serializable Prisma transactions.
- **Smart Mentor Assignment**: Auto-matches available mentors based on subject expertise, working hours, and capacity.
- **Meeting Link Generation**: Generates a dummy video meeting link upon booking confirmation.
- **Modern Responsive UI**: Built with React 18, Vite, Tailwind CSS, Framer Motion animations, and Lucide icons.

---

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite, React Router v6, Tailwind CSS, Framer Motion, Lucide React, Axios, Luxon.
- **Backend**: Node.js, Express.js, TypeScript, Prisma ORM, PostgreSQL (`embedded-postgres`), bcrypt, JSON Web Tokens (JWT), Zod, Helmet, CORS.
- **Database**: PostgreSQL with Prisma ORM.

---

## 📁 Project Structure

```
crazy/
├── client/                 # React + Vite Frontend
│   ├── src/
│   │   ├── components/    # Booking step components (Child, Subject, Schedule, Mentor, Review)
│   │   ├── contexts/      # AuthContext with central API service
│   │   ├── pages/         # Landing, Login, Signup, Parent, Mentor & Admin Dashboards, Booking pages
│   │   ├── services/      # Axios API client setup
│   │   ├── types.ts       # TypeScript interfaces
│   │   └── App.tsx        # React routes & protected route guards
│   ├── package.json
│   └── vite.config.ts
├── server/                 # Node.js + Express Backend
│   ├── src/
│   │   ├── config/        # System constants & timezone defaults
│   │   ├── middleware/    # Auth, security, validation, error handling
│   │   ├── routes/        # API routes (/auth, /bookings, /mentors, /courses, /availability)
│   │   ├── schemas/       # Zod validation schemas
│   │   ├── services/      # Business logic (Timezone, Booking, Availability, Matching, Auth)
│   │   └── index.ts       # Express server initialization
│   ├── start-postgres.ts  # Embedded PostgreSQL starter
│   └── package.json
├── prisma/                 # Database Layer
│   ├── schema.prisma      # Prisma database models
│   └── seed.ts            # Idempotent database seed script
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules (ignores .env, node_modules, .pgdata, build dist)
├── README.md               # Complete setup & project documentation
├── TRANSCRIPT.md           # Development transcript log
└── package.json            # Root monorepo workspace configuration
```

---

## 📋 Prerequisites

- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **OS**: Windows, macOS, or Linux

*(Note: PostgreSQL database is embedded via `embedded-postgres` so no separate PostgreSQL server installation is required!)*

---

## ⚙️ Environment Variables Setup

Copy the template file `.env.example` to create `.env` in the project root:

```bash
cp .env.example .env
```

Your `.env` file should contain:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/codeyoung_dev"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-minimum-64-characters-required"
BCRYPT_SALT_ROUNDS=10
NODE_ENV=development
PORT=3000
CLIENT_URL="http://localhost:5173"
```

---

## 🚀 Quick Start Guide (Run Complete Application)

### Step 1: Install Dependencies

From the project root directory:

```bash
npm install
```

### Step 2: Start the Embedded PostgreSQL Database

Start the local embedded PostgreSQL database server on port 5432:

```bash
# In Terminal 1
cd server
npx tsx start-postgres.ts
```

*(Keep this terminal running. It starts PostgreSQL on `localhost:5432`.)*

### Step 3: Initialize Database Schema & Seed Data

In a new terminal:

```bash
# Push Prisma Schema to database
npm run db:migrate --workspace=server

# Seed Demo Accounts & 10 Fictional Mentors
npm run db:seed
```

### Step 4: Start Backend & Frontend Servers

Run both servers concurrently from the root directory:

```bash
npm run dev
```

Or run them in separate terminals:

```bash
# Terminal 1: Backend Server (Port 3000)
npm run dev:server

# Terminal 2: Frontend Server (Port 5173)
npm run dev:client
```

---

## 🔗 Important URLs

- **Frontend Web Application**: [http://localhost:5173](http://localhost:5173)
- **Login Page**: [http://localhost:5173/login](http://localhost:5173/login)
- **Backend API Server**: [http://localhost:3000](http://localhost:3000)
- **Backend Health Check**: [http://localhost:3000/health](http://localhost:3000/health)

---

## 👥 Demo Login Credentials

| Role | Email | Password | Primary Timezone | Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Parent** | `demo.parent@example.com` | `Demo123!` | `America/New_York` | Book 1-on-1 trial classes, view upcoming bookings |
| **Mentor** | `demo.mentor@example.com` | `Demo123!` | `Asia/Kolkata` | View assigned classes, check 2/day daily capacity |
| **Admin** | `demo.admin@example.com` | `Demo123!` | `America/Los_Angeles` | View overall system analytics, all bookings, active mentors |

---

## 🛠 Build & Typecheck Commands

To test production build artifacts:

```bash
# Build Frontend React Application
npm run build:client

# Typecheck Backend Server
npm run build:server

# Build All
npm run build
```

---

## 🐛 Known Limitations

1. **Video Integration**: Meeting URLs are generated as functional dummy links (`https://meet.codeyoung-demo.com/trial/<booking-id>`) rather than live Zoom/WebRTC sessions.
2. **Notifications**: In-app notifications are stored in PostgreSQL and accessible via API; SMS/Email delivery via Twilio/SendGrid is not configured in this MVP.
