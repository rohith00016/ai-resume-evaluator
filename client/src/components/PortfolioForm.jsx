import { useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import { showErrorToast } from "../utils/errorHandler";
import { FormattedFeedback } from "../utils/formatFeedback";

const PortfolioForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    course: "",
    portfolioUrl: "",
    feedbackEmail: "",
  });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const { token, role } = useSelector((state) => ({
    token: state.auth.token,
    role: state.auth.user?.role,
  }));

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateUrl(formData.portfolioUrl)) {
      toast.error("Please enter a valid URL");
      return;
    }

    if (role === "admin" && !formData.feedbackEmail) {
      toast.error("Feedback email is required for admin users");
      return;
    }

    setLoading(true);
    setFeedback(null);

    const doSubmit = async () => {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/portfolios`,
        formData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response;
    };

    try {
      const loadingToast = toast.loading("Analyzing your portfolio...");
      const response = await doSubmit();
      toast.dismiss(loadingToast);
      // Success handled silently - no toast

      setFeedback(response.data.learner);
      setFormData({
        name: "",
        course: "",
        portfolioUrl: "",
        feedbackEmail: "",
      });
    } catch (error) {
      showErrorToast(error, "Failed to submit portfolio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Form Section */}
      <div className="bg-white shadow-lg rounded-xl p-8 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Submit Portfolio for Evaluation
        </h1>
        <p className="text-gray-600 mb-6">
          Submit your portfolio URL to receive AI-powered feedback and scoring
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label
                htmlFor="course"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Course *
              </label>
              <select
                id="course"
                name="course"
                value={formData.course}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a course</option>
                <option value="MERN">MERN Stack</option>
                <option value="UXUI">UX/UI Design</option>
                <option value="Devops">DevOps</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="portfolioUrl"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Portfolio URL *
            </label>
            <input
              type="url"
              id="portfolioUrl"
              name="portfolioUrl"
              value={formData.portfolioUrl}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="https://your-portfolio-website.com"
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter the URL of your deployed portfolio website
            </p>
          </div>

          {role === "admin" && (
            <div>
              <label
                htmlFor="feedbackEmail"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Feedback Email Address *
              </label>
              <input
                type="email"
                id="feedbackEmail"
                name="feedbackEmail"
                value={formData.feedbackEmail}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email address for feedback"
              />
              <p className="mt-1 text-sm text-gray-500">
                As an admin, you must provide an email address where feedback
                will be sent
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Analyzing Portfolio...
              </div>
            ) : (
              "Submit Portfolio for Evaluation"
            )}
          </button>
        </form>
      </div>

      {/* Results Section */}
      {feedback && (
        <div className="bg-white border-2 border-gray-200 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            AI Evaluation Results
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-medium text-gray-800 mb-3">
                Portfolio Score
              </h3>
              <div className="flex items-center">
                <div className="text-4xl font-bold text-gray-700 mr-4">
                  {feedback.portfolioScore}/10
                </div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gray-600 h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${(feedback.portfolioScore / 10) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-medium text-gray-800 mb-3">
                Portfolio URL
              </h3>
              <a
                href={feedback.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline break-all font-medium"
              >
                Visit Portfolio
              </a>
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Detailed Feedback
            </h3>
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <FormattedFeedback feedback={feedback.portfolioFeedback} />
            </div>
          </div>
          <div className="mt-6 text-sm text-gray-700 bg-white rounded-lg p-4 border border-gray-200">
            <p>
              <strong>Submitted:</strong>{" "}
              {new Date(feedback.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioForm;
