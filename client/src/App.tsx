import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ParentDashboardPage from './pages/ParentDashboardPage'
import MentorDashboardPage from './pages/MentorDashboardPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import BookTrialPage from './pages/BookTrialPage'
import BookingConfirmationPage from './pages/BookingConfirmationPage'

const ProtectedRoute = ({ children, roles }: { children: React.ReactNode; roles?: string[] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              }
            />
            <Route
              path="/book-trial"
              element={
                <ProtectedRoute roles={['PARENT']}>
                  <BookTrialPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/booking-confirmation/:id"
              element={
                <ProtectedRoute>
                  <BookingConfirmationPage />
                </ProtectedRoute>
              }
            />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

const DashboardRouter = () => {
  const { user } = useAuth();

  if (user?.role === 'PARENT') return <ParentDashboardPage />;
  if (user?.role === 'MENTOR') return <MentorDashboardPage />;
  if (user?.role === 'ADMIN') return <AdminDashboardPage />;

  return <Navigate to="/" />;
};

export default App
