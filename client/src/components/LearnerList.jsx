import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchEvaluations, sendFeedbackEmail } from "../features/resumeSlice";
import { AlertCircle } from "lucide-react";
import SubmissionCard from "./SubmissionCard";

const LearnerList = () => {
  const dispatch = useDispatch();
  const { evaluations, loading, error } = useSelector((state) => state.resume);
  const { user } = useSelector((state) => state.auth);
  const [sendingEmailId, setSendingEmailId] = useState(null);

  useEffect(() => {
    dispatch(fetchEvaluations());
  }, [dispatch]);

  const handleSendEmail = async (evaluationId) => {
    try {
      setSendingEmailId(evaluationId);
      await dispatch(sendFeedbackEmail(evaluationId)).unwrap();
    } catch (error) {
      console.error("Failed to send email:", error);
    } finally {
      setSendingEmailId(null);
    }
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Resume Evaluations
          </h2>
          <p className="text-gray-600 mt-1">
            {evaluations.length} evaluation{evaluations.length !== 1 ? "s" : ""}{" "}
            found
          </p>
        </div>

        {evaluations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No evaluations found.</p>
            <p className="text-gray-400 mt-2">
              Submit a resume to see evaluations here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {evaluations.map((evaluation) => (
              <SubmissionCard
                key={evaluation._id}
                evaluation={evaluation}
                onViewDetails={() => {}} // No view details functionality in this component
                onSendEmail={handleSendEmail}
                userRole={user?.role || "user"}
                sendingEmailId={sendingEmailId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearnerList;
