import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchEvaluations, sendFeedbackEmail } from "../features/resumeSlice";
import {
  AlertCircle,
  BookOpen,
  RefreshCw,
  SortAsc,
  SortDesc,
} from "lucide-react";
import SubmissionCard from "./SubmissionCard";

const FeedbackList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { evaluations, loading, error } = useSelector((state) => state.resume);
  const { user, token } = useSelector((state) => state.auth);

  const [filteredEvaluations, setFilteredEvaluations] = useState([]);
  const [filters, setFilters] = useState({
    course: "",
    emailSent: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [sendingEmailId, setSendingEmailId] = useState(null);

  useEffect(() => {
    dispatch(fetchEvaluations());
  }, [dispatch]);

  useEffect(() => {
    let filtered = [...evaluations];

    // Apply course filter
    if (filters.course) {
      filtered = filtered.filter(
        (evaluation) => evaluation.course === filters.course
      );
    }

    // Apply email sent filter
    if (filters.emailSent !== "") {
      filtered = filtered.filter(
        (evaluation) => evaluation.emailSent === (filters.emailSent === "true")
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (filters.sortBy) {
        case "name":
          aValue = a.name?.toLowerCase() || "";
          bValue = b.name?.toLowerCase() || "";
          break;
        case "course":
          aValue = a.course?.toLowerCase() || "";
          bValue = b.course?.toLowerCase() || "";
          break;
        case "resumeScore":
          aValue = a.resumeScore && a.resumeFeedback ? a.resumeScore : 0;
          bValue = b.resumeScore && b.resumeFeedback ? b.resumeScore : 0;
          break;
        case "portfolioScore":
          aValue =
            a.portfolioScore && a.portfolioFeedback ? a.portfolioScore : 0;
          bValue =
            b.portfolioScore && b.portfolioFeedback ? b.portfolioScore : 0;
          break;
        case "emailSent":
          aValue = a.emailSent ? 1 : 0;
          bValue = b.emailSent ? 1 : 0;
          break;
        case "createdAt":
        default:
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
      }

      if (filters.sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredEvaluations(filtered);
  }, [evaluations, filters]);

  const handleSendEmail = async (evaluationId) => {
    try {
      setSendingEmailId(evaluationId);
      await dispatch(sendFeedbackEmail(evaluationId)).unwrap();

      // Update local state immediately for better UX
      const updatedEvaluations = evaluations.map((evaluation) =>
        evaluation._id === evaluationId
          ? {
              ...evaluation,
              emailSent: true,
              emailSentAt: new Date().toISOString(),
            }
          : evaluation
      );

      // Update Redux state
      dispatch({
        type: "resume/fetchEvaluations/fulfilled",
        payload: updatedEvaluations,
      });
      // Success toast is handled in the Redux slice
    } catch (error) {
      // Error toast is handled in the Redux slice
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleViewDetails = (evaluationId) => {
    navigate(`/admin/list/${evaluationId}`);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSortOrder = () => {
    setFilters((prev) => ({
      ...prev,
      sortOrder: prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
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
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {user?.role === "admin" ? "All Submissions" : "My Submissions"}
            </h1>
            <button
              onClick={() => dispatch(fetchEvaluations())}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>

          {/* Filters - Admin only */}
          {user?.role === "admin" && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course
                </label>
                <select
                  value={filters.course}
                  onChange={(e) => handleFilterChange("course", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Courses</option>
                  <option value="MERN">MERN</option>
                  <option value="UXUI">UXUI</option>
                  <option value="Devops">DevOps</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Status
                </label>
                <select
                  value={filters.emailSent}
                  onChange={(e) =>
                    handleFilterChange("emailSent", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All</option>
                  <option value="true">Sent</option>
                  <option value="false">Not Sent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="createdAt">Date</option>
                  <option value="name">Name</option>
                  <option value="course">Course</option>
                  <option value="resumeScore">Resume Score</option>
                  <option value="portfolioScore">Portfolio Score</option>
                  <option value="emailSent">Email Status</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order
                </label>
                <button
                  onClick={toggleSortOrder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 flex items-center justify-center transition-colors"
                >
                  {filters.sortOrder === "asc" ? (
                    <SortAsc className="w-4 h-4" />
                  ) : (
                    <SortDesc className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* List */}
        <div className="space-y-4">
          {filteredEvaluations.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No submissions found
              </h3>
              <p className="text-gray-500">
                {user?.role === "admin"
                  ? "No submissions match your current filters."
                  : "You haven't submitted any evaluations yet."}
              </p>
            </div>
          ) : (
            filteredEvaluations.map((evaluation) => (
              <SubmissionCard
                key={evaluation._id}
                evaluation={evaluation}
                onViewDetails={handleViewDetails}
                onSendEmail={handleSendEmail}
                userRole={user?.role}
                sendingEmailId={sendingEmailId}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackList;
