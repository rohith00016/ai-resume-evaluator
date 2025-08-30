import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import FeedbackList from "./FeedbackList";

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to Your Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              Submit Resume
            </h3>
            <p className="text-green-700 text-sm mb-3">
              Upload your resume for AI-powered evaluation and feedback.
            </p>
            <Link
              to="/submit-resume"
              className="inline-block bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Submit Resume
            </Link>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
            <h3 className="text-lg font-semibold text-purple-900 mb-2">
              Submit Portfolio
            </h3>
            <p className="text-purple-700 text-sm mb-3">
              Submit your portfolio URL for comprehensive evaluation.
            </p>
            <Link
              to="/submit-portfolio"
              className="inline-block bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              Submit Portfolio
            </Link>
          </div>

          {user?.role === "admin" && (
            <>
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Submissions
                </h3>
                <p className="text-red-700 text-sm mb-3">
                  Access admin features and manage all submissions.
                </p>
                <Link
                  to="/admin/list"
                  className="inline-block bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  View Submissions
                </Link>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                <h3 className="text-lg font-semibold text-orange-900 mb-2">
                  User Management
                </h3>
                <p className="text-orange-700 text-sm mb-3">
                  Manage user roles and promote users to admin.
                </p>
                <Link
                  to="/admin/management"
                  className="inline-block bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700 transition-colors"
                >
                  Manage Users
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Submissions List */}
      <FeedbackList />
    </div>
  );
};

export default Dashboard;
