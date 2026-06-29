import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import TopicPage from './pages/TopicPage';
import QuizPage from './pages/QuizPage';
import AdminPage from './pages/AdminPage';
import AppLayout from './components/AppLayout';

function WithLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/home" element={<WithLayout><HomePage /></WithLayout>} />
        <Route path="/topic/:id" element={<WithLayout><TopicPage /></WithLayout>} />
        <Route path="/quiz/:topicId" element={<WithLayout><QuizPage /></WithLayout>} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}
