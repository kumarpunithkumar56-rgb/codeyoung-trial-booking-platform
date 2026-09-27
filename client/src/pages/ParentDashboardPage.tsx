import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, Clock, Video, Plus, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Booking } from '../types';
import { DateTime } from 'luxon';

const ParentDashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUpcomingBookings();
  }, []);

  const loadUpcomingBookings = async () => {
    try {
      const response = await api.get('/bookings');
      const bookings = response.data.data;

      const upcoming = bookings
        .filter((b: Booking) => b.status === 'CONFIRMED')
        .sort((a: Booking, b: Booking) =>
          new Date(a.startTimeUtc).getTime() - new Date(b.startTimeUtc).getTime()
        );

      setUpcomingBookings(upcoming);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (utcTime: string, timezone: string) => {
    return DateTime.fromISO(utcTime, { zone: 'utc' })
      .setZone(timezone)
      .toFormat('EEEE, MMMM d, yyyy • h:mm a ZZZZ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50">
      {/* Top Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-200">
                CY
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                CODEYOUNG
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full">
                {user?.parentProfile?.firstName || 'Parent'} ({user?.timezone})
              </span>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-600 transition font-medium"
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
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Welcome back, {user?.parentProfile?.firstName || 'Parent'}! 👋
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your child's STEM & coding trial class bookings.
          </p>
        </motion.div>

        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-3xl shadow-xl p-8 mb-10 text-white"
        >
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-md mb-4">
              <Sparkles className="w-3.5 h-3.5" /> 100% Free 1-on-1 Trial Class
            </span>
            <h2 className="text-3xl font-extrabold mb-3">
              Book a Free 45-Minute Trial Class
            </h2>
            <p className="text-indigo-100 text-base mb-6 leading-relaxed">
              Explore Coding, Web Development, Python, Math, Science & Robotics with our expert 1-on-1 mentors.
            </p>
            <Link
              to="/book-trial"
              className="inline-flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 px-6 py-3.5 rounded-xl font-bold shadow-lg transition transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              Book Free Trial Now
            </Link>
          </div>
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        </motion.div>

        {/* Classes List */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-900">
                Your Scheduled Trial Classes
              </h2>
            </div>
            <Link
              to="/book-trial"
              className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              <Plus className="w-4 h-4" /> Book Another
            </Link>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent mb-2" />
              <p>Loading your classes...</p>
            </div>
          ) : upcomingBookings.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No upcoming classes scheduled</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                Ready to inspire your child? Schedule a free 1-on-1 trial class today!
              </p>
              <Link
                to="/book-trial"
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition"
              >
                <Plus className="w-5 h-5" /> Book Free Trial
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="p-6 hover:bg-gray-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-gray-900">
                        {booking.course?.name || 'Trial Class'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Student: <strong className="text-gray-900">{booking.childName}</strong> (Age {booking.childAge}, Grade {booking.childGrade})
                    </p>
                    <p className="text-sm text-indigo-700 font-medium">
                      📅 {formatDateTime(booking.startTimeUtc, booking.parentTimezone)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {booking.meetingUrl && (
                      <a
                        href={booking.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-sm"
                      >
                        <Video className="w-4 h-4" /> Join Class
                      </a>
                    )}
                    <Link
                      to={`/booking-confirmation/${booking.id}`}
                      className="px-4 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl text-sm font-semibold transition"
                    >
                      View Receipt
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentDashboardPage;
