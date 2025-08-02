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
  Mail,
  FileText,
  Send,
  AlertCircle,
  CheckCircle,
  Share,
  Copy,
} from "lucide-react";
import NavBar from "./NavBar";

const LearnerForm = () => {
  const dispatch = useDispatch();
  const { loading, error, currentEvaluation, uploadProgress } = useSelector(
    (state) => state.resume
  );

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    course: "",
  });
  const [file, setFile] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [showPublicLink, setShowPublicLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
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

    // Email validation
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (
      !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)
    ) {
      errors.email = "Please enter a valid email address";
    }

    // Course validation
    if (!formData.course.trim()) {
      errors.course = "Course is required";
    } else if (!["MERN", "UXUI", "Devops"].includes(formData.course)) {
      errors.course = "Course must be either MERN, UXUI, or Devops";
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
    formDataToSend.append("resume", file);

    dispatch(uploadResume(formDataToSend));
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", course: "" });
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

  const generatePublicLink = () => {
    const currentDomain = window.location.origin;
    const publicLink = `${currentDomain}/public`;
    setShowPublicLink(true);

    // Copy to clipboard
    navigator.clipboard.writeText(publicLink).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  const copyPublicLink = () => {
    const currentDomain = window.location.origin;
    const publicLink = `${currentDomain}/public`;

    navigator.clipboard.writeText(publicLink).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  return (
    <>
      <NavBar />
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Resume Evaluation
            </h2>
            <button
              onClick={generatePublicLink}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
            >
              <Share className="w-4 h-4 mr-2" />
              Generate Public Link
            </button>
          </div>

          {/* Public Link Display */}
          {showPublicLink && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">
                Public Form Link Generated!
              </h4>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={`${window.location.origin}/public`}
                  readOnly
                  className="flex-1 px-3 py-2 border border-green-300 rounded-md text-sm bg-white"
                />
                <button
                  onClick={copyPublicLink}
                  className={`inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium transition-colors ${
                    linkCopied
                      ? "bg-green-100 text-green-800"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  {linkCopied ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-green-700 text-sm mt-2">
                Share this link with students to allow them to submit resumes
                without accessing the admin panel.
              </p>
            </div>
          )}

          {currentEvaluation ? (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Evaluation Complete!
              </h3>
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold mr-2">Score:</span>
                  <span
                    className={`text-3xl font-bold ${getScoreColor(
                      currentEvaluation.score
                    )}`}
                  >
                    {currentEvaluation.score}/10
                  </span>
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Feedback:
                  </h4>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {currentEvaluation.feedback}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={resetForm}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Submit Another Resume
                </button>
                <a
                  href={currentEvaluation.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  View Resume
                </a>
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
                    validationErrors.name ? "border-red-500" : "border-gray-300"
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

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.email
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="Enter your email address"
                />
                {validationErrors.email && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {validationErrors.email}
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
    </>
  );
};

export default LearnerForm;
