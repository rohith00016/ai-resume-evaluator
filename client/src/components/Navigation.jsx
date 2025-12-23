import { Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../features/authSlice";

const Navigation = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const getLinkClasses = (path) => {
    const baseClasses =
      "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200";
    const activeClasses = "bg-blue-100 text-blue-700 border border-blue-200";
    const inactiveClasses =
      "text-gray-700 hover:text-gray-900 hover:bg-gray-100";

    return `${baseClasses} ${isActive(path) ? activeClasses : inactiveClasses}`;
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                AI Resume Evaluator
              </h1>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            {!isAuthenticated ? (
              // Public navigation for non-authenticated users
              <>
                <Link to="/" className={getLinkClasses("/")}>
                  Home
                </Link>
                <Link to="/login" className={getLinkClasses("/login")}>
                  Login
                </Link>
                <Link to="/register" className={getLinkClasses("/register")}>
                  Register
                </Link>
              </>
            ) : (
              // Authenticated user navigation
              <>
                <Link to="/dashboard" className={getLinkClasses("/dashboard")}>
                  Dashboard
                </Link>
                <Link
                  to="/submit-resume"
                  className={getLinkClasses("/submit-resume")}
                >
                  Submit Resume
                </Link>
                <Link
                  to="/submit-portfolio"
                  className={getLinkClasses("/submit-portfolio")}
                >
                  Submit Portfolio
                </Link>

                {/* Admin-only navigation */}
                {user?.role === "admin" && (
                  <>
                    <Link
                      to="/admin/list"
                      className={getLinkClasses("/admin/list")}
                    >
                      Submissions
                    </Link>
                    <Link
                      to="/admin/management"
                      className={getLinkClasses("/admin/management")}
                    >
                      Manage
                    </Link>
                  </>
                )}

                {/* User info and logout */}
                <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-200">
                  <span className="text-sm text-gray-600">
                    Welcome, {user?.username || user?.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 rounded-md text-sm font-medium text-red-700 hover:text-red-900 hover:bg-red-50 transition-colors duration-200"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
