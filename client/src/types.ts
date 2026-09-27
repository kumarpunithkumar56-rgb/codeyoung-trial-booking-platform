export type UserRole = 'PARENT' | 'MENTOR' | 'ADMIN';
export type BookingStatus = 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export type NotificationType = 'BOOKING_CONFIRMED' | 'BOOKING_CANCELLED' | 'PASSWORD_RESET';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  timezone: string;
  createdAt: string;
  profile?: ParentProfile | MentorProfile;
}

export interface ParentProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface MentorProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  bio?: string;
  photoUrl?: string;
  active: boolean;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
}

export interface Booking {
  id: string;
  parentId: string;
  mentorId: string;
  courseId: string;
  childName: string;
  childAge: number;
  childGrade: string;
  startTimeUtc: string;
  endTimeUtc: string;
  status: BookingStatus;
  meetingUrl: string;
  cancelledAt?: string;
  parentTimezone: string;
  mentorTimezone: string;
  createdAt: string;
  updatedAt: string;
  course?: Course;
  mentor?: User;
  parent?: User;
}

export interface TimeSlot {
  startTimeUtc: string;
  endTimeUtc: string;
  startTimeLocal: string;
  endTimeLocal: string;
}

export interface AvailableSlot extends TimeSlot {
  mentorId?: string;
}
