import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchEvaluations, sendFeedbackEmail } from "../features/resumeSlice";
import {
  Mail,
  ExternalLink,
  Calendar,
  Star,
  User,
  AlertCircle,
  BookOpen,
  RefreshCw,
  Eye,
  X,
} from "lucide-react";
import NavBar from "./NavBar";

const StudentsData = () => {
  const dispatch = useDispatch();
  const { evaluations, loading, error } = useSelector((state) => state.resume);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchEvaluations());
  }, [dispatch]);

  const handleSendEmail = (evaluationId) => {
    dispatch(sendFeedbackEmail(evaluationId));
  };

  const handleViewEvaluation = (evaluation) => {
    setSelectedEvaluation(evaluation);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvaluation(null);
  };

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

  if (loading) {
    return (
      <>
        <NavBar />
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <NavBar />
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Students Data</h2>
            <p className="text-gray-600 mt-1">
              {evaluations.length} student{evaluations.length !== 1 ? "s" : ""}{" "}
              found
            </p>
          </div>

          {evaluations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-lg">No students data found.</p>
              <p className="text-gray-400 mt-2">
                Submit a resume to see data here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      View Evaluation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PDF Link
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mail Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {evaluations.map((evaluation) => (
                    <tr
                      key={evaluation._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="font-medium text-gray-900">
                              {evaluation.name}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {evaluation.email}
                          </div>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(evaluation.createdAt)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCourseBadgeColor(
                            evaluation.course
                          )}`}
                        >
                          <BookOpen className="w-3 h-3 mr-1" />
                          {evaluation.course}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(
                            evaluation.score
                          )}`}
                        >
                          <Star className="w-4 h-4 mr-1" />
                          {evaluation.score}/10
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewEvaluation(evaluation)}
                          className="inline-flex items-center px-3 py-1 border border-transparent rounded text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View Details
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a
                          href={evaluation.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View PDF
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {evaluation.emailSent ? (
                          <div className="text-sm">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Mail className="w-3 h-3 mr-1" />
                              Sent
                            </span>
                            {evaluation.emailSentAt && (
                              <div className="text-xs text-gray-500 mt-1">
                                {formatDate(evaluation.emailSentAt)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Not Sent
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleSendEmail(evaluation._id)}
                          disabled={loading}
                          className="inline-flex items-center px-3 py-1 border border-transparent rounded text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          {evaluation.emailSent ? (
                            <>
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Resend
                            </>
                          ) : (
                            <>
                              <Mail className="w-3 h-3 mr-1" />
                              Send
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Evaluation Modal */}
        {isModalOpen && selectedEvaluation && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-4 border-b">
                  <h3 className="text-lg font-medium text-gray-900">
                    Evaluation Details
                  </h3>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="mt-4 space-y-4">
                  {/* Student Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Student Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Name:</span>
                        <span className="ml-2 font-medium">
                          {selectedEvaluation.name}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <span className="ml-2 font-medium">
                          {selectedEvaluation.email}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Course:</span>
                        <span
                          className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getCourseBadgeColor(
                            selectedEvaluation.course
                          )}`}
                        >
                          {selectedEvaluation.course}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Submitted:</span>
                        <span className="ml-2 font-medium">
                          {formatDate(selectedEvaluation.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Score</h4>
                    <div
                      className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold ${getScoreColor(
                        selectedEvaluation.score
                      )}`}
                    >
                      <Star className="w-5 h-5 mr-2" />
                      {selectedEvaluation.score}/10
                    </div>
                  </div>

                  {/* Feedback */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Detailed Feedback
                    </h4>
                    <div className="bg-white rounded-md p-4 border">
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {selectedEvaluation.feedback}
                      </p>
                    </div>
                  </div>

                  {/* Resume Link */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Resume</h4>
                    <a
                      href={selectedEvaluation.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Resume PDF
                    </a>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleSendEmail(selectedEvaluation._id)}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {selectedEvaluation.emailSent ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Resend Email
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Email
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default StudentsData;
