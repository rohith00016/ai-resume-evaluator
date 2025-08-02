import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";
import LearnerForm from "./components/LearnerForm";
import LearnerList from "./components/LearnerList";
import "./index.css";

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-semibold text-gray-900">
                    AI Resume Evaluator
                  </h1>
                </div>
                <div className="flex items-center space-x-4">
                  <a
                    href="/"
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Submit Resume
                  </a>
                  <a
                    href="/evaluations"
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    View Evaluations
                  </a>
                </div>
              </div>
            </div>
          </nav>

          <main className="py-8">
            <Routes>
              <Route path="/" element={<LearnerForm />} />
              <Route path="/evaluations" element={<LearnerList />} />
            </Routes>
          </main>
        </div>
      </Router>
    </Provider>
  );
}

export default App;
