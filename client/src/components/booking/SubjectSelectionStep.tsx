import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Code, Laptop, Calculator, Beaker, Bot, BookOpen, ArrowRight, ArrowLeft } from 'lucide-react';
import api from '../../services/api';

const SUBJECT_ICONS: any = {
  'Coding Basics': Code,
  'Python': Code,
  'Web Development': Laptop,
  'Math': Calculator,
  'Science': Beaker,
  'Robotics': Bot,
};

interface Props {
  data: any;
  onNext: (data: any) => void;
  onBack?: () => void;
}

const SubjectSelectionStep = ({ data, onNext, onBack }: Props) => {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState(data.courseId || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const response = await api.get('/courses');
      setCourses(response.data.data);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (course: any) => {
    setSelectedCourse(course.id);
  };

  const handleContinue = () => {
    if (selectedCourse) {
      const course = courses.find((c) => c.id === selectedCourse);
      onNext({
        courseId: selectedCourse,
        courseName: course?.name,
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Choose a subject
        </h2>
        <p className="text-gray-600">
          Select what your child is excited to learn
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {courses.map((course, index) => {
              const Icon = SUBJECT_ICONS[course.name] || BookOpen;
              const isSelected = selectedCourse === course.id;

              return (
                <motion.button
                  key={course.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelect(course)}
                  className={`relative bg-white rounded-2xl p-6 text-left transition-all ${
                    isSelected
                      ? 'ring-4 ring-indigo-500 shadow-xl'
                      : 'hover:shadow-lg border border-gray-200'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-4 right-4 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </motion.div>
                  )}
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${
                    isSelected ? 'bg-indigo-100' : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-6 h-6 ${isSelected ? 'text-indigo-600' : 'text-gray-600'}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {course.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {course.description}
                  </p>
                </motion.button>
              );
            })}
          </div>

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
              onClick={handleContinue}
              disabled={!selectedCourse}
              className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default SubjectSelectionStep;
