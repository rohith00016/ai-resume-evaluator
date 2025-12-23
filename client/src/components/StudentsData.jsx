import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchEvaluations, sendFeedbackEmail } from "../features/resumeSlice";
import { AlertCircle, RefreshCw, X } from "lucide-react";
import NavBar from "./NavBar";
import SubmissionCard from "./SubmissionCard";
import { FormattedFeedback } from "../utils/formatFeedback";

const StudentsData = () => {
  const dispatch = useDispatch();
  const { evaluations, loading, error } = useSelector((state) => state.resume);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sendingEmailId, setSendingEmailId] = useState(null);

  useEffect(() => {
    dispatch(fetchEvaluations());
  }, [dispatch]);

  const handleSendEmail = async (evaluationId) => {
    try {
      setSendingEmailId(evaluationId);
      await dispatch(sendFeedbackEmail(evaluationId)).unwrap();
      // Success toast is handled in the Redux slice
    } catch (error) {
      // Error toast is handled in the Redux slice
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleViewEvaluation = (evaluation) => {
    setSelectedEvaluation(evaluation);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvaluation(null);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Students Data</h2>
            <p className="text-gray-600 mt-1">
              {evaluations.length} student{evaluations.length !== 1 ? "s" : ""}{" "}
              found
            </p>
          </div>

          {evaluations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No students data found.</p>
              <p className="text-gray-400 mt-2">
                Submit a resume to see data here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {evaluations.map((evaluation) => (
                <SubmissionCard
                  key={evaluation._id}
                  evaluation={evaluation}
                  onViewDetails={handleViewEvaluation}
                  onSendEmail={handleSendEmail}
                  userRole="admin"
                  sendingEmailId={sendingEmailId}
                />
              ))}
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
                      {selectedEvaluation.portfolioUrl && (
                        <div className="col-span-2">
                          <span className="text-gray-600">Portfolio:</span>
                          <a
                            href={selectedEvaluation.portfolioUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-blue-600 hover:text-blue-800 break-all"
                          >
                            <Globe className="w-3 h-3 inline mr-1" />
                            {selectedEvaluation.portfolioUrl}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Scores */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Scores</h4>
                    <div className="space-y-3">
                      {selectedEvaluation.resumeScore &&
                        selectedEvaluation.resumeFeedback && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Resume Score:</span>
                            <div
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(
                                selectedEvaluation.resumeScore
                              )}`}
                            >
                              <Star className="w-4 h-4 mr-1" />
                              {selectedEvaluation.resumeScore}/10
                            </div>
                          </div>
                        )}
                      {selectedEvaluation.portfolioScore &&
                        selectedEvaluation.portfolioFeedback && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">
                              Portfolio Score:
                            </span>
                            <div
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(
                                selectedEvaluation.portfolioScore
                              )}`}
                            >
                              <Globe className="w-4 h-4 mr-1" />
                              {selectedEvaluation.portfolioScore}/10
                            </div>
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Resume Feedback */}
                  {selectedEvaluation.resumeFeedback && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">
                        Resume Feedback
                      </h4>
                      <div className="bg-white rounded-md p-4 border">
                        <FormattedFeedback feedback={selectedEvaluation.resumeFeedback} />
                      </div>
                    </div>
                  )}

                  {/* Portfolio Feedback */}
                  {selectedEvaluation.portfolioFeedback && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">
                        Portfolio Feedback
                      </h4>
                      <div className="bg-white rounded-md p-4 border">
                        <FormattedFeedback feedback={selectedEvaluation.portfolioFeedback} />
                      </div>
                    </div>
                  )}

                  {/* Resume Link */}
                  {selectedEvaluation.resumeUrl && (
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
                  )}
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
