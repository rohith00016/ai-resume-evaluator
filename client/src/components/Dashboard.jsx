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
          <Link
            to="/submit-resume"
            className="bg-white border border-gray-200 rounded-md p-4 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer block"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Submit Resume
            </h3>
            <p className="text-gray-600 text-sm">
              Upload your resume for AI-powered evaluation and feedback.
            </p>
          </Link>

          <Link
            to="/submit-portfolio"
            className="bg-white border border-gray-200 rounded-md p-4 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer block"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Submit Portfolio
            </h3>
            <p className="text-gray-600 text-sm">
              Submit your portfolio URL for comprehensive evaluation.
            </p>
          </Link>

          {user?.role === "admin" && (
            <>
              <Link
                to="/admin/list"
                className="bg-white border border-gray-200 rounded-md p-4 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer block"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Submissions
                </h3>
                <p className="text-gray-600 text-sm">
                  Access admin features and manage all submissions.
                </p>
              </Link>
              <Link
                to="/admin/management"
                className="bg-white border border-gray-200 rounded-md p-4 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer block"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  User Management
                </h3>
                <p className="text-gray-600 text-sm">
                  Manage user roles and promote users to admin.
                </p>
              </Link>
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
