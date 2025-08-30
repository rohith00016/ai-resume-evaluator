import {
  Star,
  Mail,
  ExternalLink,
  Calendar,
  User,
  CheckCircle,
  Clock,
} from "lucide-react";

const SubmissionCard = ({
  evaluation,
  onViewDetails,
  onSendEmail,
  userRole,
  sendingEmailId,
}) => {
  const getScoreColor = (score) => {
    if (score >= 8) return "text-green-600 bg-green-100";
    if (score >= 6) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getCourseBadgeColor = (course) => {
    switch (course) {
      case "MERN":
        return "bg-blue-100 text-blue-800";
      case "UXUI":
        return "bg-purple-100 text-purple-800";
      case "Devops":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {evaluation.name}
            </h3>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${getCourseBadgeColor(
                evaluation.course
              )}`}
            >
              {evaluation.course}
            </span>
            {/* Submitter Info - Admin only */}
            {userRole === "admin" && evaluation.submittedBy && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4 text-gray-400" />
                <span>
                  {evaluation.submittedBy.username ||
                    evaluation.submittedBy.email}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
            <div>
              <span className="flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                {evaluation.email}
              </span>
            </div>
            <div>
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {formatDate(evaluation.createdAt)}
              </span>
            </div>
          </div>

          {/* Scores */}
          <div className="flex flex-wrap gap-2 mb-3">
            {evaluation.resumeScore && evaluation.resumeFeedback && (
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-500" />
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${getScoreColor(
                    evaluation.resumeScore
                  )}`}
                >
                  Resume: {evaluation.resumeScore}/10
                </span>
              </div>
            )}
            {evaluation.portfolioScore && evaluation.portfolioFeedback && (
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-500" />
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${getScoreColor(
                    evaluation.portfolioScore
                  )}`}
                >
                  Portfolio: {evaluation.portfolioScore}/10
                </span>
              </div>
            )}
          </div>

          {/* Email Status */}
          <div className="mb-3">
            {evaluation.emailSent ? (
              <div className="flex items-center text-green-600">
                <CheckCircle className="w-4 h-4 mr-1" />
                <span className="text-sm">
                  Email sent{" "}
                  {evaluation.emailSentAt && formatDate(evaluation.emailSentAt)}
                </span>
              </div>
            ) : (
              <div className="flex items-center text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                <span className="text-sm">Email not sent</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - Always in the same order */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          {/* 1. View Resume */}
          {evaluation.resumeUrl && (
            <a
              href={evaluation.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              View Resume
            </a>
          )}

          {/* 2. View Portfolio */}
          {evaluation.portfolioUrl && (
            <a
              href={evaluation.portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              View Portfolio
            </a>
          )}

          {/* 3. View Details */}
          <button
            onClick={() => onViewDetails(evaluation._id)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            View Details
          </button>

          {/* 4. Send Mail - Admin only (for manual resend) */}
          {userRole === "admin" && (
            <button
              onClick={() => onSendEmail(evaluation._id)}
              disabled={sendingEmailId === evaluation._id}
              className={`inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium transition-colors ${
                sendingEmailId === evaluation._id
                  ? "bg-gray-400 cursor-not-allowed text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              <Mail className="w-4 h-4 mr-1" />
              {sendingEmailId === evaluation._id ? "Sending..." : "Send Mail"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionCard;
