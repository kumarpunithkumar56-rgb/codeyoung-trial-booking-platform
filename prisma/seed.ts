import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing tables
  await prisma.notification.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.mentorCourse.deleteMany();
  await prisma.mentorAvailability.deleteMany();
  await prisma.mentorProfile.deleteMany();
  await prisma.parentProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.course.deleteMany();

  // Hash password for all demo accounts
  const password = await bcrypt.hash('Demo123!', 10);

  // 1. Create courses
  console.log('Creating courses...');
  const courses = await Promise.all([
    prisma.course.create({ data: { name: 'Coding Basics', description: 'Introduction to programming concepts', durationMinutes: 45 } }),
    prisma.course.create({ data: { name: 'Python Programming', description: 'Learn Python from scratch', durationMinutes: 45 } }),
    prisma.course.create({ data: { name: 'Web Development', description: 'HTML, CSS, and JavaScript', durationMinutes: 45 } }),
    prisma.course.create({ data: { name: 'Mathematics', description: 'Math concepts and problem solving', durationMinutes: 45 } }),
    prisma.course.create({ data: { name: 'Science', description: 'Scientific concepts and experiments', durationMinutes: 45 } }),
    prisma.course.create({ data: { name: 'Robotics', description: 'Build and program robots', durationMinutes: 45 } }),
  ]);

  // 2. Create demo parent account
  console.log('Creating demo parent...');
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
          phoneNumber: '+1-555-0101',
        },
      },
    },
  });

  // 3. Create 10 demo mentors
  console.log('Creating 10 mentors...');
  
  const mentorData = [
    { firstName: 'Aarav', lastName: 'Sharma', timezone: 'Asia/Kolkata', subjects: [courses[0].id, courses[1].id], email: 'aarav.sharma@example.com', day: [1,2,3,4,5,6,7], start: '10:00', end: '22:00' },
    { firstName: 'Priya', lastName: 'Nair', timezone: 'Asia/Kolkata', subjects: [courses[2].id, courses[3].id], email: 'priya.nair@example.com', day: [1,2,3,4,5,6,7], start: '10:00', end: '22:00' },
    { firstName: 'Rohan', lastName: 'Mehta', timezone: 'America/Los_Angeles', subjects: [courses[0].id, courses[5].id], email: 'rohan.mehta@example.com', day: [1,2,3,4,5,6,7], start: '09:00', end: '20:00' },
    { firstName: 'Ananya', lastName: 'Rao', timezone: 'America/New_York', subjects: [courses[1].id, courses[2].id], email: 'ananya.rao@example.com', day: [1,2,3,4,5,6,7], start: '09:00', end: '20:00' },
    { firstName: 'Vikram', lastName: 'Singh', timezone: 'Europe/London', subjects: [courses[3].id, courses[4].id], email: 'vikram.singh@example.com', day: [1,2,3,4,5,6,7], start: '09:00', end: '20:00' },
    { firstName: 'Meera', lastName: 'Iyer', timezone: 'Asia/Dubai', subjects: [courses[0].id, courses[2].id], email: 'meera.iyer@example.com', day: [1,2,3,4,5,6,7], start: '10:00', end: '18:00' },
    { firstName: 'Karan', lastName: 'Patel', timezone: 'America/Chicago', subjects: [courses[1].id, courses[5].id], email: 'karan.patel@example.com', day: [1,2,3,4,5,6,7], start: '11:00', end: '19:00' },
    { firstName: 'Sneha', lastName: 'Reddy', timezone: 'Asia/Tokyo', subjects: [courses[2].id, courses[4].id], email: 'sneha.reddy@example.com', day: [1,2,3,4,5,6,7], start: '10:00', end: '23:00' },
    { firstName: 'Aditya', lastName: 'Menon', timezone: 'Australia/Sydney', subjects: [courses[0].id, courses[3].id], email: 'aditya.menon@example.com', day: [1,2,3,4,5,6,7], start: '10:00', end: '22:00' },
    { firstName: 'Ishita', lastName: 'Kapoor', timezone: 'America/Denver', subjects: [courses[1].id, courses[4].id], email: 'ishita.kapoor@example.com', day: [1,2,3,4,5,6,7], start: '09:00', end: '20:00' },
  ];

  for (const data of mentorData) {
    const mentor = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: password,
        role: 'MENTOR',
        timezone: data.timezone,
        mentorProfile: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
            bio: `Experienced educator specializing in coding and STEM subjects.`,
            active: true,
          },
        },
      },
      include: { mentorProfile: true },
    });

    // Link subjects
    for (const courseId of data.subjects) {
      await prisma.mentorCourse.create({
        data: {
          mentorId: mentor.mentorProfile!.id,
          courseId,
        },
      });
    }

    // Create availability
    for (const dayOfWeek of data.day) {
      await prisma.mentorAvailability.create({
        data: {
          mentorId: mentor.mentorProfile!.id,
          dayOfWeek,
          startTime: data.start,
          endTime: data.end,
          timezone: data.timezone,
        },
      });
    }
  }

  // 4. Create demo mentor account (accessible via login)
  console.log('Creating demo mentor account...');
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
          active: true,
        },
      },
    },
    include: { mentorProfile: true },
  });

  await prisma.mentorCourse.create({
    data: {
      mentorId: demoMentor.mentorProfile!.id,
      courseId: courses[0].id,
    },
  });

  await prisma.mentorAvailability.create({
    data: {
      mentorId: demoMentor.mentorProfile!.id,
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '17:00',
      timezone: 'Asia/Kolkata',
    },
  });

  // 5. Create demo admin account
  console.log('Creating demo admin...');
  await prisma.user.create({
    data: {
      email: 'demo.admin@example.com',
      passwordHash: password,
      role: 'ADMIN',
      timezone: 'America/Los_Angeles',
    },
  });

  console.log('✅ Seed completed!');
  console.log('\n📋 Demo Accounts:');
  console.log('Parent: demo.parent@example.com / Demo123!');
  console.log('Mentor: demo.mentor@example.com / Demo123!');
  console.log('Admin: demo.admin@example.com / Demo123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
