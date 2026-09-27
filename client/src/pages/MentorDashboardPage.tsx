import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Calendar, Clock, Video } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Booking } from '../types';
import { DateTime } from 'luxon';

const MentorDashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyCapacity, setDailyCapacity] = useState({ current: 0, max: 2 });

  useEffect(() => {
    loadMentorBookings();
  }, []);

  const loadMentorBookings = async () => {
    try {
      const response = await api.get('/bookings');
      const bookings = response.data.data;

      const now = DateTime.now().setZone(user?.timezone || 'UTC');
      const todayStart = now.startOf('day');
      const todayEnd = now.endOf('day');

      const today = bookings.filter((b: Booking) => {
        const bookingTime = DateTime.fromISO(b.startTimeUtc, { zone: 'utc' })
          .setZone(user?.timezone || 'UTC');
        return (
          b.status === 'CONFIRMED' &&
          bookingTime >= todayStart &&
          bookingTime <= todayEnd
        );
      });

      const upcoming = bookings
        .filter((b: Booking) => {
          const bookingTime = DateTime.fromISO(b.startTimeUtc, { zone: 'utc' });
          return b.status === 'CONFIRMED' && bookingTime > todayEnd;
        })
        .sort((a: Booking, b: Booking) =>
          new Date(a.startTimeUtc).getTime() - new Date(b.startTimeUtc).getTime()
        );

      setTodayBookings(today);
      setUpcomingBookings(upcoming);
      setDailyCapacity({ current: today.length, max: 2 });
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (utcTime: string, timezone: string) => {
    return DateTime.fromISO(utcTime, { zone: 'utc' })
      .setZone(timezone)
      .toFormat('hh:mm a ZZZZ');
  };

  const formatDate = (utcTime: string, timezone: string) => {
    return DateTime.fromISO(utcTime, { zone: 'utc' })
      .setZone(timezone)
      .toFormat('MMM dd, yyyy');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-200">
                CY
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                CODEYOUNG
              </span>
              <span className="ml-2 text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                Mentor Portal
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">
                {user?.email} ({user?.timezone})
              </span>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-600 font-medium transition"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.mentorProfile?.firstName || 'Mentor'}! 👋
          </h1>
          <p className="mt-2 text-gray-600">
            View your assigned trial classes and manage your daily teaching capacity.
          </p>
        </div>

        {/* Capacity Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl shadow-lg p-6 mb-8 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h2 className="text-lg font-semibold text-indigo-100 mb-1">
              Today's Trial Class Capacity (Mentor Local Timezone: {user?.timezone})
            </h2>
            <p className="text-sm text-indigo-200">
              {dailyCapacity.current < dailyCapacity.max
                ? `You have ${dailyCapacity.max - dailyCapacity.current} trial slot(s) available for new bookings today.`
                : 'Maximum 2 trial classes reached for today.'}
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-xl border border-white/30 text-center">
            <span className="text-xs font-medium uppercase tracking-wider text-indigo-100 block">Booked / Capacity</span>
            <span className="text-2xl font-black">{dailyCapacity.current} / {dailyCapacity.max}</span>
          </div>
        </motion.div>

        {/* Today's Classes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">
              Today's Classes
            </h2>
          </div>
          {loading ? (
            <div className="px-6 py-12 text-center text-gray-500">Loading...</div>
          ) : todayBookings.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No trial classes scheduled for today.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {todayBookings.map((booking) => (
                <div key={booking.id} className="px-6 py-4 hover:bg-gray-50 transition flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      {booking.course?.name || 'Trial Class'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Student: <strong>{booking.childName}</strong> (Age {booking.childAge}, Grade {booking.childGrade})
                    </p>
                    <p className="text-sm text-indigo-600 font-medium mt-1">
                      ⏰ {formatTime(booking.startTimeUtc, user?.timezone || 'UTC')}
                    </p>
                  </div>
                  {booking.meetingUrl && (
                    <a
                      href={booking.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
                    >
                      <Video className="w-4 h-4" /> Start Meeting
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Classes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">
              Upcoming Classes
            </h2>
          </div>
          {loading ? (
            <div className="px-6 py-12 text-center text-gray-500">Loading...</div>
          ) : upcomingBookings.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No upcoming classes scheduled.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="px-6 py-4 hover:bg-gray-50 transition">
                  <h3 className="font-bold text-gray-900">
                    {booking.course?.name || 'Trial Class'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Student: {booking.childName} (Age {booking.childAge}, Grade {booking.childGrade})
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    📅 {formatDate(booking.startTimeUtc, user?.timezone || 'UTC')} at {formatTime(booking.startTimeUtc, user?.timezone || 'UTC')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorDashboardPage;
