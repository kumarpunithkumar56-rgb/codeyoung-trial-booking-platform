import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, TrendingUp, UserCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Booking } from '../types';
import { DateTime } from 'luxon';

const AdminDashboardPage = () => {
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    todayBookings: 0,
    activeMentors: 0,
    mentorsAtCapacity: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await api.get('/bookings');
      const allBookings = response.data.data;
      
      setBookings(allBookings.slice(0, 10));
      
      const today = DateTime.now().startOf('day');
      const todayBookings = allBookings.filter((b: Booking) => {
        const bookingDate = DateTime.fromISO(b.startTimeUtc, { zone: 'utc' });
        return bookingDate >= today && bookingDate < today.plus({ days: 1 });
      });
      
      setStats({
        totalBookings: allBookings.length,
        todayBookings: todayBookings.length,
        activeMentors: 10, // From seed data
        mentorsAtCapacity: 0, // Would need to calculate from bookings
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (utcTime: string) => {
    return DateTime.fromISO(utcTime, { zone: 'utc' })
      .setZone(user?.timezone || 'UTC')
      .toFormat('MMM dd, yyyy • hh:mm a');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const StatCard = ({ title, value, icon: Icon, delay }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <motion.p
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.2, type: 'spring', stiffness: 200 }}
            className="text-3xl font-bold text-gray-900 mt-2"
          >
            {value}
          </motion.p>
        </div>
        <div className="bg-indigo-50 p-3 rounded-xl">
          <Icon className="w-6 h-6 text-indigo-600" />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">CODEYOUNG</h1>
              <span className="ml-4 text-sm text-gray-500">Admin Dashboard</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={logout}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-gray-600 mt-2">Monitor trial class bookings and system activity</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Bookings"
            value={stats.totalBookings}
            icon={Calendar}
            delay={0}
          />
          <StatCard
            title="Today's Bookings"
            value={stats.todayBookings}
            icon={TrendingUp}
            delay={0.1}
          />
          <StatCard
            title="Active Mentors"
            value={stats.activeMentors}
            icon={UserCheck}
            delay={0.2}
          />
          <StatCard
            title="Mentors at Capacity"
            value={stats.mentorsAtCapacity}
            icon={Users}
            delay={0.3}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-gray-500">
              Loading...
            </div>
          ) : bookings.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No bookings yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Child
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bookings.map((booking, index) => (
                    <motion.tr
                      key={booking.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {booking.id.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {booking.childName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {booking.course?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDateTime(booking.startTimeUtc)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
