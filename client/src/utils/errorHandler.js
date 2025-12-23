import toast from "react-hot-toast";

/**
 * Extracts error message from axios error response
 * @param {Error} error - The error object
 * @returns {string} - User-friendly error message
 */
export const getErrorMessage = (error) => {
  // Handle axios errors
  if (error.response) {
    const { data, status } = error.response;

    // Handle validation errors (array of messages)
    if (data.details && Array.isArray(data.details)) {
      return data.details.join(", ");
    }

    // Handle single error message
    if (data.error) {
      return data.error;
    }

    // Handle status code specific messages
    switch (status) {
      case 400:
        return "Invalid request. Please check your input.";
      case 401:
        return "Authentication failed. Please login again.";
      case 403:
        return "You don't have permission to perform this action.";
      case 404:
        return "Resource not found.";
      case 413:
        return "File size is too large. Maximum size is 5MB.";
      case 422:
        return "Unable to process the file. Please check the file format.";
      case 429:
        return "Too many requests. Please try again later.";
      case 500:
        return "Server error. Please try again later.";
      case 503:
        return "Service temporarily unavailable. Please try again later.";
      default:
        return data.message || "An error occurred. Please try again.";
    }
  }

  // Handle network errors
  if (error.request) {
    return "Network error. Please check your connection.";
  }

  // Handle other errors
  return error.message || "An unexpected error occurred.";
};

/**
 * Shows error toast message
 * @param {Error|string} error - Error object or error message string
 * @param {string} defaultMessage - Default message if error extraction fails
 */
export const showErrorToast = (error, defaultMessage = "An error occurred") => {
  const message =
    typeof error === "string" ? error : getErrorMessage(error) || defaultMessage;
  toast.error(message);
};

/**
 * Shows success toast message
 * @param {string} message - Success message
 */
export const showSuccessToast = (message) => {
  toast.success(message);
};

/**
 * Shows validation error toast
 * @param {string|Object} errors - Validation error message or object with field errors
 */
export const showValidationError = (errors) => {
  if (typeof errors === "string") {
    toast.error(errors);
    return;
  }

  if (typeof errors === "object") {
    const errorMessages = Object.values(errors).filter(Boolean);
    if (errorMessages.length > 0) {
      toast.error(errorMessages[0]); // Show first error
    }
  }
};

