import { motion } from 'framer-motion';
import { Calendar, Clock, User, BookOpen, Globe, ArrowLeft, Check } from 'lucide-react';
import { DateTime } from 'luxon';

interface Props {
  data: any;
  onConfirm?: () => void;
  onBack?: () => void;
  loading?: boolean;
  userTimezone: string;
}

const ReviewConfirmStep = ({ data, onConfirm, onBack, loading, userTimezone }: Props) => {
  const formatTime = (isoTime: string) => {
    return DateTime.fromISO(isoTime).toFormat('h:mm a');
  };

  const formatDate = (dateString: string) => {
    return DateTime.fromISO(dateString).toFormat('EEEE, MMMM d, yyyy');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white rounded-3xl shadow-xl p-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Review your booking
          </h2>
          <p className="text-gray-600">
            Please confirm all details are correct
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Student</div>
              <div className="font-semibold text-gray-900">
                {data.childName}, Age {data.childAge}, {data.childGrade}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Subject</div>
              <div className="font-semibold text-gray-900">{data.courseName}</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-600">Date & Time</div>
              <div className="font-semibold text-gray-900">
                {formatDate(data.date)}
              </div>
              <div className="text-sm text-gray-700 mt-1">
                {formatTime(data.slotStartLocal)} - {formatTime(data.slotEndLocal)}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Your Timezone</div>
              <div className="font-semibold text-gray-900">{userTimezone}</div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-1" />
            <div className="text-sm text-indigo-900">
              <strong>Important:</strong> Your trial class is 45 minutes long. Please join 5 minutes early to ensure a smooth start.
            </div>
          </div>
        </motion.div>

        <div className="flex gap-4">
          {onBack && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onBack}
              disabled={loading}
              className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Confirm Booking
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ReviewConfirmStep;
