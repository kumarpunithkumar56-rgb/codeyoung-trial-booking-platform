import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Calendar, Clock, Video, ArrowRight, Sparkles } from 'lucide-react';
import { DateTime } from 'luxon';
import api from '../services/api';
import { Booking } from '../types';

const BookingConfirmationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadBooking(id);
    }
  }, [id]);

  const loadBooking = async (bookingId: string) => {
    try {
      const response = await api.get(`/bookings/${bookingId}`);
      setBooking(response.data.data);
    } catch (error) {
      console.error('Failed to load booking:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Booking not found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 text-indigo-600 hover:text-indigo-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const formatDateTime = (utcTime: string, timezone: string) => {
    return DateTime.fromISO(utcTime, { zone: 'utc' })
      .setZone(timezone)
      .toFormat('EEEE, MMMM d, yyyy • h:mm a ZZZZ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-4 relative">
            <CheckCircle className="w-12 h-12 text-green-600" />
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 0] }}
              transition={{ duration: 1, repeat: 3, delay: 0.5 }}
              className="absolute inset-0 rounded-full bg-green-400"
            />
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              You're all set! 🎉
            </h1>
            <p className="text-lg text-gray-600">
              Your trial class is confirmed
            </p>
          </motion.div>
        </motion.div>

        {/* Booking Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-3xl shadow-xl p-8 mb-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Class Details
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Your local time</div>
                <div className="font-semibold text-gray-900">
                  {formatDateTime(booking.startTimeUtc, booking.parentTimezone)}
                </div>
              </div>
            </div>

            {booking.mentorTimezone && booking.mentorTimezone !== booking.parentTimezone && (
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Mentor's local time</div>
                  <div className="font-semibold text-gray-900">
                    {formatDateTime(booking.startTimeUtc, booking.mentorTimezone)}
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600 mb-2">Student</div>
              <div className="font-semibold text-gray-900">
                {booking.childName}, Age {booking.childAge}, {booking.childGrade}
              </div>
            </div>

            <div className="text-sm text-gray-600 mb-2">Subject</div>
            <div className="font-semibold text-gray-900">
              {booking.course?.name}
            </div>

            <div className="text-sm text-gray-600 mb-2">Booking ID</div>
            <div className="font-mono text-sm text-gray-700">
              {booking.id}
            </div>
          </div>

          {/* Meeting Link */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-6 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl"
          >
            <div className="flex items-start gap-3 mb-4">
              <Video className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-1" />
              <div>
                <div className="font-semibold text-gray-900 mb-1">
                  Join your trial class
                </div>
                <div className="text-sm text-gray-600">
                  Click the button below when it's time for your class
                </div>
              </div>
            </div>
            <a
              href={booking.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition text-center"
            >
              Join Trial Class
            </a>
          </motion.div>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/book-trial')}
            className="flex-1 bg-white border-2 border-indigo-600 text-indigo-600 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition"
          >
            Book Another Trial
          </motion.button>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/dashboard')}
            className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
          >
            Go to Dashboard
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationPage;
