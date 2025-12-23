import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Provider } from "react-redux";
import { store } from "./store";
import Navigation from "./components/Navigation";
import ProtectedRoute from "./components/ProtectedRoute";
import "./index.css";
import { Toaster } from "react-hot-toast";

// Lazy load components for code splitting
const Home = lazy(() => import("./components/Home"));
const StudentsData = lazy(() => import("./components/StudentsData"));
const PublicForm = lazy(() => import("./components/PublicForm"));
const Dashboard = lazy(() => import("./components/Dashboard"));
const Login = lazy(() => import("./components/Login"));
const Register = lazy(() => import("./components/Register"));
const AdminRegister = lazy(() => import("./components/AdminRegister"));
const SubmitResume = lazy(() => import("./components/SubmitResume"));
const SubmitPortfolio = lazy(() => import("./components/SubmitPortfolio"));
const Submissions = lazy(() => import("./components/Submissions"));
const FeedbackDetail = lazy(() => import("./components/FeedbackDetail"));
const Manage = lazy(() => import("./components/Manage"));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
  </div>
);

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navigation />

          <main className="py-8">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/studentsdata" element={<StudentsData />} />
                <Route path="/public" element={<PublicForm />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/admin-register" element={<AdminRegister />} />
                <Route
                  path="/submit-resume"
                  element={
                    <ProtectedRoute>
                      <SubmitResume />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/submit-portfolio"
                  element={
                    <ProtectedRoute>
                      <SubmitPortfolio />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/list"
                  element={
                    <ProtectedRoute>
                      <Submissions />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/list/:submissionId"
                  element={
                    <ProtectedRoute>
                      <FeedbackDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/management"
                  element={
                    <ProtectedRoute>
                      <Manage />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Suspense>
          </main>

          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#111827",
                color: "#F9FAFB",
                border: "1px solid #374151",
                padding: "10px 14px",
              },
              success: {
                iconTheme: { primary: "#10B981", secondary: "#ffffff" },
                style: { borderColor: "#10B981" },
              },
              error: {
                iconTheme: { primary: "#EF4444", secondary: "#ffffff" },
                style: { borderColor: "#EF4444" },
              },
            }}
          />
        </div>
      </Router>
    </Provider>
  );
}

export default App;
