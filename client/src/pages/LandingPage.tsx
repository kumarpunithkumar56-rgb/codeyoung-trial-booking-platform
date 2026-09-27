import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-primary-600">Codeyoung</div>
          <div className="space-x-4">
            <Link to="/login" className="text-gray-600 hover:text-gray-900">Login</Link>
            <Link to="/signup" className="btn-primary">Sign Up</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Give your child a first step into their next big idea
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Book a free 1:1 trial class with an expert mentor
        </p>
        <Link to="/signup" className="btn-primary text-lg px-8 py-3">
          Book Free Trial
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid md:grid-cols-3 gap-8">
        <div className="card text-center">
          <h3 className="text-xl font-semibold mb-2">Coding</h3>
          <p className="text-gray-600">Learn programming from scratch</p>
        </div>
        <div className="card text-center">
          <h3 className="text-xl font-semibold mb-2">Web Development</h3>
          <p className="text-gray-600">Build websites and apps</p>
        </div>
        <div className="card text-center">
          <h3 className="text-xl font-semibold mb-2">Robotics</h3>
          <p className="text-gray-600">Design and program robots</p>
        </div>
      </div>
    </div>
  );
}
