import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight, ArrowLeft } from 'lucide-react';
import { DateTime } from 'luxon';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Props {
  data: any;
  onNext: (data: any) => void;
  onBack?: () => void;
  userTimezone: string;
}

const DateTimeSelectionStep = ({ data, onNext, onBack, userTimezone }: Props) => {
  const [selectedDate, setSelectedDate] = useState(data.date || '');
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const getNextDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = DateTime.now().plus({ days: i });
      days.push({
        date: date.toISODate(),
        display: date.toFormat('EEE, MMM d'),
        isToday: i === 0,
      });
    }
    return days;
  };

  const handleDateSelect = async (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setLoading(true);

    try {
      const response = await api.get('/availability/slots', {
        params: {
          date,
          subjectId: data.courseId,
          timezone: userTimezone,
        },
      });
      setAvailableSlots(response.data.data);
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error('No mentors available for this date. Please try another date.');
        setAvailableSlots([]);
      } else {
        toast.error('Failed to load available slots');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (slot: any) => {
    setSelectedSlot(slot);
  };

  const handleContinue = () => {
    if (selectedSlot) {
      onNext({
        date: selectedDate,
        slotStartUtc: selectedSlot.startTimeUtc,
        slotEndUtc: selectedSlot.endTimeUtc,
        slotStartLocal: selectedSlot.startTimeLocal,
        slotEndLocal: selectedSlot.endTimeLocal,
      });
    }
  };

  const days = getNextDays();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Pick a convenient time
        </h2>
        <p className="text-gray-600">
          Times shown in your local timezone ({userTimezone})
        </p>
      </div>

      {/* Date Selection */}
      <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-900">Select a date</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {days.map((day, index) => (
            <motion.button
              key={day.date}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleDateSelect(day.date!)}
              className={`p-4 rounded-xl text-center transition ${
                selectedDate === day.date
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="text-sm font-medium">{day.display}</div>
              {day.isToday && (
                <div className="text-xs mt-1 opacity-75">Today</div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-gray-900">Select a time slot</h3>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">
                No available time slots for this date
              </p>
              <p className="text-sm text-gray-500">
                Please try another date
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {availableSlots.map((slot, index) => {
                const isSelected = selectedSlot?.startTimeUtc === slot.startTimeUtc;
                const startTime = DateTime.fromISO(slot.startTimeLocal).toFormat('h:mm a');

                return (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSlotSelect(slot)}
                    className={`p-4 rounded-xl text-center font-medium transition ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {startTime}
                  </motion.button>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Navigation */}
      <div className="flex gap-4 mt-8">
        {onBack && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onBack}
            className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </motion.button>
        )}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleContinue}
          disabled={!selectedSlot}
          className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default DateTimeSelectionStep;
