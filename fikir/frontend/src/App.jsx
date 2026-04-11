import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Subjects from './pages/Subjects.jsx';
import SubjectDetail from './pages/SubjectDetail.jsx';
import LessonDetail from './pages/LessonDetail.jsx';
import SubjectsTest from './pages/SubjectsTest.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { ChatbotProvider } from './components/chatbot/ChatbotContext.jsx';
import TutorChatbot from './components/chatbot/TutorChatbot.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <ChatbotProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/dev/subjects-test"
          element={
            <ProtectedRoute>
              <SubjectsTest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subjects"
          element={
            <ProtectedRoute>
              <Subjects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subjects/:subjectId"
          element={
            <ProtectedRoute>
              <SubjectDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lessons/:lessonId"
          element={
            <ProtectedRoute>
              <LessonDetail />
            </ProtectedRoute>
          }
        />
      </Routes>
      <TutorChatbot />
      </ChatbotProvider>
    </BrowserRouter>
  );
}
