import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";
import LearnerForm from "./components/LearnerForm";
import StudentsData from "./components/StudentsData";
import PublicForm from "./components/PublicForm";
import "./index.css";

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          

          <main className="py-8">
            <Routes>
              <Route path="/" element={<LearnerForm />} />
              <Route path="/studentsdata" element={<StudentsData />} />
              <Route path="/public" element={<PublicForm />} />
            </Routes>
          </main>
        </div>
      </Router>
    </Provider>
  );
}

export default App;
