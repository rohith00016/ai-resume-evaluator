import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { UserPlus, Users, AlertCircle, CheckCircle } from "lucide-react";

const Manage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [promoting, setPromoting] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  const { token } = useSelector((state) => state.auth);

  // Fetch all users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/auth/users`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setUsers(response.data);
      setMessage({
        type: "success",
        text: `Loaded ${response.data.length} users successfully`,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to fetch users",
      });
    } finally {
      setLoading(false);
    }
  };

  // Promote user to admin
  const promoteToAdmin = async (userId) => {
    setPromoting(userId);
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/auth/promote/${userId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage({
        type: "success",
        text: `User promoted to admin successfully!`,
      });

      // Update the user in the list
      setUsers(
        users.map((user) =>
          user._id === userId ? { ...user, role: "admin" } : user
        )
      );
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to promote user",
      });
    } finally {
      setPromoting(null);
    }
  };

  useEffect(() => {
    // Auto-fetch users when component mounts
    fetchUsers();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
            <p className="text-gray-600 mt-1">
              Manage user roles and permissions
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-500">Admin Panel</span>
          </div>
        </div>

        {/* Message Display */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-md ${
              message.type === "success"
                ? "bg-green-50 border border-green-200 text-green-700"
                : message.type === "error"
                ? "bg-red-50 border border-red-200 text-red-700"
                : "bg-blue-50 border border-blue-200 text-blue-700"
            }`}
          >
            <div className="flex items-center">
              {message.type === "success" ? (
                <CheckCircle className="w-5 h-5 mr-2" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-2" />
              )}
              {message.text}
            </div>
          </div>
        )}

        {/* Admin Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              User Management
            </h3>
            <p className="text-blue-700 text-sm mb-4">
              View all users and manage their roles
            </p>
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh Users"}
            </button>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              Admin Promotion
            </h3>
            <p className="text-green-700 text-sm mb-4">
              Promote regular users to admin role
            </p>
            <div className="text-xs text-green-600">
              Use the promote button next to each user
            </div>
          </div>
        </div>

        {/* Users List */}
        {users.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              All Users ({users.length})
            </h3>
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between bg-white p-4 rounded-md border"
                >
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.username}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.role === "admin"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.role}
                    </span>
                    {user.role !== "admin" && (
                      <button
                        onClick={() => promoteToAdmin(user._id)}
                        disabled={promoting === user._id}
                        className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        {promoting === user._id ? "Promoting..." : "Promote"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">
            User Management Instructions
          </h3>
          <ul className="text-xs text-yellow-700 space-y-1">
            <li>• Only existing admins can access this panel</li>
            <li>• You can promote regular users to admin role</li>
            <li>
              • Admin users have access to all submissions and can send emails
            </li>
            <li>
              • Use the admin registration code to create new admin accounts
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Manage;
