import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchEvaluations, sendFeedbackEmail } from "../features/resumeSlice";
import {
  Mail,
  ExternalLink,
  Calendar,
  Star,
  User,
  AlertCircle,
} from "lucide-react";

const LearnerList = () => {
  const dispatch = useDispatch();
  const { evaluations, loading, error } = useSelector((state) => state.resume);

  useEffect(() => {
    dispatch(fetchEvaluations());
  }, [dispatch]);

  const handleSendEmail = (evaluationId) => {
    dispatch(sendFeedbackEmail(evaluationId));
  };

  const getScoreColor = (score) => {
    if (score >= 8) return "text-green-600 bg-green-100";
    if (score >= 6) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Resume Evaluations
          </h2>
          <p className="text-gray-600 mt-1">
            {evaluations.length} evaluation{evaluations.length !== 1 ? "s" : ""}{" "}
            found
          </p>
        </div>

        {evaluations.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 text-lg">No evaluations found.</p>
            <p className="text-gray-400 mt-2">
              Submit a resume to see evaluations here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {evaluations.map((evaluation) => (
              <div
                key={evaluation._id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="font-medium text-gray-900">
                          {evaluation.name}
                        </span>
                      </div>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">{evaluation.email}</span>
                    </div>

                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex items-center space-x-2">
                        {evaluation.resumeScore && (
                          <div
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(
                              evaluation.resumeScore
                            )}`}
                          >
                            <Star className="w-4 h-4 mr-1" />
                            Resume: {evaluation.resumeScore}/10
                          </div>
                        )}
                        {evaluation.portfolioScore && (
                          <div
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(
                              evaluation.portfolioScore
                            )}`}
                          >
                            <Star className="w-4 h-4 mr-1" />
                            Portfolio: {evaluation.portfolioScore}/10
                          </div>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(evaluation.createdAt)}
                      </div>
                      {evaluation.emailSent && (
                        <div className="flex items-center text-sm text-green-600">
                          <Mail className="w-4 h-4 mr-1" />
                          Email sent
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 mb-4">
                      {evaluation.resumeFeedback && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">
                            Resume Feedback:
                          </h4>
                          <p className="text-gray-700 text-sm whitespace-pre-wrap line-clamp-3">
                            {evaluation.resumeFeedback}
                          </p>
                        </div>
                      )}

                      {evaluation.portfolioFeedback && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">
                            Portfolio Feedback:
                          </h4>
                          <p className="text-gray-700 text-sm whitespace-pre-wrap line-clamp-3">
                            {evaluation.portfolioFeedback}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-3">
                      {evaluation.resumeUrl && (
                        <a
                          href={evaluation.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Resume
                        </a>
                      )}

                      {evaluation.portfolioUrl && (
                        <a
                          href={evaluation.portfolioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Portfolio
                        </a>
                      )}

                      {!evaluation.emailSent ? (
                        <button
                          onClick={() => handleSendEmail(evaluation._id)}
                          disabled={loading}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Send Email
                        </button>
                      ) : (
                        <span className="inline-flex items-center px-3 py-2 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-green-50">
                          <Mail className="w-4 h-4 mr-2" />
                          Email Sent
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearnerList;
