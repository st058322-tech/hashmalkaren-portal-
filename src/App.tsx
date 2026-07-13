import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import TopicPage from './pages/TopicPage';
import QuizPage from './pages/QuizPage';
import AdminPage from './pages/AdminPage';
import AppLayout from './components/AppLayout';

// ONE shared AppLayout instance across all app routes — preserves tab state during navigation
function AppShell() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route element={<AppShell />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/topic/:id" element={<TopicPage />} />
          <Route path="/quiz/:topicId" element={<QuizPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
