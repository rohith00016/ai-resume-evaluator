import { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  uploadResume,
  clearError,
  clearCurrentEvaluation,
} from "../features/resumeSlice";
import {
  Upload,
  User,
  FileText,
  Send,
  AlertCircle,
  CheckCircle,
  Shield,
  Globe,
} from "lucide-react";

const PublicForm = () => {
  const dispatch = useDispatch();
  const { loading, error, currentEvaluation, uploadProgress } = useSelector(
    (state) => state.resume
  );

  const [formData, setFormData] = useState({
    name: "",
    course: "",
    portfolioUrl: "",
  });
  const [file, setFile] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const fileInputRef = useRef(null);

  const validateForm = () => {
    const errors = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = "Name is required";
    } else if (formData.name.length < 2) {
      errors.name = "Name must be at least 2 characters";
    } else if (formData.name.length > 40) {
      errors.name = "Name cannot exceed 40 characters";
    } else if (!/^[a-zA-Z\s]+$/.test(formData.name)) {
      errors.name = "Name can only contain alphabetic characters";
    }

    // Course validation
    if (!formData.course.trim()) {
      errors.course = "Course is required";
    } else if (!["MERN", "UXUI", "Devops"].includes(formData.course)) {
      errors.course = "Course must be either MERN, UXUI, or Devops";
    }

    // Portfolio URL validation (optional but if provided, must be valid)
    if (formData.portfolioUrl.trim()) {
      try {
        new URL(formData.portfolioUrl.trim());
      } catch (error) {
        errors.portfolioUrl = "Please enter a valid URL";
      }
    }

    // File validation
    if (!file) {
      errors.file = "Resume file is required";
    } else if (file.type !== "application/pdf") {
      errors.file = "Only PDF files are allowed";
    } else if (file.size > 10 * 1024 * 1024) {
      errors.file = "File size must be under 10MB";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Clear Redux error when user makes changes
    if (error) {
      dispatch(clearError());
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);

    if (validationErrors.file) {
      setValidationErrors((prev) => ({
        ...prev,
        file: "",
      }));
    }

    if (error) {
      dispatch(clearError());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name.trim());
    formDataToSend.append("email", formData.email.trim().toLowerCase());
    formDataToSend.append("course", formData.course.trim());
    if (formData.portfolioUrl.trim()) {
      formDataToSend.append("portfolioUrl", formData.portfolioUrl.trim());
    }
    formDataToSend.append("resume", file);

    dispatch(uploadResume(formDataToSend));
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", course: "", portfolioUrl: "" });
    setFile(null);
    setValidationErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    dispatch(clearError());
    dispatch(clearCurrentEvaluation());
  };

  const getScoreColor = (score) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Public Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Shield className="w-6 h-6 text-blue-600 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900">
                AI Resume Evaluator - Public Access
              </h1>
            </div>
            <div className="flex items-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <Shield className="w-3 h-3 mr-1" />
                Public Form
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="py-8">
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Resume Evaluation
            </h2>

            {currentEvaluation ? (
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Evaluation Complete!
                </h3>
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="space-y-4 mb-4">
                    {currentEvaluation.resumeScore &&
                      currentEvaluation.resumeFeedback && (
                        <div className="flex items-center justify-center">
                          <span className="text-xl font-bold mr-2">
                            Resume Score:
                          </span>
                          <span
                            className={`text-2xl font-bold ${getScoreColor(
                              currentEvaluation.resumeScore
                            )}`}
                          >
                            {currentEvaluation.resumeScore}/10
                          </span>
                        </div>
                      )}
                    {currentEvaluation.portfolioScore &&
                      currentEvaluation.portfolioFeedback && (
                        <div className="flex items-center justify-center">
                          <span className="text-xl font-bold mr-2">
                            Portfolio Score:
                          </span>
                          <span
                            className={`text-2xl font-bold ${getScoreColor(
                              currentEvaluation.portfolioScore
                            )}`}
                          >
                            {currentEvaluation.portfolioScore}/10
                          </span>
                        </div>
                      )}
                  </div>
                  {currentEvaluation.portfolioUrl && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center">
                        <Globe className="w-4 h-4 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-800">
                          Portfolio Analyzed:
                        </span>
                      </div>
                      <a
                        href={currentEvaluation.portfolioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm break-all"
                      >
                        {currentEvaluation.portfolioUrl}
                      </a>
                    </div>
                  )}
                  <div className="space-y-4">
                    {currentEvaluation.resumeFeedback && (
                      <div className="text-left">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Resume Feedback:
                        </h4>
                        <p className="text-gray-700 whitespace-pre-wrap text-sm">
                          {currentEvaluation.resumeFeedback}
                        </p>
                      </div>
                    )}

                    {currentEvaluation.portfolioFeedback && (
                      <div className="text-left">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Portfolio Feedback:
                        </h4>
                        <p className="text-gray-700 whitespace-pre-wrap text-sm">
                          {currentEvaluation.portfolioFeedback}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={resetForm}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Submit Another Resume
                  </button>
                  {currentEvaluation.resumeUrl && (
                    <a
                      href={currentEvaluation.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      View Resume
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.name
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter your full name"
                  />
                  {validationErrors.name && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {validationErrors.name}
                    </p>
                  )}
                </div>

                {/* Course Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="w-4 h-4 inline mr-2" />
                    Course
                  </label>
                  <select
                    name="course"
                    value={formData.course}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.course
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  >
                    <option value="">Select a course</option>
                    <option value="MERN">MERN Stack Developer</option>
                    <option value="UXUI">UI/UX Designer</option>
                    <option value="Devops">DevOps Engineer</option>
                  </select>
                  {validationErrors.course && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {validationErrors.course}
                    </p>
                  )}
                </div>

                {/* Portfolio URL Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Globe className="w-4 h-4 inline mr-2" />
                    Portfolio URL (Optional)
                  </label>
                  <input
                    type="url"
                    name="portfolioUrl"
                    value={formData.portfolioUrl}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.portfolioUrl
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="https://your-portfolio.com"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Provide your deployed portfolio URL for enhanced evaluation
                    (MERN stack recommended)
                  </p>
                  {validationErrors.portfolioUrl && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {validationErrors.portfolioUrl}
                    </p>
                  )}
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Upload className="w-4 h-4 inline mr-2" />
                    Resume (PDF)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {file ? file.name : "Choose PDF file"}
                    </button>
                    <p className="text-sm text-gray-500 mt-2">
                      Maximum file size: 10MB
                    </p>
                  </div>
                  {validationErrors.file && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {validationErrors.file}
                    </p>
                  )}
                </div>

                {/* Progress Bar */}
                {loading && uploadProgress > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                      <p className="text-red-700">{error}</p>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-colors ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Submit Resume
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PublicForm;
