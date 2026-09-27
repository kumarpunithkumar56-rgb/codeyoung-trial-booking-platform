import { useState } from 'react';
import { motion } from 'framer-motion';
import { Baby, ArrowRight } from 'lucide-react';

interface Props {
  data: any;
  onNext: (data: any) => void;
}

const ChildDetailsStep = ({ data, onNext }: Props) => {
  const [formData, setFormData] = useState({
    childName: data.childName || '',
    childAge: data.childAge || '',
    childGrade: data.childGrade || '',
  });

  const [errors, setErrors] = useState<any>({});

  const validate = () => {
    const newErrors: any = {};
    
    if (!formData.childName.trim()) {
      newErrors.childName = 'Child name is required';
    }
    
    if (!formData.childAge || formData.childAge < 4 || formData.childAge > 18) {
      newErrors.childAge = 'Age must be between 4 and 18';
    }
    
    if (!formData.childGrade.trim()) {
      newErrors.childGrade = 'Grade is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext(formData);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl shadow-xl p-8 max-w-2xl mx-auto"
    >
      <div className="mb-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl mb-4"
        >
          <Baby className="w-8 h-8 text-indigo-600" />
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Tell us about your child
        </h2>
        <p className="text-gray-600">
          We'll personalize the trial class experience
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="childName" className="block text-sm font-medium text-gray-700 mb-2">
            Child's Name
          </label>
          <input
            id="childName"
            type="text"
            value={formData.childName}
            onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
            className={`w-full px-4 py-3 rounded-xl border ${
              errors.childName ? 'border-red-300' : 'border-gray-300'
            } focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition`}
            placeholder="Enter child's full name"
          />
          {errors.childName && (
            <p className="mt-1 text-sm text-red-600">{errors.childName}</p>
          )}
        </div>

        <div>
          <label htmlFor="childAge" className="block text-sm font-medium text-gray-700 mb-2">
            Age
          </label>
          <input
            id="childAge"
            type="number"
            min="4"
            max="18"
            value={formData.childAge}
            onChange={(e) => setFormData({ ...formData, childAge: parseInt(e.target.value) })}
            className={`w-full px-4 py-3 rounded-xl border ${
              errors.childAge ? 'border-red-300' : 'border-gray-300'
            } focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition`}
            placeholder="Age (4-18)"
          />
          {errors.childAge && (
            <p className="mt-1 text-sm text-red-600">{errors.childAge}</p>
          )}
        </div>

        <div>
          <label htmlFor="childGrade" className="block text-sm font-medium text-gray-700 mb-2">
            Grade/Class
          </label>
          <input
            id="childGrade"
            type="text"
            value={formData.childGrade}
            onChange={(e) => setFormData({ ...formData, childGrade: e.target.value })}
            className={`w-full px-4 py-3 rounded-xl border ${
              errors.childGrade ? 'border-red-300' : 'border-gray-300'
            } focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition`}
            placeholder="e.g., Grade 5, 10th Standard"
          />
          {errors.childGrade && (
            <p className="mt-1 text-sm text-red-600">{errors.childGrade}</p>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
        >
          Continue
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </form>
    </motion.div>
  );
};

export default ChildDetailsStep;
