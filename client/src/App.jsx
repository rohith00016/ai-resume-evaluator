import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";
import Navigation from "./components/Navigation";
import Home from "./components/Home";
import StudentsData from "./components/StudentsData";
import PublicForm from "./components/PublicForm";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import Register from "./components/Register";
import AdminRegister from "./components/AdminRegister";
import SubmitResume from "./components/SubmitResume";
import SubmitPortfolio from "./components/SubmitPortfolio";
import Submissions from "./components/Submissions";
import FeedbackDetail from "./components/FeedbackDetail";
import Manage from "./components/Manage";
import ProtectedRoute from "./components/ProtectedRoute";
import "./index.css";

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navigation />

          <main className="py-8">
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
          </main>
        </div>
      </Router>
    </Provider>
  );
}

export default App;
