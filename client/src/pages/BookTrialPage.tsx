import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

import ChildDetailsStep from '../components/booking/ChildDetailsStep';
import SubjectSelectionStep from '../components/booking/SubjectSelectionStep';
import DateTimeSelectionStep from '../components/booking/DateTimeSelectionStep';
import MentorSelectionStep from '../components/booking/MentorSelectionStep';
import ReviewConfirmStep from '../components/booking/ReviewConfirmStep';

interface BookingData {
  childName: string;
  childAge: number | '';
  childGrade: string;
  courseId: string;
  courseName: string;
  date: string;
  slotStartUtc: string;
  slotEndUtc: string;
  slotStartLocal: string;
  slotEndLocal: string;
  mentorId?: string;
  mentorName?: string;
}

const STEPS = [
  { id: 1, name: 'Child Details', component: ChildDetailsStep },
  { id: 2, name: 'Subject', component: SubjectSelectionStep },
  { id: 3, name: 'Schedule', component: DateTimeSelectionStep },
  { id: 4, name: 'Mentor', component: MentorSelectionStep },
  { id: 5, name: 'Review', component: ReviewConfirmStep },
];

const BookTrialPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState<Partial<BookingData>>({});
  const [loading, setLoading] = useState(false);

  const handleNext = (stepData: any) => {
    setBookingData((prev) => ({ ...prev, ...stepData }));
    
    if (currentStep < STEPS.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleConfirmBooking = async () => {
    setLoading(true);
    try {
      const response = await api.post('/bookings', {
        courseId: bookingData.courseId,
        childName: bookingData.childName,
        childAge: bookingData.childAge,
        childGrade: bookingData.childGrade,
        startTimeUtc: bookingData.slotStartUtc,
        endTimeUtc: bookingData.slotEndUtc,
        parentTimezone: user?.timezone,
        mentorId: bookingData.mentorId,
      });

      toast.success('Trial class booked successfully!');
      navigate(`/booking-confirmation/${response.data.data.id}`);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to book trial class';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const CurrentStepComponent = STEPS[currentStep - 1].component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Dashboard</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900">CODEYOUNG</h1>
            <div className="w-32" /> {/* Spacer for centering */}
          </div>
        </div>
      </nav>

      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <motion.div
                  initial={false}
                  animate={{
                    scale: currentStep === step.id ? 1.1 : 1,
                    backgroundColor:
                      currentStep > step.id
                        ? '#4f46e5'
                        : currentStep === step.id
                        ? '#4f46e5'
                        : '#e5e7eb',
                  }}
                  className="relative flex items-center justify-center w-10 h-10 rounded-full text-white font-semibold"
                >
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.id
                  )}
                </motion.div>
                {index < STEPS.length - 1 && (
                  <div className="flex-1 h-1 mx-2 bg-gray-200 rounded">
                    <motion.div
                      initial={false}
                      animate={{
                        width: currentStep > step.id ? '100%' : '0%',
                      }}
                      transition={{ duration: 0.3 }}
                      className="h-full bg-indigo-600 rounded"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex-1 text-center font-medium ${
                  currentStep === step.id
                    ? 'text-indigo-600'
                    : currentStep > step.id
                    ? 'text-gray-900'
                    : 'text-gray-400'
                }`}
              >
                {step.name}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <CurrentStepComponent
              data={bookingData}
              onNext={handleNext}
              onBack={currentStep > 1 ? handleBack : undefined}
              onConfirm={currentStep === STEPS.length ? handleConfirmBooking : undefined}
              loading={loading}
              userTimezone={user?.timezone || 'UTC'}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BookTrialPage;
