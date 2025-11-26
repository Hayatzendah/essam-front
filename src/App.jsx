import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Welcome from './pages/Welcome';
import Home from './pages/Home';
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
import Wortschatz from './pages/Wortschatz';
import WortschatzTopicPage from './pages/WortschatzTopicPage';
import GrammatikPage from './pages/GrammatikPage';
import GrammarTopicPage from './pages/grammar/GrammarTopicPage';
import GrammarExercisePage from './pages/grammar/GrammarExercisePage';
import PruefungenPage from './pages/PruefungenPage';
import ExamDetailsPage from './pages/ExamDetailsPage';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('accessToken');
  const location = window.location.pathname + window.location.search;

  if (!token) {
    // حفظ الصفحة المطلوبة في query parameter
    return <Navigate to={`/login?redirect=${encodeURIComponent(location)}`} />;
  }

  return children;
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
        <Route path="/" element={<Home />} />
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
        <Route path="/wortschatz" element={<Wortschatz />} />
        <Route
          path="/wortschatz/:level/:topicSlug"
          element={
            <PrivateRoute>
              <WortschatzTopicPage />
            </PrivateRoute>
          }
        />
        <Route path="/grammatik" element={<GrammatikPage />} />
        <Route
          path="/grammatik/:level/:topicSlug"
          element={
            <PrivateRoute>
              <GrammarTopicPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/grammatik/:level/:topicSlug/exercise"
          element={
            <PrivateRoute>
              <GrammarExercisePage />
            </PrivateRoute>
          }
        />
        <Route path="/pruefungen" element={<PruefungenPage />} />
        <Route path="/pruefungen/exam/:examId" element={<ExamDetailsPage />} />
      </Routes>
    </Router>
  );
}

export default App;

