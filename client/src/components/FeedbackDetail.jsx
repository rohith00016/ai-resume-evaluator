import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Star,
  FileText,
  ExternalLink,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const FeedbackDetail = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/learners/${submissionId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setSubmission(response.data);
      } catch (error) {
        setError("Failed to load submission details");
        console.error("Error fetching submission:", error);
      } finally {
        setLoading(false);
      }
    };

    if (submissionId) {
      fetchSubmission();
    }
  }, [submissionId, token]);

  const getScoreColor = (score) => {
    if (score >= 8) return "text-green-600 bg-green-100";
    if (score >= 6) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFeedback = (feedback) => {
    if (!feedback) return "";

    // Clean up formatting issues
    return feedback
      .replace(/W\*W\*/g, "") // Remove W*W* patterns
      .replace(/\*\*/g, "") // Remove double asterisks
      .replace(/\*([^*]+)\*/g, "$1") // Remove single asterisks but keep content
      .replace(/\n\n+/g, "\n\n") // Normalize multiple line breaks
      .replace(/^\s+|\s+$/g, "") // Trim whitespace
      .replace(/([.!?])\s*\n/g, "$1\n\n") // Add proper spacing after sentences
      .trim();
  };

  const renderFeedbackSection = (title, feedback, score) => {
    if (!feedback) return null;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          {score && (
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(
                score
              )}`}
            >
              <Star className="w-4 h-4 mr-1" />
              {score}/10
            </div>
          )}
        </div>
        <div className="prose prose-gray max-w-none">
          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
            {formatFeedback(feedback)
              .split("\n")
              .map((line, index) => (
                <div key={index} className="mb-2">
                  {line}
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
            <p className="text-red-700">{error || "Submission not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Submissions
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Evaluation Details
        </h1>
        <p className="text-gray-600">
          Comprehensive feedback and analysis for {submission.name}
        </p>
      </div>

      {/* Submission Info Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Student Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <User className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-gray-700">{submission.name}</span>
              </div>
              <div className="flex items-center">
                <Mail className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-gray-700">{submission.email}</span>
              </div>
              <div className="flex items-center">
                <FileText className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-gray-700">{submission.course}</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Submission Details
            </h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-gray-700">
                  Submitted: {formatDate(submission.createdAt)}
                </span>
              </div>
              {submission.emailSent && (
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-3" />
                  <span className="text-green-700">Feedback email sent</span>
                </div>
              )}
              {submission.emailSentAt && (
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-gray-700">
                    Email sent: {formatDate(submission.emailSentAt)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Resume Feedback */}
      {submission.resumeFeedback &&
        renderFeedbackSection(
          "Resume Evaluation",
          submission.resumeFeedback,
          submission.resumeScore
        )}

      {/* Portfolio Feedback */}
      {submission.portfolioFeedback &&
        renderFeedbackSection(
          "Portfolio Evaluation",
          submission.portfolioFeedback,
          submission.portfolioScore
        )}

      {/* Document Links */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Submitted Documents
        </h3>
        <div className="space-y-3">
          {submission.resumeUrl && (
            <a
              href={submission.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Resume PDF
            </a>
          )}
          {submission.portfolioUrl && (
            <a
              href={submission.portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Portfolio PDF
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackDetail;
