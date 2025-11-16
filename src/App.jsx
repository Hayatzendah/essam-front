import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Welcome from './pages/Welcome';
import Dashboard from './pages/admin/Dashboard';
import CreateQuestion from './pages/admin/CreateQuestion';
import EditQuestion from './pages/admin/EditQuestion';
import CreateExam from './pages/admin/CreateExam';
import EditExam from './pages/admin/EditExam';
import QuestionsList from './pages/admin/QuestionsList';
import ExamsList from './pages/admin/ExamsList';
import LebenInDeutschland from './pages/student/LebenInDeutschland';
import ExamPage from './pages/student/ExamPage';
import ExamResults from './pages/student/ExamResults';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('accessToken');
  return token ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const token = localStorage.getItem('accessToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) {
    return <Navigate to="/login" />;
  }
  
  if (user.role !== 'admin' && user.role !== 'teacher') {
    return <Navigate to="/welcome" />;
  }
  
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/welcome"
          element={
            <PrivateRoute>
              <Welcome />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/questions/new"
          element={
            <AdminRoute>
              <CreateQuestion />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/questions/:id/edit"
          element={
            <AdminRoute>
              <EditQuestion />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/exams/new"
          element={
            <AdminRoute>
              <CreateExam />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/exams/:id/edit"
          element={
            <AdminRoute>
              <EditExam />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/questions"
          element={
            <AdminRoute>
              <QuestionsList />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/exams"
          element={
            <AdminRoute>
              <ExamsList />
            </AdminRoute>
          }
        />
        <Route
          path="/student/liden"
          element={
            <PrivateRoute>
              <LebenInDeutschland />
            </PrivateRoute>
          }
        />
        <Route
          path="/student/exam/:attemptId"
          element={
            <PrivateRoute>
              <ExamPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/student/attempt/:attemptId/results"
          element={
            <PrivateRoute>
              <ExamResults />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;

