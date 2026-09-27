import { motion } from 'framer-motion';
import { UserCheck, ArrowRight, ArrowLeft, Award, Sparkles } from 'lucide-react';

interface Props {
  data: any;
  onNext: (data: any) => void;
  onBack?: () => void;
}

const MentorSelectionStep = ({ data, onNext, onBack }: Props) => {
  const handleAutoMatch = () => {
    onNext({
      mentorId: data.mentorId || undefined,
      mentorName: data.mentorName || 'Auto-matched Expert Mentor',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white rounded-3xl shadow-xl p-8">
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl mb-4"
          >
            <UserCheck className="w-8 h-8 text-indigo-600" />
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Mentor Assignment
          </h2>
          <p className="text-gray-600">
            We match your child with top-rated STEM educators tailored to their time slot.
          </p>
        </div>

        {data.mentorName ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 mb-8 border-2 border-indigo-200"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-md">
                {data.mentorName.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 text-lg">{data.mentorName}</span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full">
                    <Award className="w-3 h-3" /> Verified Instructor
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Assigned for your selected date & time slot.
                </p>
                <div className="mt-3 text-xs text-indigo-900 font-medium bg-white/70 backdrop-blur-sm p-3 rounded-xl">
                  ✨ Expert in 1-on-1 trial classes, concept clarity, and interactive coding instruction.
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 mb-8"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">
                  Smart Mentor Matching Enabled
                </h3>
                <p className="text-sm text-gray-600">
                  Our algorithm automatically pairs your child with the best available mentor based on:
                </p>
                <ul className="mt-2 text-sm text-gray-600 space-y-1 font-medium">
                  <li>✓ Subject specialization</li>
                  <li>✓ Real-time slot availability</li>
                  <li>✓ Student age & grade level</li>
                  <li>✓ Automatic timezone conversion</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex gap-4">
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
            onClick={handleAutoMatch}
            className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
          >
            Continue to Review
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default MentorSelectionStep;
