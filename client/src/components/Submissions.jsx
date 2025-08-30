import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FileText, Filter } from "lucide-react";
import SubmissionCard from "./SubmissionCard";

const Submissions = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingEmailId, setSendingEmailId] = useState(null);
  const [filters, setFilters] = useState({
    course: "",
    emailSent: "",
  });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const { user, token } = useSelector((state) => state.auth);

  // Fetch submissions
  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/learners`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSubmissions(response.data);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Send email
  const sendEmail = async (submissionId) => {
    setSendingEmailId(submissionId);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/send-feedback`,
        { evaluationId: submissionId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update local state
      setSubmissions(
        submissions.map((submission) =>
          submission._id === submissionId
            ? {
                ...submission,
                emailSent: true,
                emailSentAt: new Date().toISOString(),
              }
            : submission
        )
      );
    } catch (error) {
      console.error("Error sending email:", error);
    } finally {
      setSendingEmailId(null);
    }
  };

  // Filter and sort submissions
  const getFilteredAndSortedSubmissions = () => {
    let filtered = [...submissions];

    // Apply course filter
    if (filters.course) {
      filtered = filtered.filter(
        (submission) => submission.course === filters.course
      );
    }

    // Apply email sent filter
    if (filters.emailSent === "sent") {
      filtered = filtered.filter((submission) => submission.emailSent);
    } else if (filters.emailSent === "not-sent") {
      filtered = filtered.filter((submission) => !submission.emailSent);
    }

    // Sort submissions
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === "createdAt" || sortBy === "emailSentAt") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const handleViewDetails = (submissionId) => {
    navigate(`/admin/list/${submissionId}`);
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const filteredSubmissions = getFilteredAndSortedSubmissions();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading submissions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              All Submissions
            </h1>
            <p className="text-gray-600 mt-1">
              {user?.role === "admin"
                ? "View and manage all user submissions"
                : "View your submissions"}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-500">
              {filteredSubmissions.length} submissions
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <select
                value={filters.course}
                onChange={(e) =>
                  setFilters({ ...filters, course: e.target.value })
                }
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Courses</option>
                <option value="MERN">MERN</option>
                <option value="UXUI">UXUI</option>
                <option value="Devops">Devops</option>
              </select>

              {user?.role === "admin" && (
                <select
                  value={filters.emailSent}
                  onChange={(e) =>
                    setFilters({ ...filters, emailSent: e.target.value })
                  }
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">All Email Status</option>
                  <option value="sent">Email Sent</option>
                  <option value="not-sent">Email Not Sent</option>
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <div className="space-y-4">
          {filteredSubmissions.map((submission) => (
            <SubmissionCard
              key={submission._id}
              evaluation={submission}
              onViewDetails={handleViewDetails}
              onSendEmail={sendEmail}
              userRole={user?.role}
              sendingEmailId={sendingEmailId}
            />
          ))}
        </div>

        {filteredSubmissions.length === 0 && (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No submissions found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Submissions;
