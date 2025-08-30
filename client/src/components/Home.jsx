import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import {
  FileText,
  Globe,
  Star,
  Shield,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center py-16">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          AI Resume Evaluator
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Get instant, AI-powered feedback on your resume and portfolio. Improve
          your job applications with professional insights and scoring.
        </p>

        {!isAuthenticated ? (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Sign In
            </Link>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/dashboard"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              to="/submit-resume"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Submit Resume
            </Link>
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Why Choose AI Resume Evaluator?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Resume Analysis
            </h3>
            <p className="text-gray-600">
              Upload your resume and get detailed feedback on content,
              structure, and presentation with AI-powered scoring.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Globe className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Portfolio Evaluation
            </h3>
            <p className="text-gray-600">
              Submit your portfolio URL and receive comprehensive feedback on
              design, functionality, and user experience.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Star className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Instant Scoring
            </h3>
            <p className="text-gray-600">
              Get immediate scores out of 10 for both resume and portfolio with
              actionable improvement suggestions.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16 bg-white rounded-lg shadow-sm">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          How It Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="bg-gray-100 rounded-full p-4 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              <span className="text-lg font-bold text-gray-700">1</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Sign Up
            </h3>
            <p className="text-gray-600 text-sm">
              Create your account to start evaluating your materials
            </p>
          </div>

          <div className="text-center">
            <div className="bg-gray-100 rounded-full p-4 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              <span className="text-lg font-bold text-gray-700">2</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload</h3>
            <p className="text-gray-600 text-sm">
              Submit your resume (PDF) or portfolio URL for analysis
            </p>
          </div>

          <div className="text-center">
            <div className="bg-gray-100 rounded-full p-4 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              <span className="text-lg font-bold text-gray-700">3</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Analyze
            </h3>
            <p className="text-gray-600 text-sm">
              Our AI evaluates your materials and provides detailed feedback
            </p>
          </div>

          <div className="text-center">
            <div className="bg-gray-100 rounded-full p-4 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              <span className="text-lg font-bold text-gray-700">4</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Improve
            </h3>
            <p className="text-gray-600 text-sm">
              Use the feedback to enhance your resume and portfolio
            </p>
          </div>
        </div>
      </div>

      {/* Course Support Section */}
      <div className="py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Supporting Multiple Courses
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-blue-50 rounded-lg p-6 text-center">
            <h3 className="text-xl font-semibold text-blue-900 mb-2">
              MERN Stack
            </h3>
            <p className="text-blue-700">
              Full-stack development with MongoDB, Express, React, and Node.js
            </p>
          </div>

          <div className="bg-purple-50 rounded-lg p-6 text-center">
            <h3 className="text-xl font-semibold text-purple-900 mb-2">
              UX/UI Design
            </h3>
            <p className="text-purple-700">
              User experience and interface design principles and practices
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-6 text-center">
            <h3 className="text-xl font-semibold text-green-900 mb-2">
              DevOps
            </h3>
            <p className="text-green-700">
              Development operations, CI/CD, and infrastructure management
            </p>
          </div>
        </div>
      </div>

      {/* Security & Privacy Section */}
      <div className="py-16 bg-gray-50 rounded-lg">
        <div className="text-center max-w-3xl mx-auto">
          <div className="bg-white rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Shield className="w-8 h-8 text-gray-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Secure & Private
          </h2>
          <p className="text-gray-600 mb-6">
            Your data is protected with industry-standard security measures. We
            never share your personal information or evaluation results.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              Encrypted data transmission
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              Secure file storage
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              Privacy protection
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      {!isAuthenticated && (
        <div className="py-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Improve Your Career Materials?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of professionals who have enhanced their resumes and
            portfolios
          </p>
          <Link
            to="/register"
            className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Start Your Free Evaluation
            <ArrowRight className="ml-2 w-6 h-6" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default Home;
