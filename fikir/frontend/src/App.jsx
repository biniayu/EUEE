// TEST: protected-route redirects, lazy-loaded chunks (Practice/Analytics/StudyPlan/QuestionBank), toast + chatbot providers.
import { lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Subjects from './pages/Subjects.jsx';
import SubjectDetail from './pages/SubjectDetail.jsx';
import LessonDetail from './pages/LessonDetail.jsx';
import PastPapers from './pages/PastPapers.jsx';
import Notifications from './pages/Notifications.jsx';
import Resources from './pages/Resources.jsx';
import SubjectsTest from './pages/SubjectsTest.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { ChatbotProvider } from './components/chatbot/ChatbotContext.jsx';
import LazyRoute from './components/LazyRoute.jsx';
import { ToastProvider } from './components/ui/ToastProvider.jsx';

/* Phase 14: Code-split heavier routes (charts, adaptive practice, large lists). */
const PracticeTest = lazy(() => import('./pages/PracticeTest.jsx'));
const Analytics = lazy(() => import('./pages/Analytics.jsx'));
const StudyPlan = lazy(() => import('./pages/StudyPlan.jsx'));
const QuestionBank = lazy(() => import('./pages/QuestionBank.jsx'));
const TutorChatbot = lazy(() => import('./components/chatbot/TutorChatbot.jsx'));

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
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
                <ProtectedRoute requireOnboarding={false}>
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
            <Route
              path="/practice"
              element={
                <ProtectedRoute>
                  <LazyRoute>
                    <PracticeTest />
                  </LazyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <LazyRoute>
                    <Analytics />
                  </LazyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/study-plan"
              element={
                <ProtectedRoute>
                  <LazyRoute>
                    <StudyPlan />
                  </LazyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/question-bank"
              element={
                <ProtectedRoute>
                  <LazyRoute>
                    <QuestionBank />
                  </LazyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/past-papers"
              element={
                <ProtectedRoute>
                  <PastPapers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resources"
              element={
                <ProtectedRoute>
                  <Resources />
                </ProtectedRoute>
              }
            />
          </Routes>
          <LazyRoute>
            <TutorChatbot />
          </LazyRoute>
        </ChatbotProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
